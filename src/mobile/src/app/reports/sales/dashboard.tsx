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
  AlertTriangle,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Percent,
  Receipt,
  ShoppingCart,
  Store,
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
import { Sale } from "@/models/sale";
import { ISaleService } from "@/services/saleService";
import { usePagePermission } from "@/lib/usePagePermission";

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);

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

type AccountStats = {
  id: string;
  name: string;
  type: "Customer" | "Dealer";
  revenue: number;
  paid: number;
  balance: number;
  overdue: number;
  orders: number;
  last: number;
};

export default function SalesReportDashboardScreen() {
  const router = useRouter();
  const permissionState = usePagePermission('/reports/sales/dashboard');
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const all: Sale[] = [];
      let page = 1;
      while (true) {
        const next = await saleService.getSales(page, PAGE_SIZE);
        all.push(...next);
        if (next.length < PAGE_SIZE) break;
        page += 1;
      }
      setSales(all);
    } catch (error) {
      setSales([]);
      SnackBar.Error(error instanceof Error ? error.message : "Unable to load sales report");
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
    const completedSales = sales.filter((sale) => sale.status !== "Voided");
    const voidedSales = sales.filter((sale) => sale.status === "Voided");
    const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.netTotal, 0);
    const totalPaid = completedSales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const receivables = completedSales.reduce((sum, sale) => sum + Math.max(sale.balance, 0), 0);
    const totalDiscount = completedSales.reduce((sum, sale) => sum + sale.discount, 0);
    const avgOrder = completedSales.length ? totalRevenue / completedSales.length : 0;
    const averageUnits = completedSales.length
      ? completedSales.reduce((sum, sale) => sum + sale.totalProducts, 0) / completedSales.length
      : 0;

    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: monthKey(date),
        label: date.toLocaleDateString("en-US", { month: "short" }),
        revenue: 0,
        collected: 0,
        orders: 0,
        customers: new Set<string>(),
        dealers: new Set<string>(),
      };
    });
    const bucket = new Map(months.map((month) => [month.key, month]));
    completedSales.forEach((sale) => {
      const month = bucket.get(monthKey(new Date(timestamp(sale.saleDate))));
      if (!month) return;
      month.revenue += sale.netTotal;
      month.collected += sale.paidAmount;
      month.orders += 1;
      if (sale.customerId) month.customers.add(sale.customerId);
      if (sale.dealerId) month.dealers.add(sale.dealerId);
    });

    const thisMonth = bucket.get(currentMonth)?.revenue ?? 0;
    const lastMonth = months[months.length - 2]?.revenue ?? 0;
    const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
    const salesLast30 = completedSales.filter((sale) => nowMs - timestamp(sale.saleDate) <= 30 * DAY).length;

    let paidInvoices = 0;
    let partialInvoices = 0;
    let unpaidInvoices = 0;
    const aging = [
      { label: "0-30d", min: 0, max: 30, value: 0 },
      { label: "31-60d", min: 31, max: 60, value: 0 },
      { label: "61-90d", min: 61, max: 90, value: 0 },
      { label: "90d+", min: 91, max: Infinity, value: 0 },
    ];
    const accounts = new Map<string, AccountStats>();
    completedSales.forEach((sale) => {
      if (sale.balance <= 0) paidInvoices += 1;
      else if (sale.paidAmount > 0) partialInvoices += 1;
      else unpaidInvoices += 1;
      if (sale.balance > 0) {
        const ageDays = Math.floor((nowMs - timestamp(sale.saleDate)) / DAY);
        const age = aging.find((item) => ageDays >= item.min && ageDays <= item.max);
        if (age) age.value += sale.balance;
      }

      const id = sale.dealerId ?? sale.customerId;
      if (!id) return;
      const type = sale.dealerId ? "Dealer" : "Customer";
      const key = `${type}:${id}`;
      const account = accounts.get(key) ?? {
        id,
        name: sale.customerName,
        type,
        revenue: 0,
        paid: 0,
        balance: 0,
        overdue: 0,
        orders: 0,
        last: 0,
      };
      account.revenue += sale.netTotal;
      account.paid += sale.paidAmount;
      account.balance += Math.max(sale.balance, 0);
      if (sale.balance > 0 && nowMs - timestamp(sale.saleDate) > 60 * DAY) {
        account.overdue += sale.balance;
      }
      account.orders += 1;
      account.last = Math.max(account.last, timestamp(sale.saleDate));
      accounts.set(key, account);
    });

    const accountList = [...accounts.values()];
    const topAccounts = [...accountList].sort((left, right) => right.revenue - left.revenue).slice(0, 8);
    const topBalances = [...accountList].filter((account) => account.balance > 0)
      .sort((left, right) => right.balance - left.balance).slice(0, 6);
    const overdueAccounts = [...accountList].filter((account) => account.overdue > 0)
      .sort((left, right) => right.overdue - left.overdue).slice(0, 6);
    const recentSales = [...sales]
      .sort((left, right) => timestamp(right.saleDate) - timestamp(left.saleDate))
      .slice(0, 8);
    const registeredCustomerSales = completedSales.filter((sale) => sale.customerId);
    const dealerSales = completedSales.filter((sale) => sale.dealerId);
    const walkInSales = completedSales.filter((sale) => !sale.customerId && !sale.dealerId);
    const registeredRevenue = registeredCustomerSales.reduce((sum, sale) => sum + sale.netTotal, 0);
    const dealerRevenue = dealerSales.reduce((sum, sale) => sum + sale.netTotal, 0);
    const walkInRevenue = walkInSales.reduce((sum, sale) => sum + sale.netTotal, 0);
    const uniqueCustomers = new Set(registeredCustomerSales.map((sale) => sale.customerId)).size;
    const uniqueDealers = new Set(dealerSales.map((sale) => sale.dealerId)).size;
    const avgDailyRevenue = completedSales.length
      ? totalRevenue / Math.max(new Set(completedSales.map((sale) => new Date(timestamp(sale.saleDate)).toDateString())).size, 1)
      : 0;
    const top5Revenue = topAccounts.slice(0, 5).reduce((sum, account) => sum + account.revenue, 0);

    return {
      months,
      completedSales,
      voidedSales,
      totalRevenue,
      totalPaid,
      receivables,
      totalDiscount,
      avgOrder,
      averageUnits,
      thisMonth,
      growth,
      salesLast30,
      paidInvoices,
      partialInvoices,
      unpaidInvoices,
      aging,
      topAccounts,
      topBalances,
      overdueAccounts,
      recentSales,
      registeredRevenue,
      dealerRevenue,
      walkInRevenue,
      uniqueCustomers,
      uniqueDealers,
      avgDailyRevenue,
      top5Share: percent(top5Revenue, totalRevenue),
    };
  }, [sales]);

  const collectionRate = percent(report.totalPaid, report.totalRevenue);
  const customerListRoute = "/customers/list" as Href;
  const dealerListRoute = "/dealers/dealers" as Href;

  const openSale = (id: string) =>
    router.push({ pathname: "/sales/view", params: { id } } as Href);
  const openAccount = (account: AccountStats) =>
    router.push({
      pathname: account.type === "Dealer" ? "/dealers/view" : "/customers/view",
      params: { id: account.id },
    } as Href);

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <LoadingOverlay isLoading={permissionState === 'authorized' && loading} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Sales Report</Text>
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
          <Text style={styles.eyebrow}>Sales analytics</Text>
          <Text style={styles.title}>Sales overview</Text>
          <Text style={styles.subtitle}>
            {count(report.completedSales.length)} completed sales · filtered to the selected shop when active
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi label="Net sales" value={money(report.totalRevenue)} caption={`${count(report.completedSales.length)} completed orders`} icon={ShoppingCart} tone="green" />
          <Kpi label="Collected" value={money(report.totalPaid)} caption={`${collectionRate}% of billed sales`} icon={Banknote} tone="blue" />
          <Kpi label="Outstanding" value={money(report.receivables)} caption={`${count(report.partialInvoices + report.unpaidInvoices)} open invoices`} icon={HandCoins} tone="amber" />
          <Kpi label="Avg order value" value={money(report.avgOrder)} caption="Per completed sale" icon={Receipt} tone="blue" />
          <Kpi label="Sales · 30 days" value={count(report.salesLast30)} caption="Completed orders" icon={CalendarDays} tone="blue" />
          <Kpi label="Revenue · month" value={money(report.thisMonth)} caption={report.growth === null ? "No prior month" : `${report.growth >= 0 ? "+" : ""}${report.growth}% vs last month`} icon={TrendingUp} tone={report.growth !== null && report.growth < 0 ? "red" : "green"} />
          <Kpi label="Daily average" value={money(report.avgDailyRevenue)} caption="On days with sales" icon={CalendarDays} tone="blue" />
          <Kpi label="Voided sales" value={count(report.voidedSales.length)} caption="Excluded from totals" icon={AlertTriangle} tone={report.voidedSales.length > 0 ? "red" : "green"} />
          <Kpi label="Discounts" value={money(report.totalDiscount)} caption="Across completed sales" icon={Percent} tone="amber" />
          <Kpi label="Customer buyers" value={count(report.uniqueCustomers)} caption="Registered customers" icon={Store} tone="green" />
          <Kpi label="Dealer buyers" value={count(report.uniqueDealers)} caption={`${count(report.averageUnits)} avg units per order`} icon={Wallet} tone="blue" />
        </View>

        <Section title="Sales and collection trend" subtitle="Last 12 months · billed vs collected">
          <LineChart
            labels={report.months.map((month) => month.label)}
            series={[
              { name: "Billed", color: COLORS.green, values: report.months.map((month) => month.revenue) },
              { name: "Collected", color: COLORS.blue, values: report.months.map((month) => month.collected) },
            ]}
          />
        </Section>

        <Section title="Order volume" subtitle="Completed sales by month">
          <BarChart
            data={report.months.map((month) => ({ label: month.label, values: [month.orders] }))}
            series={[{ name: "Sales", color: COLORS.blue }]}
            height={160}
          />
        </Section>

        <Section title="Sales channel mix" subtitle="Revenue from customers, dealers, and walk-ins">
          <DonutChart
            centerLabel="Billed"
            centerValue={compactNumber(report.totalRevenue)}
            slices={[
              { label: "Customers", value: report.registeredRevenue, color: COLORS.blue },
              { label: "Dealers", value: report.dealerRevenue, color: COLORS.green },
              { label: "Walk-in", value: report.walkInRevenue, color: COLORS.purple },
            ]}
            formatValue={money}
          />
        </Section>

        <Section title="Invoice payment status" subtitle="All completed sales">
          <DonutChart
            centerLabel="Invoices"
            centerValue={count(report.completedSales.length)}
            slices={[
              { label: "Paid", value: report.paidInvoices, color: COLORS.green },
              { label: "Partial", value: report.partialInvoices, color: COLORS.amber },
              { label: "Unpaid", value: report.unpaidInvoices, color: COLORS.red },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title="Receivables aging" subtitle="Outstanding balance by sale age">
          <BarChart
            data={report.aging.map((item) => ({ label: item.label, values: [item.value] }))}
            series={[{ name: "Outstanding", color: COLORS.amber }]}
            height={160}
          />
        </Section>

        <Section title="Revenue concentration" subtitle="Top accounts by sales value">
          <RankedBars
            items={report.topAccounts.slice(0, 6).map((account) => ({
              label: account.name,
              value: account.revenue,
              caption: `${account.type} · ${count(account.orders)} orders · ${percent(account.revenue, report.totalRevenue)}% of revenue`,
            }))}
            color={COLORS.green}
            formatValue={money}
            emptyText="No registered-account sales to display."
          />
        </Section>

        <Section title="Top accounts" subtitle="By lifetime billed sales">
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Account</Text>
              <Text style={[styles.th, styles.tdSmall]}>Type</Text>
              <Text style={[styles.th, styles.tdNum]}>Orders</Text>
              <Text style={[styles.th, styles.tdNum]}>Revenue</Text>
            </View>
            {report.topAccounts.map((account) => (
              <Pressable key={`${account.type}-${account.id}`} style={styles.tableRow} onPress={() => openAccount(account)}>
                <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>{account.name}</Text>
                <Text style={[styles.td, styles.tdSmall]}>{account.type}</Text>
                <Text style={[styles.td, styles.tdNum]}>{count(account.orders)}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{compactNumber(account.revenue)}</Text>
              </Pressable>
            ))}
            {report.topAccounts.length === 0 ? <Text style={styles.empty}>No registered-account sales recorded.</Text> : null}
          </View>
        </Section>

        <Section title="Highest receivables" subtitle="Largest customer and dealer balances">
          <RankedBars
            items={report.topBalances.map((account) => ({
              label: account.name,
              value: account.balance,
              caption: `${account.type} · ${count(account.orders)} orders`,
            }))}
            color={COLORS.amber}
            formatValue={money}
            emptyText="No outstanding balances."
          />
        </Section>

        <Section title="Overdue accounts" subtitle="Unpaid for more than 60 days">
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Account</Text>
              <Text style={[styles.th, styles.tdSmall]}>Type</Text>
              <Text style={[styles.th, styles.tdNum]}>Balance</Text>
              <Text style={[styles.th, styles.tdNum]}>Last sale</Text>
            </View>
            {report.overdueAccounts.map((account) => (
              <Pressable key={`${account.type}-${account.id}`} style={styles.tableRow} onPress={() => openAccount(account)}>
                <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>{account.name}</Text>
                <Text style={[styles.td, styles.tdSmall]}>{account.type}</Text>
                <Text style={[styles.td, styles.tdNum, styles.red]} numberOfLines={1}>{money(account.overdue)}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{new Date(account.last).toLocaleDateString()}</Text>
              </Pressable>
            ))}
            {report.overdueAccounts.length === 0 ? <Text style={styles.empty}>No overdue accounts.</Text> : null}
          </View>
        </Section>

        <Section title="Recent sales" subtitle="Latest invoices" onViewAll={() => router.push("/sales/list" as Href)}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Sale</Text>
              <Text style={[styles.th, styles.tdNum]}>Date</Text>
              <Text style={[styles.th, styles.tdNum]}>Total</Text>
              <Text style={[styles.th, styles.tdNum]}>Status</Text>
            </View>
            {report.recentSales.map((sale) => (
              <Pressable key={sale.id} style={styles.tableRow} onPress={() => openSale(sale.id)}>
                <View style={styles.tdWide}>
                  <Text style={styles.td} numberOfLines={1}>#{sale.id.slice(0, 8).toUpperCase()}</Text>
                  <Text style={styles.tdSub} numberOfLines={1}>{sale.customerName}</Text>
                </View>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{new Date(timestamp(sale.saleDate)).toLocaleDateString()}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{compactNumber(sale.netTotal)}</Text>
                <View style={styles.tdStatus}>
                  <View style={[styles.statusPill, { backgroundColor: sale.status === "Voided" ? "#FEE2E2" : "#D1FAE5" }]}>
                    <Text style={[styles.statusText, { color: sale.status === "Voided" ? "#B91C1C" : "#047857" }]}>
                      {sale.status === "Voided" ? "VOIDED" : "COMPLETED"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
            {report.recentSales.length === 0 ? <Text style={styles.empty}>No sales recorded.</Text> : null}
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
  tdSmall: { flex: 0.8, textAlign: "right" },
  tdNum: { flex: 1.2, textAlign: "right" },
  tdStatus: { flex: 1.1, alignItems: "flex-end" },
  red: { color: COLORS.red, fontWeight: "700" },
  statusPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { marginTop: 8, textAlign: "center" },
  empty: { padding: 14, textAlign: "center", fontSize: 12, color: COLORS.muted },
});