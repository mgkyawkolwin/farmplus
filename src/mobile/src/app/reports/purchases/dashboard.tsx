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
  return (
    <View>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleBlock}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {onViewAll ? (
          <Pressable style={styles.seeAll} onPress={onViewAll}>
            <Text style={styles.seeAllText}>View all</Text>
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
      SnackBar.Error(error instanceof Error ? error.message : "Unable to load purchases report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        label: date.toLocaleDateString("en-US", { month: "short" }),
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
  }, [purchases]);

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
        <Text className="text-foreground" style={styles.headerTitle}>Purchase Report</Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}><ActivityIndicator size="large" color="#16794B" /><Text className="text-muted-foreground" style={styles.stateText}>Checking permission...</Text></View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
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
          <Text style={styles.eyebrow}>Purchase analytics</Text>
          <Text style={styles.title}>Purchase overview</Text>
          <Text style={styles.subtitle}>
            {count(purchases.length)} purchase orders · filtered to the selected shop when active
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi label="Net purchases" value={money(report.totalSpend)} caption={`${count(purchases.length)} purchase orders`} icon={ShoppingCart} tone="green" />
          <Kpi label="Subtotal" value={money(report.subtotal)} caption="Before discount and tax" icon={Receipt} tone="blue" />
          <Kpi label="Average order" value={money(report.averageOrder)} caption="Net value per order" icon={ClipboardList} tone="blue" />
          <Kpi label="Spend · month" value={money(report.thisMonth)} caption={report.growth === null ? "No prior month" : `${report.growth >= 0 ? "+" : ""}${report.growth}% vs last month`} icon={TrendingUp} tone={report.growth !== null && report.growth < 0 ? "red" : "green"} />
          <Kpi label="Orders · 30 days" value={count(report.ordersLast30)} caption="Purchase orders" icon={CalendarDays} tone="blue" />
          <Kpi label="Units purchased" value={count(report.totalUnits)} caption={`${count(report.averageUnits)} avg units per order`} icon={Package} tone="green" />
          <Kpi label="Discounts" value={money(report.discounts)} caption="Applied to purchase orders" icon={Percent} tone="amber" />
          <Kpi label="Purchase tax" value={money(report.taxes)} caption="Across all purchase orders" icon={Banknote} tone="blue" />
          <Kpi label="Daily average" value={money(report.averageDailySpend)} caption="On purchasing days" icon={Wallet} tone="green" />
          <Kpi label="Largest order" value={money(report.largestOrder?.netTotal ?? 0)} caption={report.largestOrder?.supplierName ?? "No purchases"} icon={TrendingUp} tone="amber" />
        </View>

        <Section title="Purchase spend trend" subtitle="Last 12 months · net purchase value">
          <LineChart
            labels={report.months.map((month) => month.label)}
            series={[{ name: "Net purchases", color: COLORS.green, values: report.months.map((month) => month.spend) }]}
          />
        </Section>

        <Section title="Order volume" subtitle="Purchase orders by month">
          <BarChart
            data={report.months.map((month) => ({ label: month.label, values: [month.orders] }))}
            series={[{ name: "Purchase orders", color: COLORS.blue }]}
            height={160}
          />
        </Section>

        <Section title="Purchases by supplier" subtitle="Share of net spend">
          <DonutChart
            centerLabel="Purchases"
            centerValue={compactNumber(report.totalSpend)}
            slices={report.supplierList.slice(0, 5).map((supplier, index) => ({
              label: supplier.name,
              value: supplier.spend,
              color: [COLORS.green, COLORS.blue, COLORS.amber, COLORS.purple, COLORS.red][index],
            })).concat(report.supplierList.length > 5 ? [{
              label: "Other",
              value: Math.max(report.totalSpend - report.supplierList.slice(0, 5).reduce((sum, supplier) => sum + supplier.spend, 0), 0),
              color: COLORS.slate,
            }] : [])}
            formatValue={money}
          />
        </Section>

        <Section title="Purchase cost components" subtitle="Subtotal, discounts, and tax">
          <BarChart
            data={[{ label: "All orders", values: [report.subtotal, report.discounts, report.taxes] }]}
            series={[
              { name: "Subtotal", color: COLORS.blue },
              { name: "Discounts", color: COLORS.amber },
              { name: "Tax", color: COLORS.green },
            ]}
            height={160}
          />
        </Section>

        <Section title="Spend concentration" subtitle="Top suppliers by lifetime purchase value">
          <RankedBars
            items={report.supplierList.slice(0, 6).map((supplier) => ({
              label: supplier.name,
              value: supplier.spend,
              caption: `${count(supplier.orders)} orders · ${count(supplier.units)} units · ${percent(supplier.spend, report.totalSpend)}% of spend`,
            }))}
            color={COLORS.green}
            formatValue={money}
            emptyText="No purchase orders to display."
          />
        </Section>

        <Section title="Most purchased products" subtitle="By line value">
          <RankedBars
            items={report.productList.slice(0, 8).map((product) => ({
              label: product.name,
              value: product.spend,
              caption: `${count(product.units)} units · ${count(product.orders)} purchase lines`,
            }))}
            color={COLORS.blue}
            formatValue={money}
            emptyText="No purchase line items to display."
          />
        </Section>

        <Section title="Purchases by shop" subtitle="Net spend and order count">
          <RankedBars
            items={report.shopList.slice(0, 8).map((shop) => ({
              label: shop.name,
              value: shop.spend,
              caption: `${count(shop.orders)} orders · ${count(shop.units)} units`,
            }))}
            color={COLORS.purple}
            formatValue={money}
            emptyText="No shop details available on purchases."
          />
        </Section>

        <Section title="Recent purchase orders" subtitle="Latest purchases" onViewAll={() => router.push(purchaseListRoute)}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Supplier</Text>
              <Text style={[styles.th, styles.tdNum]}>Date</Text>
              <Text style={[styles.th, styles.tdNum]}>Total</Text>
            </View>
            {report.recentPurchases.map((purchase) => (
              <Pressable key={purchase.id} style={styles.tableRow} onPress={() => openPurchase(purchase.id)}>
                <View style={styles.tdWide}>
                  <Text style={styles.td} numberOfLines={1}>{purchase.supplierName}</Text>
                  <Text style={styles.tdSub} numberOfLines={1}>{count(purchase.totalProducts)} units · {purchase.shopName || "Shop unavailable"}</Text>
                </View>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{new Date(timestamp(purchase.purchaseDate)).toLocaleDateString()}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{compactNumber(purchase.netTotal)}</Text>
              </Pressable>
            ))}
            {report.recentPurchases.length === 0 ? <Text style={styles.empty}>No purchase orders recorded.</Text> : null}
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