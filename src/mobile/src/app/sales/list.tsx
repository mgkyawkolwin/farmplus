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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import LoadingOverlay from "@/components/loadingOverlay";
import SnackBar from "@/components/ui/snack-bar";
import ShopBanner from "@/components/shopBanner";
import { useSelectedShopName } from "@/lib/useSelectedShopName";
import { container, DI_TOKENS } from "@/di";
import { Sale } from "@/models/sale";
import { ISaleService } from "@/services/saleService";
import { usePagePermission } from "@/lib/usePagePermission";
import { THEME } from "@/lib/theme";
import { useTranslation } from 'react-i18next';

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);
const PAGE_SIZE = 20;

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

type ThemeColors = typeof THEME.light;

function getStatus(sale: Sale, theme: ThemeColors, t: (key: string) => string) {
  if (sale.status === "Voided")
    return { label: t('sales.status.void'), color: theme.destructive, bg: theme.secondary };
  if (sale.paidAmount > 0 && sale.balance <= 0)
    return { label: t('sales.status.paid'), color: theme.chart2, bg: theme.secondary };
  return { label: t('sales.status.unpaid'), color: theme.chart4, bg: theme.secondary };
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

export default function SalesListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: "light" };
  const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/sales/list');
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const { shopName, shopLoaded } = useSelectedShopName();
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const loadSales = React.useCallback(
    async (nextPage = 1, append = false) => {
      try {
        const result = await saleService.getSales(
          nextPage,
          PAGE_SIZE,
          customerId,
        );
        setSales((current) => (append ? [...current, ...result] : result));
        setPage(nextPage);
        setHasMore(result.length === PAGE_SIZE);
      } catch (error) {
        if (!append) setSales([]);
        SnackBar.Error(
          error instanceof Error ? error.message : t('sales.messages.unableLoad'),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [customerId, t],
  );

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void loadSales();
      return undefined;
    }, [loadSales, permissionState]),
  );

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void loadSales(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && sales.length > 0} />
      <View
        className="bg-background border-b border-border"
        style={styles.headerBar}
      >
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <View style={styles.headerTitleWrap}>
          <Text className="text-foreground" style={styles.headerTitle}>
            {t('sales.list.title')}
          </Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('sales.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('sales.unauthorized.title')} message={t('sales.unauthorized.description')} />
      ) : <>
      <View style={styles.shopBannerWrap}>
        <ShopBanner
          label={t('sales.list.showingSalesFor')}
          name={shopName}
          emptyText={
            shopLoaded
              ? t('sales.shop.noShopSelected')
              : undefined
          }
        />
      </View>

      {loading && sales.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>
            {t('sales.list.loading')}
          </Text>
        </View>
      ) : sales.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>
            {t('sales.list.noSales')}
          </Text>
          <Text className="text-muted-foreground" style={styles.stateText}>
            {t('sales.list.noSalesDescription')}
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
                void loadSales();
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
          {sales.map((sale) => {
            const status = getStatus(sale, theme, t);
            const isVoided = sale.status === "Voided";
            return (
              <Pressable
                key={sale.id}
                accessibilityRole="button"
                accessibilityLabel={t('sales.accessibility.sale', { id: sale.id.slice(0, 8) })}
                style={[styles.saleRow, { backgroundColor: isVoided ? theme.secondary : theme.card, borderColor: theme.border }, isVoided && styles.saleRowVoided]}
                onPress={() =>
                  router.push({
                    pathname: "/sales/view",
                    params: { id: sale.id },
                  })
                }
              >
                <View style={styles.saleTopRow}>
                  <Text style={[styles.saleId, { color: theme.foreground }]}>
                    #{sale.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <View
                    style={[styles.statusPill, { backgroundColor: status.bg }]}
                  >
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                  <Text style={[styles.saleDate, { color: theme.mutedForeground }]}>
                    {formatDate(sale.saleDate)}
                  </Text>
                  <Icon
                    className="text-muted-foreground"
                    as={ChevronRight}
                    size={14}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldWide}>
                    <Field label={t('sales.fields.customer')} value={sale.customerName} theme={theme} />
                  </View>
                  <Field
                    label={t('sales.fields.products')}
                    value={sale.totalProducts}
                    align="right"
                    theme={theme}
                  />
                  <Field
                    label={t('sales.fields.saleQuantity')}
                    value={sale.totalProducts}
                    align="right"
                    theme={theme}
                  />
                </View>

                <View style={[styles.amountRow, { borderTopColor: theme.border }]}>
                  <Field
                    label={t('sales.fields.net')}
                    value={money(sale.netTotal)}
                    align="right"
                    theme={theme}
                  />
                  <Field
                    label={t('sales.fields.paid')}
                    value={money(sale.paidAmount)}
                    align="right"
                    theme={theme}
                  />
                  <View style={[styles.field, styles.fieldRight]}>
                    <Text style={[styles.fieldLabel, { color: theme.mutedForeground }, styles.textRight]}>
                      {t('sales.fields.balance')}
                    </Text>
                    <Text
                      style={[
                        styles.fieldValue,
                        styles.textRight,
                        {
                          color: isVoided
                            ? theme.mutedForeground
                            : sale.balance > 0
                              ? theme.chart4
                              : theme.chart2,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {money(sale.balance)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
          {loadingMore ? (
            <ActivityIndicator
              style={styles.loadMore}
              size="small"
              color={theme.chart2}
            />
          ) : null}
          {!hasMore ? <Text style={[styles.endNote, { color: theme.mutedForeground }]}>{t('sales.list.endOfList')}</Text> : null}
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
  saleRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  saleRowVoided: { opacity: 0.7 },
  saleTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  saleId: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  saleDate: { fontSize: 10 },
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
