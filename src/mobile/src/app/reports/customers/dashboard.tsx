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
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Percent,
  Receipt,
  Repeat,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  UserRoundCheck,
  Users,
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
import SnackBar from "@/components/ui/snack-bar";
import { Text } from "@/components/ui/text";
import { container, DI_TOKENS } from "@/di";
import { CustomerItem } from "@/models/customer";
import { Sale } from "@/models/sale";
import { ICustomerService } from "@/services/customerService";
import { ISaleService } from "@/services/saleService";

const customerService = container.resolve<ICustomerService>(
  DI_TOKENS.ICustomerService,
);
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

type CustomerStats = {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  paid: number;
  balance: number;
  overdue: number;
  last: number;
};

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
  );
}

export default function CustomerReportDashboardScreen() {
  const router = useRouter();
  const [customers, setCustomers] = React.useState<CustomerItem[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    const [customerResult, saleResult] = await Promise.allSettled([
      customerService.getCustomers(1, 2000),
      saleService.getSales(1, 1000),
    ]);
    if (
      customerResult.status === "rejected" &&
      saleResult.status === "rejected"
    ) {
      SnackBar.Error("Unable to load customer report");
    }
    setCustomers(customerResult.status === "fulfilled" ? customerResult.value : []);
    setSales(saleResult.status === "fulfilled" ? saleResult.value : []);
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

    // Dealer sales and voided sales are not customer revenue.
    const customerSales = sales.filter(
      (sale) => sale.status !== "Voided" && !sale.dealerId,
    );
    const registeredSales = customerSales.filter((sale) => sale.customerId);
    const walkInRevenue = customerSales
      .filter((sale) => !sale.customerId)
      .reduce((sum, sale) => sum + sale.netTotal, 0);

    const nameById = new Map(customers.map((c) => [c.id, c.name]));
    const stats = new Map<string, CustomerStats>();
    registeredSales.forEach((sale) => {
      const id = sale.customerId as string;
      const entry =
        stats.get(id) ??
        {
          id,
          name: nameById.get(id) ?? sale.customerName,
          orders: 0,
          revenue: 0,
          paid: 0,
          balance: 0,
          overdue: 0,
          last: 0,
        };
      const saleMs = new Date(sale.saleDate).getTime();
      entry.orders += 1;
      entry.revenue += sale.netTotal;
      entry.paid += sale.paidAmount;
      entry.balance += Math.max(sale.balance, 0);
      if (sale.balance > 0 && nowMs - saleMs > 60 * DAY) {
        entry.overdue += sale.balance;
      }
      entry.last = Math.max(entry.last, saleMs);
      stats.set(id, entry);
    });
    const statList = Array.from(stats.values());

    const totalRevenue = customerSales.reduce((s, x) => s + x.netTotal, 0);
    const totalPaid = customerSales.reduce((s, x) => s + x.paidAmount, 0);
    const receivables = customerSales.reduce(
      (s, x) => s + Math.max(x.balance, 0),
      0,
    );
    const avgOrder = customerSales.length
      ? totalRevenue / customerSales.length
      : 0;

    const buyers = statList.length;
    const repeatBuyers = statList.filter((s) => s.orders >= 2).length;
    const activeBuyers = statList.filter(
      (s) => nowMs - s.last <= DORMANT_DAYS * DAY,
    ).length;
    const dormant = buyers - activeBuyers;
    const neverPurchased = customers.filter((c) => !stats.has(c.id)).length;

    const top5Revenue = [...statList]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .reduce((s, x) => s + x.revenue, 0);
    const registeredRevenue = statList.reduce((s, x) => s + x.revenue, 0);

    // Trailing 12 months of revenue, order counts, new customers and buying customers.
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: monthKey(date),
        label: date.toLocaleDateString("en-US", { month: "short" }),
        revenue: 0,
        collected: 0,
        newCustomers: 0,
        buyers: new Set<string>(),
      };
    });
    const bucket = new Map(months.map((m) => [m.key, m]));
    customerSales.forEach((sale) => {
      const entry = bucket.get(monthKey(new Date(sale.saleDate)));
      if (!entry) return;
      entry.revenue += sale.netTotal;
      entry.collected += sale.paidAmount;
      if (sale.customerId) entry.buyers.add(sale.customerId);
    });
    customers.forEach((customer) => {
      if (!customer.createdAtUtc) return;
      const entry = bucket.get(monthKey(new Date(customer.createdAtUtc)));
      if (entry) entry.newCustomers += 1;
    });

    const thisMonth = bucket.get(currentMonth)?.revenue ?? 0;
    const lastMonth = months[months.length - 2]?.revenue ?? 0;
    const growth =
      lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
    const newLast30 = customers.filter(
      (c) => c.createdAtUtc && nowMs - new Date(c.createdAtUtc).getTime() <= 30 * DAY,
    ).length;

    // Receivables aging by sale date.
    const aging = [
      { label: "0-30d", min: 0, max: 30, value: 0 },
      { label: "31-60d", min: 31, max: 60, value: 0 },
      { label: "61-90d", min: 61, max: 90, value: 0 },
      { label: "90d+", min: 91, max: Infinity, value: 0 },
    ];
    customerSales.forEach((sale) => {
      if (sale.balance <= 0) return;
      const age = Math.floor((nowMs - new Date(sale.saleDate).getTime()) / DAY);
      const slot = aging.find((a) => age >= a.min && age <= a.max);
      if (slot) slot.value += sale.balance;
    });

    // Payment status of invoices.
    let paidInvoices = 0;
    let partialInvoices = 0;
    let unpaidInvoices = 0;
    customerSales.forEach((sale) => {
      if (sale.balance <= 0) paidInvoices += 1;
      else if (sale.paidAmount > 0) partialInvoices += 1;
      else unpaidInvoices += 1;
    });

    const topByRevenue = [...statList]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
    const topByBalance = [...statList]
      .filter((s) => s.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
    const overdueAccounts = [...statList]
      .filter((s) => s.overdue > 0)
      .sort((a, b) => b.overdue - a.overdue)
      .slice(0, 5);

    const recentCustomers = [...customers]
      .sort(
        (a, b) =>
          new Date(b.createdAtUtc ?? 0).getTime() -
          new Date(a.createdAtUtc ?? 0).getTime(),
      )
      .slice(0, 5);

    return {
      months,
      totalRevenue,
      totalPaid,
      receivables,
      avgOrder,
      orders: customerSales.length,
      buyers,
      repeatBuyers,
      activeBuyers,
      dormant,
      neverPurchased,
      walkInRevenue,
      registeredRevenue,
      top5Share: percent(top5Revenue, registeredRevenue),
      thisMonth,
      growth,
      newLast30,
      aging,
      paidInvoices,
      partialInvoices,
      unpaidInvoices,
      topByRevenue,
      topByBalance,
      overdueAccounts,
      recentCustomers,
      activeCustomers: customers.filter((c) => c.isActive !== false).length,
    };
  }, [customers, sales]);

  const inactiveCustomers = customers.length - report.activeCustomers;
  const collectionRate = percent(report.totalPaid, report.totalRevenue);

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading} />
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
        <Text className="text-foreground" style={styles.headerTitle}>
          Customer Report
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <View>
          <Text style={styles.eyebrow}>Customer analytics</Text>
          <Text style={styles.title}>Customer overview</Text>
          <Text style={styles.subtitle}>
            Based on the latest {count(sales.length)} sales · dealer and voided
            sales excluded
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi
            label="Total customers"
            value={count(customers.length)}
            caption={`${count(inactiveCustomers)} inactive`}
            icon={Users}
            tone="blue"
          />
          <Kpi
            label="Active customers"
            value={count(report.activeCustomers)}
            caption={`${percent(report.activeCustomers, customers.length)}% of base`}
            icon={UserRoundCheck}
            tone="green"
          />
          <Kpi
            label="New · 30 days"
            value={count(report.newLast30)}
            caption="Customers added"
            icon={UserPlus}
            tone="blue"
          />
          <Kpi
            label="Revenue · month"
            value={money(report.thisMonth)}
            caption={
              report.growth === null
                ? "No prior month"
                : `${report.growth >= 0 ? "+" : ""}${report.growth}% vs last month`
            }
            icon={TrendingUp}
            tone={report.growth !== null && report.growth < 0 ? "red" : "green"}
          />
          <Kpi
            label="Lifetime revenue"
            value={money(report.totalRevenue)}
            caption={`${count(report.orders)} orders`}
            icon={ShoppingCart}
            tone="green"
          />
          <Kpi
            label="Avg order value"
            value={money(report.avgOrder)}
            caption="Per sale"
            icon={Receipt}
            tone="blue"
          />
          <Kpi
            label="Receivables"
            value={money(report.receivables)}
            caption={`${count(report.partialInvoices + report.unpaidInvoices)} open invoices`}
            icon={HandCoins}
            tone="amber"
          />
          <Kpi
            label="Collection rate"
            value={`${collectionRate}%`}
            caption={`${money(report.totalPaid)} collected`}
            icon={Percent}
            tone={collectionRate >= 80 ? "green" : "amber"}
          />
          <Kpi
            label="Repeat rate"
            value={`${percent(report.repeatBuyers, report.buyers)}%`}
            caption={`${count(report.repeatBuyers)} of ${count(report.buyers)} buyers`}
            icon={Repeat}
            tone="green"
          />
          <Kpi
            label="Top-5 share"
            value={`${report.top5Share}%`}
            caption="Of registered revenue"
            icon={AlertTriangle}
            tone={report.top5Share >= 60 ? "red" : "blue"}
          />
        </View>

        <Section
          title="Revenue trend"
          subtitle="Last 12 months · billed vs collected"
        >
          <LineChart
            labels={report.months.map((m) => m.label)}
            series={[
              {
                name: "Billed",
                color: COLORS.green,
                values: report.months.map((m) => m.revenue),
              },
              {
                name: "Collected",
                color: COLORS.blue,
                values: report.months.map((m) => m.collected),
              },
            ]}
          />
        </Section>

        <Section
          title="Customer growth"
          subtitle="Last 12 months · new vs buying customers"
        >
          <BarChart
            data={report.months.map((m) => ({
              label: m.label,
              values: [m.newCustomers, m.buyers.size],
            }))}
            series={[
              { name: "New customers", color: COLORS.blue },
              { name: "Buying customers", color: COLORS.green },
            ]}
          />
        </Section>

        <Section
          title="Customer base"
          subtitle="Active vs inactive accounts"
        >
          <DonutChart
            centerLabel="Customers"
            centerValue={count(customers.length)}
            slices={[
              {
                label: "Active",
                value: report.activeCustomers,
                color: COLORS.green,
              },
              { label: "Inactive", value: inactiveCustomers, color: COLORS.slate },
            ]}
            formatValue={count}
          />
        </Section>

        <Section
          title="Buying behaviour"
          subtitle={`Purchased within ${DORMANT_DAYS} days vs dormant`}
        >
          <DonutChart
            centerLabel="Customers"
            centerValue={count(customers.length)}
            slices={[
              { label: "Active buyers", value: report.activeBuyers, color: COLORS.green },
              { label: "Dormant", value: report.dormant, color: COLORS.amber },
              {
                label: "Never purchased",
                value: report.neverPurchased,
                color: COLORS.slate,
              },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title="Revenue source" subtitle="Registered vs walk-in customers">
          <DonutChart
            centerLabel="Revenue"
            centerValue={compactNumber(report.totalRevenue)}
            slices={[
              {
                label: "Registered",
                value: report.registeredRevenue,
                color: COLORS.blue,
              },
              { label: "Walk-in", value: report.walkInRevenue, color: COLORS.purple },
            ]}
          />
        </Section>

        <Section title="Invoice payment status" subtitle="All customer sales">
          <DonutChart
            centerLabel="Invoices"
            centerValue={count(report.orders)}
            slices={[
              { label: "Paid", value: report.paidInvoices, color: COLORS.green },
              { label: "Partial", value: report.partialInvoices, color: COLORS.amber },
              { label: "Unpaid", value: report.unpaidInvoices, color: COLORS.red },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title="Receivables aging" subtitle="Outstanding balance by invoice age">
          <BarChart
            data={report.aging.map((a) => ({ label: a.label, values: [a.value] }))}
            series={[{ name: "Outstanding", color: COLORS.amber }]}
            height={160}
          />
        </Section>

        <Section
          title="Top customers"
          subtitle="By lifetime revenue"
          onViewAll={() => router.push("/customers/list" as Href)}
        >
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Customer</Text>
              <Text style={[styles.th, styles.tdSmall]}>Orders</Text>
              <Text style={[styles.th, styles.tdNum]}>Revenue</Text>
              <Text style={[styles.th, styles.tdNum]}>Balance</Text>
            </View>
            {report.topByRevenue.map((row) => (
              <Pressable
                key={row.id}
                style={styles.tableRow}
                onPress={() =>
                  router.push({
                    pathname: "/customers/view",
                    params: { id: row.id },
                  } as Href)
                }
              >
                <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={[styles.td, styles.tdSmall]}>{count(row.orders)}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>
                  {compactNumber(row.revenue)}
                </Text>
                <Text
                  style={[
                    styles.td,
                    styles.tdNum,
                    row.balance > 0 ? styles.amber : null,
                  ]}
                  numberOfLines={1}
                >
                  {compactNumber(row.balance)}
                </Text>
              </Pressable>
            ))}
            {report.topByRevenue.length === 0 ? (
              <Text style={styles.empty}>No customer sales recorded.</Text>
            ) : null}
          </View>
        </Section>

        <Section title="Top customers by revenue" subtitle="Relative contribution">
          <RankedBars
            items={report.topByRevenue.slice(0, 5).map((row) => ({
              label: row.name,
              value: row.revenue,
              caption: `${count(row.orders)} orders · ${percent(row.revenue, report.registeredRevenue)}% of registered revenue`,
            }))}
            color={COLORS.green}
            formatValue={money}
          />
        </Section>

        <Section
          title="Highest receivables"
          subtitle="Largest outstanding balances"
        >
          <RankedBars
            items={report.topByBalance.map((row) => ({
              label: row.name,
              value: row.balance,
            }))}
            color={COLORS.amber}
            formatValue={money}
            emptyText="No outstanding balances."
          />
        </Section>

        <Section title="Overdue accounts" subtitle="Unpaid for more than 60 days">
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Customer</Text>
              <Text style={[styles.th, styles.tdNum]}>Overdue</Text>
              <Text style={[styles.th, styles.tdNum]}>Last order</Text>
            </View>
            {report.overdueAccounts.map((row) => (
              <Pressable
                key={row.id}
                style={styles.tableRow}
                onPress={() =>
                  router.push({
                    pathname: "/customers/view",
                    params: { id: row.id },
                  } as Href)
                }
              >
                <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={[styles.td, styles.tdNum, styles.red]} numberOfLines={1}>
                  {money(row.overdue)}
                </Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>
                  {new Date(row.last).toLocaleDateString()}
                </Text>
              </Pressable>
            ))}
            {report.overdueAccounts.length === 0 ? (
              <Text style={styles.empty}>No overdue accounts.</Text>
            ) : null}
          </View>
        </Section>

        <Section
          title="Recently added customers"
          subtitle="Newest accounts"
          onViewAll={() => router.push("/customers/list" as Href)}
        >
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Customer</Text>
              <Text style={[styles.th, styles.tdNum]}>Added</Text>
              <Text style={[styles.th, styles.tdStatus]}>Status</Text>
            </View>
            {report.recentCustomers.map((customer) => {
              const active = customer.isActive !== false;
              return (
                <Pressable
                  key={customer.id}
                  style={styles.tableRow}
                  onPress={() =>
                    router.push({
                      pathname: "/customers/view",
                      params: { id: customer.id },
                    } as Href)
                  }
                >
                  <View style={styles.tdWide}>
                    <Text style={styles.td} numberOfLines={1}>
                      {customer.name}
                    </Text>
                    <Text style={styles.tdSub} numberOfLines={1}>
                      {customer.phone || "No phone"}
                    </Text>
                  </View>
                  <Text style={[styles.td, styles.tdNum]}>
                    {customer.createdAtUtc
                      ? new Date(customer.createdAtUtc).toLocaleDateString()
                      : "-"}
                  </Text>
                  <View style={styles.tdStatus}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: active ? "#D1FAE5" : "#FEE2E2" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: active ? "#047857" : "#B91C1C" },
                        ]}
                      >
                        {active ? "ACTIVE" : "INACTIVE"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {report.recentCustomers.length === 0 ? (
              <Text style={styles.empty}>No customers yet.</Text>
            ) : null}
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerButton: { minWidth: 40 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.green,
  },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.ink },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: {
    width: "48%",
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderTopWidth: 3,
    borderRadius: 6,
  },
  kpiHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  kpiIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  kpiLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  kpiValue: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  kpiCaption: { fontSize: 11, color: COLORS.muted },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitleBlock: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.ink },
  sectionSubtitle: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: "700", color: COLORS.green },
  panel: {
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 30,
    paddingHorizontal: 10,
    gap: 6,
    backgroundColor: "#F1F5F9",
  },
  th: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#CBD5E1",
  },
  td: { fontSize: 12, color: COLORS.ink },
  tdSub: { fontSize: 10, color: COLORS.muted },
  tdWide: { flex: 2, minWidth: 0 },
  tdSmall: { flex: 0.8, textAlign: "right" },
  tdNum: { flex: 1.2, textAlign: "right" },
  tdStatus: { flex: 1.1, alignItems: "flex-end" },
  amber: { color: COLORS.amber, fontWeight: "700" },
  red: { color: COLORS.red, fontWeight: "700" },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  empty: {
    padding: 14,
    textAlign: "center",
    fontSize: 12,
    color: COLORS.muted,
  },
});
