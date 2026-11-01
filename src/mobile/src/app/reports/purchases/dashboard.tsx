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
import { useFocusEffect, useRouter, type Href } from "expo-router";
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Package,
  Percent,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BarChart,
  DonutChart,
  LineChart,
  RankedBars,
  compactNumber,
} from "@/components/charts";
import LoadingOverlay from "@/components/loadingOverlay";
import UnauthorizedView from "@/components/unauthorized-view";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import SnackBar from "@/components/ui/snack-bar";
import { container, DI_TOKENS } from "@/di";
import { Purchase } from "@/models/purchase";
import { IPurchaseService } from "@/services/purchaseService";
import { usePagePermission } from "@/lib/usePagePermission";
import { useTranslation } from 'react-i18next';

const purchaseService = container.resolve<IPurchaseService>(DI_TOKENS.IPurchaseService);

const COLORS = {
  ink: "#0F172A",
  muted: "#64748B",
  border: "#D9DEE5",
  green: "#16794B",
  blue: "#2367A8",
  amber: "#9A6700",
  red: "#B42318",
  purple: "#7C3AED",
  slate: "#94A3B8",
};

type Tone = "green" | "blue" | "amber" | "red";

const TONES: Record<Tone, { fg: string; bg: string; border: string }> = {
  green: { fg: "#16794B", bg: "#F4FAF6", border: "#D5E9DC" },
  blue: { fg: "#2367A8", bg: "#F3F8FC", border: "#D6E6F3" },
  amber: { fg: "#9A6700", bg: "#FFFAEE", border: "#EFE2BF" },
  red: { fg: "#B42318", bg: "#FFF5F4", border: "#F0D8D5" },
};

const PAGE_SIZE = 500;
const DAY = 86_400_000;

function money(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} MMK`;
}

function count(value: number) {
  return value.toLocaleString("en-US");
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function timestamp(value?: string) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function Section({
  title,
  subtitle,
  onViewAll,
  children,
}: {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleBlock}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {onViewAll ? (
          <Pressable style={styles.seeAll} onPress={onViewAll}>
            <Text style={styles.seeAllText}>{t('reports.common.viewAll')}</Text>
            <ChevronRight size={14} color={COLORS.green} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.panel}>{children}</View>
    </View>
  );
}

function Kpi({
  label,
  value,
  caption,
  icon: IconComponent,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Wallet;
  tone: Tone;
}) {
  const palette = TONES[tone];
  return (
    <View
      style={[
        styles.kpi,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderTopColor: palette.fg,
        },
      ]}
    >
      <View style={styles.kpiHeader}>
        <View style={styles.kpiIcon}>
          <IconComponent size={16} color={palette.fg} />
        </View>
        <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      <Text style={styles.kpiCaption} numberOfLines={1}>{caption}</Text>
    </View>
  );
}

type SupplierStats = { name: string; orders: number; spend: number; units: number };
type ProductStats = { id: string; name: string; orders: number; spend: number; units: number };

export default function PurchaseReportDashboardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const permissionState = usePagePermission('/reports/purchases/dashboard');
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const all: Purchase[] = [];
      let page = 1;
      while (true) {
        const next = await purchaseService.getPurchases(page, PAGE_SIZE);
        all.push(...next);
        if (next.length < PAGE_SIZE) break;
        page += 1;
      }
      setPurchases(all);
    } catch (error) {
      setPurchases([]);
      SnackBar.Error(error instanceof Error ? error.message : t('reports.common.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void load();
      return undefined;
    }, [load, permissionState]),
  );

  const report = React.useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const currentMonth = monthKey(now);
    const totalSpend = purchases.reduce((sum, purchase) => sum + purchase.netTotal, 0);
    const subtotal = purchases.reduce((sum, purchase) => sum + purchase.subTotal, 0);
    const discounts = purchases.reduce((sum, purchase) => sum + purchase.discount, 0);
    const taxes = purchases.reduce((sum, purchase) => sum + purchase.tax, 0);
    const totalUnits = purchases.reduce((sum, purchase) => sum + purchase.totalProducts, 0);
    const averageOrder = purchases.length ? totalSpend / purchases.length : 0;
    const averageUnits = purchases.length ? totalUnits / purchases.length : 0;

    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: monthKey(date),
        label: date.toLocaleDateString(i18n.language, { month: "short" }),
        spend: 0,
        orders: 0,
        suppliers: new Set<string>(),
        units: 0,
      };
    });
    const monthBuckets = new Map(months.map((month) => [month.key, month]));
    const supplierMap = new Map<string, SupplierStats>();
    const productMap = new Map<string, ProductStats>();
    const shopMap = new Map<string, { orders: number; spend: number; units: number }>();

    purchases.forEach((purchase) => {
      const month = monthBuckets.get(monthKey(new Date(timestamp(purchase.purchaseDate))));
      if (month) {
        month.spend += purchase.netTotal;
        month.orders += 1;
        month.units += purchase.totalProducts;
        month.suppliers.add(purchase.supplierId);
      }

      const supplier = supplierMap.get(purchase.supplierId) ?? {
        name: purchase.supplierName,
        orders: 0,
        spend: 0,
        units: 0,
      };
      supplier.orders += 1;
      supplier.spend += purchase.netTotal;
      supplier.units += purchase.totalProducts;
      supplierMap.set(purchase.supplierId, supplier);

      const shopName = purchase.shopName?.trim() || "Unknown shop";
      const shop = shopMap.get(shopName) ?? { orders: 0, spend: 0, units: 0 };
      shop.orders += 1;
      shop.spend += purchase.netTotal;
      shop.units += purchase.totalProducts;
      shopMap.set(shopName, shop);

      purchase.items.forEach((line) => {
        const id = line.productId || line.productName;
        const product = productMap.get(id) ?? {
          id,
          name: line.productName,
          orders: 0,
          spend: 0,
          units: 0,
        };
        product.orders += 1;
        product.spend += line.lineTotal;
        product.units += line.quantity;
        productMap.set(id, product);
      });
    });

    const thisMonth = monthBuckets.get(currentMonth)?.spend ?? 0;
    const lastMonth = months[months.length - 2]?.spend ?? 0;
    const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
    const ordersLast30 = purchases.filter((purchase) => nowMs - timestamp(purchase.purchaseDate) <= 30 * DAY).length;
    const supplierList = [...supplierMap.entries()]
      .map(([id, value]) => ({ id, ...value }))
      .sort((left, right) => right.spend - left.spend);
    const productList = [...productMap.values()].sort((left, right) => right.spend - left.spend);
    const shopList = [...shopMap.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((left, right) => right.spend - left.spend);
    const top5Spend = supplierList.slice(0, 5).reduce((sum, supplier) => sum + supplier.spend, 0);
    const recentPurchases = [...purchases]
      .sort((left, right) => timestamp(right.purchaseDate) - timestamp(left.purchaseDate))
      .slice(0, 8);
    const largestOrder = [...purchases].sort((left, right) => right.netTotal - left.netTotal)[0];
    const dailySales = new Set(purchases.map((purchase) => new Date(timestamp(purchase.purchaseDate)).toDateString())).size;
    const averageDailySpend = dailySales > 0 ? totalSpend / dailySales : 0;

    return {
      totalSpend,
      subtotal,
      discounts,
      taxes,
      totalUnits,
      averageOrder,
      averageUnits,
      months,
      thisMonth,
      growth,
      ordersLast30,
      supplierList,
      productList,
      shopList,
      top5Share: percent(top5Spend, totalSpend),
      recentPurchases,
      largestOrder,
      averageDailySpend,
    };
  }, [purchases, i18n.language]);

  const purchaseListRoute = "/purchases/list" as Href;
  const openPurchase = (id: string) =>
    router.push({ pathname: "/purchases/view", params: { id } } as Href);

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <LoadingOverlay isLoading={permissionState === 'authorized' && loading} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{t('reports.purchases.title')}</Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}><ActivityIndicator size="large" color="#16794B" /><Text className="text-muted-foreground" style={styles.stateText}>{t('reports.common.checkingPermission')}</Text></View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('reports.common.unauthorizedTitle')} message={t('reports.common.unauthorizedDescription')} />
      ) : <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void load();
          }} />
        }
      >
        <View>
          <Text style={styles.eyebrow}>{t('reports.purchases.eyebrow')}</Text>
          <Text style={styles.title}>{t('reports.purchases.overview')}</Text>
          <Text style={styles.subtitle}>
            {t('reports.purchases.subtitle', { count: count(purchases.length) })}
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi label={t('reports.purchases.kpi.netPurchases')} value={money(report.totalSpend)} caption={t('reports.purchases.caption.orderCount', { count: count(purchases.length) })} icon={ShoppingCart} tone="green" />
          <Kpi label={t('reports.purchases.kpi.subtotal')} value={money(report.subtotal)} caption={t('reports.purchases.caption.beforeDiscountTax')} icon={Receipt} tone="blue" />
          <Kpi label={t('reports.purchases.kpi.averageOrder')} value={money(report.averageOrder)} caption={t('reports.purchases.caption.netPerOrder')} icon={ClipboardList} tone="blue" />
          <Kpi label={t('reports.purchases.kpi.spendMonth')} value={money(report.thisMonth)} caption={report.growth === null ? t('reports.purchases.caption.noPriorMonth') : t('reports.purchases.caption.growth', { growth: `${report.growth >= 0 ? "+" : ""}${report.growth}` })} icon={TrendingUp} tone={report.growth !== null && report.growth < 0 ? "red" : "green"} />
          <Kpi label={t('reports.purchases.kpi.orders30')} value={count(report.ordersLast30)} caption={t('reports.purchases.caption.purchaseOrders')} icon={CalendarDays} tone="blue" />
          <Kpi label={t('reports.purchases.kpi.unitsPurchased')} value={count(report.totalUnits)} caption={t('reports.purchases.caption.avgUnits', { count: count(report.averageUnits) })} icon={Package} tone="green" />
          <Kpi label={t('reports.purchases.kpi.discounts')} value={money(report.discounts)} caption={t('reports.purchases.caption.appliedDiscounts')} icon={Percent} tone="amber" />
          <Kpi label={t('reports.purchases.kpi.purchaseTax')} value={money(report.taxes)} caption={t('reports.purchases.caption.acrossOrders')} icon={Banknote} tone="blue" />
          <Kpi label={t('reports.purchases.kpi.dailyAverage')} value={money(report.averageDailySpend)} caption={t('reports.purchases.caption.purchasingDays')} icon={Wallet} tone="green" />
          <Kpi label={t('reports.purchases.kpi.largestOrder')} value={money(report.largestOrder?.netTotal ?? 0)} caption={report.largestOrder?.supplierName ?? t('reports.purchases.caption.noPurchases')} icon={TrendingUp} tone="amber" />
        </View>

        <Section title={t('reports.purchases.section.spendTrend')} subtitle={t('reports.purchases.subtitleSection.spendTrend')}>
          <LineChart
            labels={report.months.map((month) => month.label)}
            series={[{ name: t('reports.purchases.series.netPurchases'), color: COLORS.green, values: report.months.map((month) => month.spend) }]}
          />
        </Section>

        <Section title={t('reports.purchases.section.orderVolume')} subtitle={t('reports.purchases.subtitleSection.ordersByMonth')}>
          <BarChart
            data={report.months.map((month) => ({ label: month.label, values: [month.orders] }))}
            series={[{ name: t('reports.purchases.series.purchaseOrders'), color: COLORS.blue }]}
            height={160}
          />
        </Section>

        <Section title={t('reports.purchases.section.bySupplier')} subtitle={t('reports.purchases.subtitleSection.shareSpend')}>
          <DonutChart
            centerLabel={t('reports.purchases.chart.purchases')}
            centerValue={compactNumber(report.totalSpend)}
            slices={report.supplierList.slice(0, 5).map((supplier, index) => ({
              label: supplier.name,
              value: supplier.spend,
              color: [COLORS.green, COLORS.blue, COLORS.amber, COLORS.purple, COLORS.red][index],
            })).concat(report.supplierList.length > 5 ? [{
              label: t('reports.purchases.chart.other'),
              value: Math.max(report.totalSpend - report.supplierList.slice(0, 5).reduce((sum, supplier) => sum + supplier.spend, 0), 0),
              color: COLORS.slate,
            }] : [])}
            formatValue={money}
          />
        </Section>

        <Section title={t('reports.purchases.section.costComponents')} subtitle={t('reports.purchases.subtitleSection.components')}>
          <BarChart
            data={[{ label: t('reports.purchases.chart.allOrders'), values: [report.subtotal, report.discounts, report.taxes] }]}
            series={[
              { name: t('reports.purchases.series.subtotal'), color: COLORS.blue },
              { name: t('reports.purchases.series.discounts'), color: COLORS.amber },
              { name: t('reports.purchases.series.tax'), color: COLORS.green },
            ]}
            height={160}
          />
        </Section>

        <Section title={t('reports.purchases.section.spendConcentration')} subtitle={t('reports.purchases.subtitleSection.topSuppliers')}>
          <RankedBars
            items={report.supplierList.slice(0, 6).map((supplier) => ({
              label: supplier.name,
              value: supplier.spend,
              caption: t('reports.purchases.labels.shareSpend', { count: count(supplier.orders), units: count(supplier.units), percent: percent(supplier.spend, report.totalSpend) }),
            }))}
            color={COLORS.green}
            formatValue={money}
            emptyText={t('reports.purchases.empty.noOrdersToDisplay')}
          />
        </Section>

        <Section title={t('reports.purchases.section.mostPurchased')} subtitle={t('reports.purchases.subtitleSection.byLineValue')}>
          <RankedBars
            items={report.productList.slice(0, 8).map((product) => ({
              label: product.name,
              value: product.spend,
              caption: t('reports.purchases.labels.lineItems', { count: count(product.orders) }),
            }))}
            color={COLORS.blue}
            formatValue={money}
            emptyText={t('reports.purchases.empty.noLineItems')}
          />
        </Section>

        <Section title={t('reports.purchases.section.byShop')} subtitle={t('reports.purchases.subtitleSection.netSpendOrders')}>
          <RankedBars
            items={report.shopList.slice(0, 8).map((shop) => ({
              label: shop.name === 'Unknown shop' ? t('reports.purchases.labels.unknownShop') : shop.name,
              value: shop.spend,
              caption: t('reports.purchases.labels.ordersUnits', { orders: count(shop.orders), units: count(shop.units) }),
            }))}
            color={COLORS.purple}
            formatValue={money}
            emptyText={t('reports.purchases.empty.noShopDetails')}
          />
        </Section>

        <Section title={t('reports.purchases.section.recentOrders')} subtitle={t('reports.purchases.subtitleSection.latestPurchases')} onViewAll={() => router.push(purchaseListRoute)}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>{t('reports.purchases.field.supplier')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.purchases.field.date')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.purchases.field.total')}</Text>
            </View>
            {report.recentPurchases.map((purchase) => (
              <Pressable key={purchase.id} style={styles.tableRow} onPress={() => openPurchase(purchase.id)}>
                <View style={styles.tdWide}>
                  <Text style={styles.td} numberOfLines={1}>{purchase.supplierName}</Text>
                  <Text style={styles.tdSub} numberOfLines={1}>{t('reports.purchases.labels.units', { count: count(purchase.totalProducts) })} · {purchase.shopName || t('reports.purchases.labels.shopUnavailable')}</Text>
                </View>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{new Date(timestamp(purchase.purchaseDate)).toLocaleDateString()}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{compactNumber(purchase.netTotal)}</Text>
              </Pressable>
            ))}
            {report.recentPurchases.length === 0 ? <Text style={styles.empty}>{t('reports.purchases.empty.noOrders')}</Text> : null}
          </View>
        </Section>
      </ScrollView>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 6 },
  headerButton: { minWidth: 40 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", color: COLORS.green },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.ink },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: { width: "48%", padding: 12, gap: 6, borderWidth: 1, borderTopWidth: 3, borderRadius: 6 },
  kpiHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  kpiIcon: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  kpiLabel: { flex: 1, fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase", color: COLORS.muted },
  kpiValue: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  kpiCaption: { fontSize: 11, color: COLORS.muted },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionTitleBlock: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.ink },
  sectionSubtitle: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: "700", color: COLORS.green },
  panel: { padding: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, backgroundColor: "#FFFFFF" },
  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, overflow: "hidden" },
  tableHeader: { flexDirection: "row", alignItems: "center", minHeight: 30, paddingHorizontal: 10, gap: 6, backgroundColor: "#F1F5F9" },
  th: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase", color: COLORS.muted },
  tableRow: { flexDirection: "row", alignItems: "center", minHeight: 40, paddingHorizontal: 10, paddingVertical: 6, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#CBD5E1" },
  td: { fontSize: 12, color: COLORS.ink },
  tdSub: { fontSize: 10, color: COLORS.muted },
  tdWide: { flex: 2, minWidth: 0 },
  tdNum: { flex: 1.2, textAlign: "right" },
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { marginTop: 8, textAlign: "center" },
  empty: { padding: 14, textAlign: "center", fontSize: 12, color: COLORS.muted },
});