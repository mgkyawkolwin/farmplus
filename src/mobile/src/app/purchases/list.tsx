"use client";

import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import SnackBar from "@/components/ui/snack-bar";
import LoadingOverlay from "@/components/loadingOverlay";
import { container, DI_TOKENS } from "@/di";
import { Purchase } from "@/models/purchase";
import { IPurchaseService } from "@/services/purchaseService";
import { useSelectedShopChanged } from "@/lib/selectedShop";
import { getSelectedShopId } from "@/lib/authStorage";
import { ShopServiceClient } from "@/services/shopService";
import ShopBanner from "@/components/shopBanner";
import { usePagePermission } from "@/lib/usePagePermission";
import { THEME } from "@/lib/theme";

const purchaseService = container.resolve<IPurchaseService>(
  DI_TOKENS.IPurchaseService,
);
const PAGE_SIZE = 20;
const shopService = new ShopServiceClient();

type ThemeColors = typeof THEME.light;

function money(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function Field({
  label,
  value,
  align,
  theme,
}: {
  label: string;
  value: string | number;
  align?: "left" | "right";
  theme: ThemeColors;
}) {
  return (
    <View style={[styles.field, align === "right" && styles.fieldRight]}>
      <Text style={[styles.fieldLabel, { color: theme.mutedForeground }, align === "right" && styles.textRight]}>
        {label}
      </Text>
      <Text
        style={[styles.fieldValue, { color: theme.foreground }, align === "right" && styles.textRight]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export default function PurchaseListScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: "light" };
  const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/purchases/list');
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [shopName, setShopName] = React.useState<string | null>(null);

  const loadShopName = React.useCallback(async () => {
    if (permissionState !== 'authorized') return;
    try {
      const [shopId, shops] = await Promise.all([
        getSelectedShopId(),
        shopService.getShops(1, 200),
      ]);
      setShopName(shops.find((shop) => shop.id === shopId)?.name ?? null);
    } catch {
      setShopName(null);
    }
  }, [permissionState]);

  const fetchPurchases = React.useCallback(
    async (nextPage = 1, append = false) => {
      if (permissionState !== 'authorized') return;
      try {
        const result = await purchaseService.getPurchases(nextPage, PAGE_SIZE);
        setPurchases((current) => (append ? [...current, ...result] : result));
        setHasMore(result.length === PAGE_SIZE);
        setPage(nextPage);
      } catch {
        if (!append) setPurchases([]);
        SnackBar.Error("Failed to load purchases");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [permissionState],
  );

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void fetchPurchases();
      void loadShopName();
      return undefined;
    }, [fetchPurchases, loadShopName, permissionState]),
  );

  // The API scopes purchases to the selected shop, so reload when it changes.
  useSelectedShopChanged(() => {
    if (permissionState !== 'authorized') return;
    setLoading(true);
    void fetchPurchases();
    void loadShopName();
  }, [permissionState, fetchPurchases, loadShopName]);

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void fetchPurchases(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && purchases.length > 0} />
      <View
        className="bg-background border-b border-border"
        style={styles.headerBar}
      >
        <Button
          variant="ghost"
          onPress={() => router.back()}
          disabled={permissionState !== 'authorized'}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <View style={styles.headerTitleWrap}>
          <Text className="text-foreground" style={styles.headerTitle}>
            Purchases
          </Text>
        </View>
        <Button
          variant="ghost"
          onPress={() =>
            router.push("/purchases/new" as Parameters<typeof router.push>[0])
          }
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Plus} size={20} />
        </Button>
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : <>
      <View style={styles.shopBannerWrap}>
        <ShopBanner
          label="Showing purchases for"
          name={shopName}
          emptyText="No shop selected. Choose one from the top bar."
        />
      </View>

      {loading && purchases.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>
            Loading purchases...
          </Text>
        </View>
      ) : purchases.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>
            No purchases found
          </Text>
          <Text className="text-muted-foreground" style={styles.stateText}>
            Add a purchase to record incoming stock.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void fetchPurchases();
              }}
            />
          }
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              event.nativeEvent;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 120
            )
              loadMore();
          }}
        >
          {purchases.map((purchase) => (
            <Pressable
              key={purchase.id}
              accessibilityRole="button"
              accessibilityLabel={`Purchase from ${purchase.supplierName}`}
              style={[styles.purchaseRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() =>
                router.push({
                  pathname: "/purchases/view",
                  params: { id: purchase.id },
                } as Parameters<typeof router.push>[0])
              }
            >
              <View style={styles.topRow}>
                <Text style={[styles.purchaseId, { color: theme.foreground }]}>
                  #{purchase.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text style={[styles.purchaseDate, { color: theme.mutedForeground }]}>
                  {formatDate(purchase.purchaseDate)}
                </Text>
                <Icon
                  className="text-muted-foreground"
                  as={ChevronRight}
                  size={14}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldWide}>
                  <Field label="Supplier" value={purchase.supplierName} theme={theme} />
                </View>
                <Field
                  label="Products"
                  value={purchase.totalProducts}
                  align="right"
                  theme={theme}
                />
              </View>

              <View style={[styles.amountRow, { borderTopColor: theme.border }]}>
                <Field
                  label="Sub Total"
                  value={money(purchase.subTotal)}
                  align="right"
                  theme={theme}
                />
                <Field
                  label="Discount"
                  value={money(purchase.discount)}
                  align="right"
                  theme={theme}
                />
                <Field
                  label="Net Total"
                  value={money(purchase.netTotal)}
                  align="right"
                  theme={theme}
                />
              </View>
            </Pressable>
          ))}
          {loadingMore ? (
            <ActivityIndicator
              style={styles.loadMore}
              size="small"
              color={theme.chart2}
            />
          ) : null}
          {!hasMore ? <Text style={[styles.endNote, { color: theme.mutedForeground }]}>End of list</Text> : null}
        </ScrollView>
      )}
      </>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButton: { minWidth: 44 },
  headerTitleWrap: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  shopBannerWrap: { paddingHorizontal: 10, paddingTop: 10 },
  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  purchaseRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  purchaseId: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  purchaseDate: { fontSize: 10 },
  fieldRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  fieldWide: { flex: 1, minWidth: 0 },
  amountRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  field: { flex: 1, minWidth: 0 },
  fieldRight: { alignItems: "flex-end" },
  fieldLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValue: { fontSize: 12.5, fontWeight: "700" },
  textRight: { textAlign: "right" },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  stateTitle: { fontSize: 17, fontWeight: "600" },
  stateText: { marginTop: 8, textAlign: "center" },
  loadMore: { marginVertical: 12 },
  endNote: {
    textAlign: "center",
    fontSize: 10,
    marginVertical: 8,
  },
});
