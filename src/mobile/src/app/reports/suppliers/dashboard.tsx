"use client";

import * as React from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import {
  AlertTriangle,
  Building,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Package,
  Percent,
  Repeat,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  UserRoundCheck,
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
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import SnackBar from "@/components/ui/snack-bar";
import { container, DI_TOKENS } from "@/di";
import { Purchase } from "@/models/purchase";
import { Supplier } from "@/models/supplier";
import { IPurchaseService } from "@/services/purchaseService";
import { SupplierServiceClient } from "@/services/supplierService";

const supplierService = new SupplierServiceClient();
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
const DORMANT_DAYS = 90;

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

type SupplierStats = {
  id: string;
  name: string;
  isActive: boolean;
  location: string;
  orders: number;
  spend: number;
  units: number;
  last: number;
};

type PurchasedProduct = {
  id: string;
  name: string;
  units: number;
  spend: number;
  orders: number;
};

export default function SupplierReportDashboardScreen() {
  const router = useRouter();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    const [supplierResult, purchaseResult] = await Promise.allSettled([
      (async () => {
        const all: Supplier[] = [];
        let page = 1;
        while (true) {
          const next = await supplierService.getSuppliers(page, PAGE_SIZE);
          all.push(...next);
          if (next.length < PAGE_SIZE) break;
          page += 1;
        }
        return all;
      })(),
      (async () => {
        const all: Purchase[] = [];
        let page = 1;
        while (true) {
          const next = await purchaseService.getPurchases(page, PAGE_SIZE);
          all.push(...next);
          if (next.length < PAGE_SIZE) break;
          page += 1;
        }
        return all;
      })(),
    ]);

    if (supplierResult.status === "rejected" && purchaseResult.status === "rejected") {
      SnackBar.Error("Unable to load supplier report");
    }
    setSuppliers(supplierResult.status === "fulfilled" ? supplierResult.value : []);
    setPurchases(purchaseResult.status === "fulfilled" ? purchaseResult.value : []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void load();
      return undefined;
    }, [load]),
  );

  const report = React.useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const currentMonth = monthKey(now);
    const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
    const stats = new Map<string, SupplierStats>();
    suppliers.forEach((supplier) => {
      stats.set(supplier.id, {
        id: supplier.id,
        name: supplier.supplierName,
        isActive: supplier.isActive !== false,
        location: [supplier.city, supplier.stateDivision, supplier.country].filter(Boolean).join(", ") || "No location",
        orders: 0,
        spend: 0,
        units: 0,
        last: 0,
      });
    });

    const monthlyPurchases = new Map<number, { spend: number; orders: number; suppliers: Set<string> }>();
    const productMap = new Map<string, PurchasedProduct>();
    const supplierPurchases = purchases.filter((purchase) => purchase.supplierId);
    supplierPurchases.forEach((purchase) => {
      const supplier = supplierById.get(purchase.supplierId);
      const entry = stats.get(purchase.supplierId) ?? {
        id: purchase.supplierId,
        name: supplier?.supplierName ?? purchase.supplierName,
        isActive: supplier?.isActive !== false,
        location: [supplier?.city, supplier?.stateDivision, supplier?.country].filter(Boolean).join(", ") || "No location",
        orders: 0,
        spend: 0,
        units: 0,
        last: 0,
      };
      entry.orders += 1;
      entry.spend += purchase.netTotal;
      entry.units += purchase.totalProducts;
      entry.last = Math.max(entry.last, timestamp(purchase.purchaseDate));
      stats.set(purchase.supplierId, entry);

      const key = monthKey(new Date(timestamp(purchase.purchaseDate)));
      const month = monthlyPurchases.get(key) ?? { spend: 0, orders: 0, suppliers: new Set<string>() };
      month.spend += purchase.netTotal;
      month.orders += 1;
      month.suppliers.add(purchase.supplierId);
      monthlyPurchases.set(key, month);

      purchase.items.forEach((line) => {
        const productKey = line.productId || line.productName;
        const product = productMap.get(productKey) ?? {
          id: productKey,
          name: line.productName,
          units: 0,
          spend: 0,
          orders: 0,
        };
        product.units += line.quantity;
        product.spend += line.lineTotal;
        product.orders += 1;
        productMap.set(productKey, product);
      });
    });

    const statList = [...stats.values()];
    const totalSpend = supplierPurchases.reduce((sum, purchase) => sum + purchase.netTotal, 0);
    const totalUnits = supplierPurchases.reduce((sum, purchase) => sum + purchase.totalProducts, 0);
    const avgOrder = supplierPurchases.length ? totalSpend / supplierPurchases.length : 0;
    const buyingSuppliers = statList.filter((supplier) => supplier.orders > 0).length;
    const repeatSuppliers = statList.filter((supplier) => supplier.orders >= 2).length;
    const activeBuyers = statList.filter((supplier) => supplier.orders > 0 && nowMs - supplier.last <= DORMANT_DAYS * DAY).length;
    const dormant = buyingSuppliers - activeBuyers;
    const neverPurchased = statList.filter((supplier) => supplier.orders === 0).length;
    const top5Spend = [...statList]
      .sort((left, right) => right.spend - left.spend)
      .slice(0, 5)
      .reduce((sum, supplier) => sum + supplier.spend, 0);

    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      const key = monthKey(date);
      const totals = monthlyPurchases.get(key);
      return {
        key,
        label: date.toLocaleDateString("en-US", { month: "short" }),
        spend: totals?.spend ?? 0,
        orders: totals?.orders ?? 0,
        suppliers: totals?.suppliers.size ?? 0,
        newSuppliers: 0,
      };
    });
    const monthBuckets = new Map(months.map((month) => [month.key, month]));
    suppliers.forEach((supplier) => {
      if (!supplier.createdAtUtc) return;
      const month = monthBuckets.get(monthKey(new Date(timestamp(supplier.createdAtUtc))));
      if (month) month.newSuppliers += 1;
    });

    const thisMonth = monthBuckets.get(currentMonth)?.spend ?? 0;
    const lastMonth = months[months.length - 2]?.spend ?? 0;
    const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
    const newLast30 = suppliers.filter((supplier) =>
      supplier.createdAtUtc && nowMs - timestamp(supplier.createdAtUtc) <= 30 * DAY,
    ).length;
    const topBySpend = [...statList].sort((left, right) => right.spend - left.spend).slice(0, 8);
    const recentSuppliers = [...suppliers]
      .sort((left, right) => timestamp(right.createdAtUtc) - timestamp(left.createdAtUtc))
      .slice(0, 6);
    const topProducts = [...productMap.values()].sort((left, right) => right.spend - left.spend).slice(0, 8);
    const topLocationsMap = new Map<string, { suppliers: number; spend: number }>();
    statList.forEach((supplier) => {
      const area = supplier.location.split(",")[0] || "No location";
      const entry = topLocationsMap.get(area) ?? { suppliers: 0, spend: 0 };
      entry.suppliers += 1;
      entry.spend += supplier.spend;
      topLocationsMap.set(area, entry);
    });
    const topLocations = [...topLocationsMap.entries()]
      .map(([label, value]) => ({ label, ...value }))
      .sort((left, right) => right.spend - left.spend || right.suppliers - left.suppliers)
      .slice(0, 8);
    const activeSuppliers = suppliers.filter((supplier) => supplier.isActive !== false).length;
    const recentPurchases = [...supplierPurchases]
      .sort((left, right) => timestamp(right.purchaseDate) - timestamp(left.purchaseDate))
      .slice(0, 8);

    return {
      totalSpend,
      totalUnits,
      avgOrder,
      buyingSuppliers,
      repeatSuppliers,
      activeBuyers,
      dormant,
      neverPurchased,
      top5Share: percent(top5Spend, totalSpend),
      months,
      thisMonth,
      growth,
      newLast30,
      topBySpend,
      recentSuppliers,
      topProducts,
      topLocations,
      activeSuppliers,
      recentPurchases,
      orders: supplierPurchases.length,
    };
  }, [purchases, suppliers]);

  const inactiveSuppliers = suppliers.length - report.activeSuppliers;
  const repeatRate = percent(report.repeatSuppliers, report.buyingSuppliers);
  const supplierListRoute = "/suppliers/list" as Href;

  const openSupplier = (id: string) =>
    router.push({ pathname: "/suppliers/view", params: { id } } as Href);
  const openPurchase = (id: string) =>
    router.push({ pathname: "/purchases/view", params: { id } } as Href);

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Supplier Report</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void load();
          }} />
        }
      >
        <View>
          <Text style={styles.eyebrow}>Supplier analytics</Text>
          <Text style={styles.title}>Supplier overview</Text>
          <Text style={styles.subtitle}>
            {count(report.orders)} purchases · filtered to the selected shop when active
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi label="Total suppliers" value={count(suppliers.length)} caption={`${count(inactiveSuppliers)} inactive`} icon={Building} tone="blue" />
          <Kpi label="Active suppliers" value={count(report.activeSuppliers)} caption={`${percent(report.activeSuppliers, suppliers.length)}% of base`} icon={UserRoundCheck} tone="green" />
          <Kpi label="New · 30 days" value={count(report.newLast30)} caption="Suppliers added" icon={UserPlus} tone="blue" />
          <Kpi label="Spend · month" value={money(report.thisMonth)} caption={report.growth === null ? "No prior month" : `${report.growth >= 0 ? "+" : ""}${report.growth}% vs last month`} icon={TrendingUp} tone={report.growth !== null && report.growth < 0 ? "red" : "green"} />
          <Kpi label="Lifetime spend" value={money(report.totalSpend)} caption={`${count(report.orders)} purchase orders`} icon={ShoppingCart} tone="green" />
          <Kpi label="Avg purchase" value={money(report.avgOrder)} caption="Per order" icon={ClipboardList} tone="blue" />
          <Kpi label="Units purchased" value={count(report.totalUnits)} caption="Across all purchase lines" icon={Package} tone="blue" />
          <Kpi label="Repeat supplier rate" value={`${repeatRate}%`} caption={`${count(report.repeatSuppliers)} of ${count(report.buyingSuppliers)} suppliers`} icon={Repeat} tone="green" />
          <Kpi label="Buying suppliers" value={count(report.buyingSuppliers)} caption={`${count(report.neverPurchased)} never purchased`} icon={UserRoundCheck} tone="green" />
          <Kpi label="Top-5 share" value={`${report.top5Share}%`} caption="Of purchasing spend" icon={AlertTriangle} tone={report.top5Share >= 60 ? "red" : "blue"} />
        </View>

        <Section title="Purchase spend trend" subtitle="Last 12 months · purchase spend">
          <LineChart
            labels={report.months.map((month) => month.label)}
            series={[{ name: "Purchase spend", color: COLORS.green, values: report.months.map((month) => month.spend) }]}
          />
        </Section>

        <Section title="Supplier activity" subtitle="New suppliers vs monthly purchasing suppliers">
          <BarChart
            data={report.months.map((month) => ({ label: month.label, values: [month.newSuppliers, month.suppliers] }))}
            series={[
              { name: "New suppliers", color: COLORS.blue },
              { name: "Buying suppliers", color: COLORS.green },
            ]}
          />
        </Section>

        <Section title="Supplier base" subtitle="Active vs inactive accounts">
          <DonutChart
            centerLabel="Suppliers"
            centerValue={count(suppliers.length)}
            slices={[
              { label: "Active", value: report.activeSuppliers, color: COLORS.green },
              { label: "Inactive", value: inactiveSuppliers, color: COLORS.slate },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title="Purchasing coverage" subtitle={`Ordered within ${DORMANT_DAYS} days vs dormant or never used`}>
          <DonutChart
            centerLabel="Suppliers"
            centerValue={count(suppliers.length)}
            slices={[
              { label: "Active suppliers", value: report.activeBuyers, color: COLORS.green },
              { label: "Dormant", value: report.dormant, color: COLORS.amber },
              { label: "Never purchased", value: report.neverPurchased, color: COLORS.slate },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title="Purchase order volume" subtitle="Purchase orders by month">
          <BarChart
            data={report.months.map((month) => ({ label: month.label, values: [month.orders] }))}
            series={[{ name: "Purchase orders", color: COLORS.purple }]}
            height={160}
          />
        </Section>

        <Section title="Top suppliers" subtitle="By lifetime purchase spend" onViewAll={() => router.push(supplierListRoute)}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Supplier</Text>
              <Text style={[styles.th, styles.tdSmall]}>Orders</Text>
              <Text style={[styles.th, styles.tdNum]}>Spend</Text>
              <Text style={[styles.th, styles.tdNum]}>Units</Text>
            </View>
            {report.topBySpend.map((supplier) => (
              <Pressable key={supplier.id} style={styles.tableRow} onPress={() => openSupplier(supplier.id)}>
                <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>{supplier.name}</Text>
                <Text style={[styles.td, styles.tdSmall]}>{count(supplier.orders)}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{compactNumber(supplier.spend)}</Text>
                <Text style={[styles.td, styles.tdNum]}>{count(supplier.units)}</Text>
              </Pressable>
            ))}
            {report.topBySpend.length === 0 ? <Text style={styles.empty}>No supplier purchases recorded.</Text> : null}
          </View>
        </Section>

        <Section title="Spend concentration" subtitle="Top suppliers by share of purchasing spend">
          <RankedBars
            items={report.topBySpend.slice(0, 5).map((supplier) => ({
              label: supplier.name,
              value: supplier.spend,
              caption: `${count(supplier.orders)} orders · ${percent(supplier.spend, report.totalSpend)}% of spend`,
            }))}
            color={COLORS.green}
            formatValue={money}
            emptyText="No supplier purchases recorded."
          />
        </Section>

        <Section title="Most purchased products" subtitle="By purchase line value">
          <RankedBars
            items={report.topProducts.map((product) => ({
              label: product.name,
              value: product.spend,
              caption: `${count(product.units)} units · ${count(product.orders)} purchase lines`,
            }))}
            color={COLORS.blue}
            formatValue={money}
            emptyText="No purchase line items to display."
          />
        </Section>

        <Section title="Supplier locations" subtitle="By purchasing spend and account count">
          <RankedBars
            items={report.topLocations.map((location) => ({
              label: location.label,
              value: location.spend,
              caption: `${count(location.suppliers)} suppliers`,
            }))}
            color={COLORS.purple}
            formatValue={money}
            emptyText="No supplier locations to display."
          />
        </Section>

        <Section title="Recent purchase orders" subtitle="Latest purchases" onViewAll={() => router.push("/purchases/list" as Href)}>
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
                  <Text style={styles.tdSub} numberOfLines={1}>{count(purchase.totalProducts)} units</Text>
                </View>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>
                  {new Date(timestamp(purchase.purchaseDate)).toLocaleDateString()}
                </Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{compactNumber(purchase.netTotal)}</Text>
              </Pressable>
            ))}
            {report.recentPurchases.length === 0 ? <Text style={styles.empty}>No purchases recorded.</Text> : null}
          </View>
        </Section>

        <Section title="Recently added suppliers" subtitle="Newest accounts" onViewAll={() => router.push(supplierListRoute)}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Supplier</Text>
              <Text style={[styles.th, styles.tdNum]}>Added</Text>
              <Text style={[styles.th, styles.tdStatus]}>Status</Text>
            </View>
            {report.recentSuppliers.map((supplier) => {
              const active = supplier.isActive !== false;
              return (
                <Pressable key={supplier.id} style={styles.tableRow} onPress={() => openSupplier(supplier.id)}>
                  <View style={styles.tdWide}>
                    <Text style={styles.td} numberOfLines={1}>{supplier.supplierName}</Text>
                    <Text style={styles.tdSub} numberOfLines={1}>
                      {[supplier.city, supplier.country].filter(Boolean).join(", ") || "No location"}
                    </Text>
                  </View>
                  <Text style={[styles.td, styles.tdNum]}>
                    {supplier.createdAtUtc ? new Date(timestamp(supplier.createdAtUtc)).toLocaleDateString() : "-"}
                  </Text>
                  <View style={styles.tdStatus}>
                    <View style={[styles.statusPill, { backgroundColor: active ? "#D1FAE5" : "#FEE2E2" }]}>
                      <Text style={[styles.statusText, { color: active ? "#047857" : "#B91C1C" }]}>
                        {active ? "ACTIVE" : "INACTIVE"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {report.recentSuppliers.length === 0 ? <Text style={styles.empty}>No suppliers yet.</Text> : null}
          </View>
        </Section>
      </ScrollView>
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
  tdSmall: { flex: 0.8, textAlign: "right" },
  tdNum: { flex: 1.2, textAlign: "right" },
  tdStatus: { flex: 1.1, alignItems: "flex-end" },
  statusPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  empty: { padding: 14, textAlign: "center", fontSize: 12, color: COLORS.muted },
});