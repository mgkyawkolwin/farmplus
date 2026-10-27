import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import { Purchase } from "@/models/purchase";
import { SupplierServiceClient } from "@/services/supplierService";
import SnackBar from "@/components/ui/snack-bar";
import { usePagePermission } from "@/lib/usePagePermission";

const PAGE_SIZE = 20;

function formatMoney(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} MMK`;
}

export default function SupplierPurchasesScreen() {
  const router = useRouter();
  const permissionState = usePagePermission('/suppliers/purchases');
  const { supplierId } = useLocalSearchParams<{ supplierId?: string }>();
  const service = React.useMemo(() => new SupplierServiceClient(), []);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const loadPurchases = React.useCallback(
    async (nextPage = 1, append = false) => {
      if (!supplierId) {
        router.back();
        return;
      }

      try {
        const items = await service.getSupplierPurchases(
          supplierId,
          nextPage,
          PAGE_SIZE,
        );
        setPurchases((current) => (append ? [...current, ...items] : items));
        setPage(nextPage);
        setHasMore(items.length === PAGE_SIZE);
      } catch (error) {
        if (!append) setPurchases([]);
        SnackBar.Error(
          error instanceof Error
            ? error.message
            : "Unable to load supplier purchases.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [router, service, supplierId],
  );

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void loadPurchases();
      return undefined;
    }, [loadPurchases, permissionState]),
  );

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void loadPurchases(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View
        className="bg-background border-b border-border"
        style={styles.header}
      >
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.title}>
          Supplier Purchases
        </Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-muted-foreground">Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : loading && purchases.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : purchases.length === 0 ? (
        <View style={styles.centered}>
          <Text className="text-foreground" style={styles.emptyTitle}>
            No purchases found
          </Text>
          <Text className="text-muted-foreground">
            This supplier has no purchases.
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
                void loadPurchases();
              }}
            />
          }
          onMomentumScrollEnd={({ nativeEvent }) => {
            if (
              nativeEvent.layoutMeasurement.height +
                nativeEvent.contentOffset.y >=
              nativeEvent.contentSize.height - 120
            ) {
              loadMore();
            }
          }}
        >
          {purchases.map((purchase) => (
            <Pressable
              key={purchase.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/purchases/view",
                  params: { id: purchase.id },
                })
              }
            >
              <View style={styles.topRow}>
                <Text className="text-foreground" style={styles.date}>
                  {new Date(purchase.purchaseDate).toLocaleDateString()}
                </Text>
                <Icon
                  className="text-muted-foreground"
                  as={ChevronRight}
                  size={16}
                />
              </View>
              <View style={styles.summary}>
                <View>
                  <Text className="text-muted-foreground" style={styles.label}>
                    Items
                  </Text>
                  <Text className="text-foreground" style={styles.value}>
                    {purchase.totalProducts}
                  </Text>
                </View>
                <View style={styles.total}>
                  <Text className="text-muted-foreground" style={styles.label}>
                    Total
                  </Text>
                  <Text className="text-foreground" style={styles.value}>
                    {formatMoney(purchase.netTotal)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
          {loadingMore ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : null}
          {!hasMore ? <Text style={styles.end}>End of list</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerButton: { minWidth: 40 },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  content: { padding: 12, gap: 10, paddingBottom: 24 },
  card: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 10,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  date: { flex: 1, fontSize: 14, fontWeight: "700" },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  total: { alignItems: "flex-end" },
  label: { fontSize: 11, marginBottom: 3 },
  value: { fontSize: 14, fontWeight: "700" },
  end: { textAlign: "center", color: "#64748B", fontSize: 11 },
});
