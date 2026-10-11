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
  Boxes,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  HandCoins,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HomeTopBar from "@/components/homeTopBar";
import LoadingOverlay from "@/components/loadingOverlay";
import {
  BarChart,
  DonutChart,
  RankedBars,
  compactNumber,
} from "@/components/charts";
import { Text } from "@/components/ui/text";
import SnackBar from "@/components/ui/snack-bar";
import { container, DI_TOKENS } from "@/di";
import { useSelectedShopChanged } from "@/lib/selectedShop";
import { CustomerItem } from "@/models/customer";
import { DealerItem } from "@/models/dealer";
import { ProductItem } from "@/models/product";
import { Purchase } from "@/models/purchase";
import { Sale, SaleDashboard } from "@/models/sale";
import { Supplier } from "@/models/supplier";
import { ICustomerService } from "@/services/customerService";
import { DealerServiceClient } from "@/services/dealerService";
import { IProductService } from "@/services/productService";
import { IPurchaseService } from "@/services/purchaseService";
import { ISaleService } from "@/services/saleService";
import { SupplierServiceClient } from "@/services/supplierService";

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);
const purchaseService = container.resolve<IPurchaseService>(
  DI_TOKENS.IPurchaseService,
);
const productService = container.resolve<IProductService>(
  DI_TOKENS.IProductService,
);
const customerService = container.resolve<ICustomerService>(
  DI_TOKENS.ICustomerService,
);
const supplierService = new SupplierServiceClient();
const dealerService = new DealerServiceClient();

const COLORS = {
  ink: "#0F172A",
  muted: "#64748B",
  border: "#D9DEE5",
  surface: "#FFFFFF",
  green: "#16794B",
  blue: "#2367A8",
  amber: "#9A6700",
  red: "#B42318",
};

type Tone = "green" | "blue" | "amber" | "red";

const TONES: Record<Tone, { fg: string; bg: string; border: string }> = {
  green: { fg: "#16794B", bg: "#F4FAF6", border: "#D5E9DC" },
  blue: { fg: "#2367A8", bg: "#F3F8FC", border: "#D6E6F3" },
  amber: { fg: "#9A6700", bg: "#FFFAEE", border: "#EFE2BF" },
  red: { fg: "#B42318", bg: "#FFF5F4", border: "#F0D8D5" },
};

const CATEGORY_COLORS = ["#2367A8", "#16794B", "#9A6700", "#7C3AED", "#0E7490"];
const OTHER_COLOR = "#94A3B8";

type DashboardData = {
  saleDashboard: SaleDashboard | null;
  sales: Sale[];
  purchases: Purchase[];
  products: ProductItem[];
  customers: CustomerItem[];
  suppliers: Supplier[];
  dealers: DealerItem[];
};

const emptyData: DashboardData = {
  saleDashboard: null,
  sales: [],
  purchases: [],
  products: [],
  customers: [],
  suppliers: [],
  dealers: [],
};

function money(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} MMK`;
}

function count(value: number) {
  return value.toLocaleString("en-US");
}

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
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
          {subtitle ? (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          ) : null}
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
        <Text style={styles.kpiLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.kpiBody}>
        <Text
          style={styles.kpiValue}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {value}
        </Text>
        <Text style={styles.kpiCaption} numberOfLines={1}>
          {caption}
        </Text>
      </View>
    </View>
  );
}

function PartnerRow({
  label,
  total,
  active,
  color,
}: {
  label: string;
  total: number;
  active: number;
  color: string;
}) {
  const share = total > 0 ? (active / total) * 100 : 0;
  return (
    <View style={styles.partnerRow}>
      <View style={styles.partnerHeader}>
        <Text style={styles.partnerLabel}>{label}</Text>
        <Text style={styles.partnerCount}>{count(total)}</Text>
      </View>
      <View style={styles.partnerTrack}>
        <View
          style={[
            styles.partnerFill,
            { width: `${share}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.partnerCaption}>
        {count(active)} active · {count(total - active)} inactive
      </Text>
    </View>
  );
}

function statusOf(sale: Sale) {
  if (sale.status === "Voided")
    return { label: "VOID", color: "#B91C1C", bg: "#FEE2E2" };
  if (sale.paidAmount > 0 && sale.balance <= 0)
    return { label: "PAID", color: "#047857", bg: "#D1FAE5" };
  return { label: "UNPAID", color: "#B45309", bg: "#FEF3C7" };
}

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = React.useState<DashboardData>(emptyData);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadDashboard = React.useCallback(async () => {
    const results = await Promise.allSettled([
      saleService.getDashboard(),
      saleService.getSales(1, 1000),
      purchaseService.getPurchases(1, 1000),
      productService.getProducts(1, 2000),
      customerService.getCustomers(1, 2000),
      supplierService.getSuppliers(1, 2000),
      dealerService.getDealers(1, 2000),
    ]);

    if (results.every((result) => result.status === "rejected")) {
      SnackBar.Error("Unable to load dashboard data");
    }

    setData({
      saleDashboard: settled(results[0], null),
      sales: settled(results[1], []),
      purchases: settled(results[2], []),
      products: settled(results[3], []),
      customers: settled(results[4], []),
      suppliers: settled(results[5], []),
      dealers: settled(results[6], []),
    });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadDashboard();
      return undefined;
    }, [loadDashboard]),
  );

  useSelectedShopChanged(() => {
    setLoading(true);
    void loadDashboard();
  });

  const metrics = React.useMemo(() => {
    const { saleDashboard, sales, purchases, products, customers, suppliers } =
      data;
    const activeSales = sales.filter((sale) => sale.status !== "Voided");
    const now = new Date();
    const currentMonth = monthKey(now);

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: monthKey(date),
        label: date.toLocaleDateString("en-US", { month: "short" }),
        sales: 0,
        purchases: 0,
      };
    });
    const bucket = new Map(months.map((month) => [month.key, month]));
    activeSales.forEach((sale) => {
      const entry = bucket.get(monthKey(new Date(sale.saleDate)));
      if (entry) entry.sales += sale.netTotal;
    });
    purchases.forEach((purchase) => {
      const entry = bucket.get(monthKey(new Date(purchase.purchaseDate)));
      if (entry) entry.purchases += purchase.netTotal;
    });

    const monthPurchases = bucket.get(currentMonth)?.purchases ?? 0;
    const collected = activeSales.reduce(
      (sum, sale) => sum + sale.paidAmount,
      0,
    );
    const outstanding = activeSales.reduce(
      (sum, sale) => sum + Math.max(sale.balance, 0),
      0,
    );

    const activeProducts = products.filter(
      (product) => product.isActive !== false,
    );
    const stockOf = (product: ProductItem) => Number(product.currentStock ?? 0);
    const minOf = (product: ProductItem) => Number(product.minimumStock ?? 0);
    const valueOf = (product: ProductItem) =>
      Math.max(stockOf(product), 0) * Number(product.salePrice ?? 0);
    const outOfStock = activeProducts.filter((p) => stockOf(p) <= 0);
    const lowStock = activeProducts.filter(
      (p) => stockOf(p) > 0 && stockOf(p) <= minOf(p),
    );
    const healthy = activeProducts.length - outOfStock.length - lowStock.length;
    const inventoryValue = activeProducts.reduce(
      (sum, product) => sum + valueOf(product),
      0,
    );

    const categoryTotals = Array.from(
      activeProducts.reduce((totals, product) => {
        const category = product.category?.trim() || "Uncategorized";
        totals.set(category, (totals.get(category) ?? 0) + valueOf(product));
        return totals;
      }, new Map<string, number>()),
    )
      .map(([label, value]) => ({ label, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
    const categorySlices = categoryTotals
      .slice(0, CATEGORY_COLORS.length)
      .map((item, index) => ({ ...item, color: CATEGORY_COLORS[index] }));
    const otherValue = categoryTotals
      .slice(CATEGORY_COLORS.length)
      .reduce((sum, item) => sum + item.value, 0);
    if (otherValue > 0) {
      categorySlices.push({
        label: "Other",
        value: otherValue,
        color: OTHER_COLOR,
      });
    }

    const lowStockItems = [...outOfStock, ...lowStock]
      .sort(
        (a, b) =>
          stockOf(a) / Math.max(minOf(a), 1) -
          stockOf(b) / Math.max(minOf(b), 1),
      )
      .slice(0, 5);

    const topCustomers = customers
      .filter((customer) => (customer.totalOutstanding ?? 0) > 0)
      .sort((a, b) => (b.totalOutstanding ?? 0) - (a.totalOutstanding ?? 0))
      .slice(0, 5)
      .map((customer) => ({
        label: customer.name,
        value: customer.totalOutstanding ?? 0,
      }));

    const supplierTotals = purchases.reduce((totals, purchase) => {
      totals.set(
        purchase.supplierName,
        (totals.get(purchase.supplierName) ?? 0) + purchase.netTotal,
      );
      return totals;
    }, new Map<string, number>());
    const topSuppliers = Array.from(supplierTotals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      months,
      monthSales: saleDashboard?.thisMonthSales ?? 0,
      todaySales: saleDashboard?.todaySales ?? 0,
      monthPurchases,
      purchaseOrders: purchases.length,
      receivables: saleDashboard?.unpaidAmount ?? outstanding,
      unpaidInvoices: saleDashboard?.unpaidSales ?? 0,
      collected,
      outstanding,
      activeProducts: activeProducts.length,
      inventoryValue,
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      healthy,
      categorySlices,
      lowStockItems,
      topCustomers,
      topSuppliers,
      activeCustomers: customers.filter((item) => item.isActive !== false)
        .length,
      activeSuppliers: suppliers.filter((item) => item.isActive !== false)
        .length,
      activeDealers: data.dealers.filter((item) => item.isActive !== false)
        .length,
      recentSales: (saleDashboard?.recentSales ?? []).slice(0, 5),
    };
  }, [data]);

  const alerts = metrics.outOfStock + metrics.lowStock;
  const healthTotal = Math.max(
    metrics.healthy + metrics.lowStock + metrics.outOfStock,
    1,
  );

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <HomeTopBar />
      <LoadingOverlay isLoading={loading} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadDashboard();
            }}
          />
        }
      >
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Executive dashboard</Text>
            <Text style={styles.title}>Business overview</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi
            label="Sales · month"
            value={money(metrics.monthSales)}
            caption={`${money(metrics.todaySales)} today`}
            icon={TrendingUp}
            tone="green"
          />
          <Kpi
            label="Purchases · month"
            value={money(metrics.monthPurchases)}
            caption={`${count(metrics.purchaseOrders)} orders recorded`}
            icon={HandCoins}
            tone="blue"
          />
          <Kpi
            label="Receivables"
            value={money(metrics.receivables)}
            caption={`${count(metrics.unpaidInvoices)} unpaid invoices`}
            icon={Receipt}
            tone="amber"
          />
          <Kpi
            label="Inventory value"
            value={money(metrics.inventoryValue)}
            caption={`${count(metrics.activeProducts)} active products`}
            icon={Boxes}
            tone="blue"
          />
          <Kpi
            label="Stock alerts"
            value={count(alerts)}
            caption={`${count(metrics.outOfStock)} out of stock`}
            icon={AlertTriangle}
            tone={alerts > 0 ? "red" : "green"}
          />
          <Kpi
            label="Customers"
            value={count(data.customers.length)}
            caption={`${count(metrics.activeCustomers)} active`}
            icon={Users}
            tone="green"
          />
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, styles.actionPrimary]}
            onPress={() => router.push("/sales/new" as Href)}
          >
            <CirclePlus size={18} color="#FFFFFF" />
            <Text style={[styles.actionLabel, styles.actionPrimaryLabel]}>
              New Sale
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.actionSecondary]}
            onPress={() => router.push("/purchases/new" as Href)}
          >
            <ClipboardList size={18} color={COLORS.green} />
            <Text style={[styles.actionLabel, styles.actionSecondaryLabel]}>
              New Purchase
            </Text>
          </Pressable>
        </View>

        <Section
          title="Sales vs purchases"
          subtitle="Last 6 months · net totals"
        >
          <BarChart
            data={metrics.months.map((month) => ({
              label: month.label,
              values: [month.sales, month.purchases],
            }))}
            series={[
              { name: "Sales", color: COLORS.green },
              { name: "Purchases", color: COLORS.blue },
            ]}
          />
        </Section>

        <Section title="Collections" subtitle="Paid vs outstanding sales">
          <DonutChart
            centerLabel="Collected"
            centerValue={`${Math.round(
              (metrics.collected /
                Math.max(metrics.collected + metrics.outstanding, 1)) *
                100,
            )}%`}
            slices={[
              {
                label: "Collected",
                value: metrics.collected,
                color: COLORS.green,
              },
              {
                label: "Outstanding",
                value: metrics.outstanding,
                color: COLORS.amber,
              },
            ]}
          />
        </Section>

        <Section
          title="Inventory by category"
          subtitle="Stock value at sale price"
        >
          {metrics.categorySlices.length > 0 ? (
            <DonutChart
              centerLabel="Total value"
              centerValue={compactNumber(metrics.inventoryValue)}
              slices={metrics.categorySlices}
            />
          ) : (
            <Text style={styles.empty}>No stock value recorded.</Text>
          )}
        </Section>

        <Section
          title="Stock health"
          subtitle="Active products by status"
          onViewAll={() => router.push("/inventory/list" as Href)}
        >
          <View style={styles.healthBar}>
            <View
              style={{
                flex: metrics.healthy / healthTotal,
                backgroundColor: COLORS.green,
              }}
            />
            <View
              style={{
                flex: metrics.lowStock / healthTotal,
                backgroundColor: COLORS.amber,
              }}
            />
            <View
              style={{
                flex: metrics.outOfStock / healthTotal,
                backgroundColor: COLORS.red,
              }}
            />
          </View>
          <View style={styles.healthLegend}>
            {[
              { label: "Healthy", value: metrics.healthy, color: COLORS.green },
              { label: "Low", value: metrics.lowStock, color: COLORS.amber },
              { label: "Out", value: metrics.outOfStock, color: COLORS.red },
            ].map((item) => (
              <View key={item.label} style={styles.healthItem}>
                <Text style={[styles.healthValue, { color: item.color }]}>
                  {count(item.value)}
                </Text>
                <Text style={styles.healthLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Needs restocking</Text>
              <Text style={[styles.th, styles.tdNum]}>On hand</Text>
              <Text style={[styles.th, styles.tdNum]}>Min</Text>
            </View>
            {metrics.lowStockItems.map((product) => (
              <View key={product.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text
                  style={[
                    styles.td,
                    styles.tdNum,
                    {
                      color:
                        Number(product.currentStock ?? 0) <= 0
                          ? COLORS.red
                          : COLORS.amber,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {count(Number(product.currentStock ?? 0))}
                </Text>
                <Text style={[styles.td, styles.tdNum]}>
                  {count(Number(product.minimumStock ?? 0))}
                </Text>
              </View>
            ))}
            {metrics.lowStockItems.length === 0 ? (
              <Text style={styles.empty}>
                All products are sufficiently stocked.
              </Text>
            ) : null}
          </View>
        </Section>

        <Section
          title="Top customer receivables"
          subtitle="Highest outstanding balances"
          onViewAll={() => router.push("/customers/list" as Href)}
        >
          <RankedBars
            items={metrics.topCustomers}
            color={COLORS.amber}
            formatValue={(value) => money(value)}
            emptyText="No outstanding balances."
          />
        </Section>

        <Section
          title="Top suppliers"
          subtitle="By purchase value"
          onViewAll={() => router.push("/suppliers/list" as Href)}
        >
          <RankedBars
            items={metrics.topSuppliers}
            color={COLORS.blue}
            formatValue={(value) => money(value)}
            emptyText="No purchases recorded."
          />
        </Section>

        <Section title="Partner network" subtitle="Active relationships">
          <View style={styles.partners}>
            <PartnerRow
              label="Customers"
              total={data.customers.length}
              active={metrics.activeCustomers}
              color={COLORS.green}
            />
            <PartnerRow
              label="Suppliers"
              total={data.suppliers.length}
              active={metrics.activeSuppliers}
              color={COLORS.blue}
            />
            <PartnerRow
              label="Dealers"
              total={data.dealers.length}
              active={metrics.activeDealers}
              color={COLORS.amber}
            />
          </View>
        </Section>

        <Section
          title="Recent sales"
          subtitle="Latest transactions"
          onViewAll={() => router.push("/sales/list" as Href)}
        >
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Customer</Text>
              <Text style={[styles.th, styles.tdNum]}>Total</Text>
              <Text style={[styles.th, styles.tdStatus]}>Status</Text>
            </View>
            {metrics.recentSales.map((sale) => {
              const status = statusOf(sale);
              return (
                <View key={sale.id} style={styles.tableRow}>
                  <View style={styles.tdWide}>
                    <Text style={styles.td} numberOfLines={1}>
                      {sale.customerName}
                    </Text>
                    <Text style={styles.tdSub}>
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>
                    {money(sale.netTotal)}
                  </Text>
                  <View style={styles.tdStatus}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: status.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: status.color }]}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {metrics.recentSales.length === 0 ? (
              <Text style={styles.empty}>No sales recorded.</Text>
            ) : null}
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.surface },
  scrollView: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 16, paddingBottom: 100, gap: 20 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  titleBlock: { flex: 1, gap: 2 },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: { color: COLORS.ink, fontSize: 22, fontWeight: "800" },
  date: { color: COLORS.muted, fontSize: 12 },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CDE8D6",
    backgroundColor: "#EAFBF0",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#1D9A59",
  },
  liveText: { color: COLORS.green, fontSize: 11, fontWeight: "700" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: {
    width: "48%",
    minHeight: 88,
    borderRadius: 6,
    borderWidth: 1,
    borderTopWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "space-between",
    gap: 10,
  },
  kpiHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  kpiIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFFAA",
  },
  kpiLabel: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kpiBody: { gap: 2 },
  kpiValue: { color: COLORS.ink, fontSize: 18, fontWeight: "800" },
  kpiCaption: { color: COLORS.muted, fontSize: 10 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionPrimary: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  actionSecondary: { backgroundColor: "#F4FAF6", borderColor: COLORS.green },
  actionLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },
  actionPrimaryLabel: { color: "#FFFFFF" },
  actionSecondaryLabel: { color: COLORS.green },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitleBlock: { flex: 1, gap: 2 },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sectionSubtitle: { color: COLORS.muted, fontSize: 11 },
  seeAll: {
    minHeight: 30,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CDE8D6",
    backgroundColor: "#F4FAF6",
  },
  seeAllText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  panel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    padding: 12,
  },
  healthBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: COLORS.border,
  },
  healthLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    marginBottom: 14,
  },
  healthItem: { alignItems: "center", gap: 2 },
  healthValue: { fontSize: 18, fontWeight: "800" },
  healthLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  partners: { gap: 14 },
  partnerRow: { gap: 5 },
  partnerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  partnerLabel: { color: COLORS.ink, fontSize: 12, fontWeight: "700" },
  partnerCount: { color: COLORS.ink, fontSize: 14, fontWeight: "800" },
  partnerTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  partnerFill: { height: "100%", borderRadius: 3 },
  partnerCaption: { color: COLORS.muted, fontSize: 10 },
  table: { marginHorizontal: -12 },
  tableHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#F1F5F9",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9DEE5",
  },
  tableRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CBD5E1",
  },
  th: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  td: { color: COLORS.ink, fontSize: 12 },
  tdSub: { color: COLORS.muted, fontSize: 10, marginTop: 1 },
  tdWide: { flex: 1.6 },
  tdNum: { flex: 1, textAlign: "right" },
  tdStatus: { width: 64, alignItems: "flex-end" },
  statusPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  empty: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 14,
  },
});
