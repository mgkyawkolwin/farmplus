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
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  MapPin,
  Percent,
  Receipt,
  Repeat,
  ShoppingCart,
  TrendingUp,
  UserRoundCheck,
  UserPlus,
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
import { DealerItem } from "@/models/dealer";
import { Sale } from "@/models/sale";
import { DealerServiceClient } from "@/services/dealerService";
import { ISaleService } from "@/services/saleService";
import { usePagePermission } from "@/lib/usePagePermission";
import { useTranslation } from 'react-i18next';

const dealerService = new DealerServiceClient();
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

type DealerStats = {
  id: string;
  name: string;
  isActive: boolean;
  location: string;
  phone?: string;
  orders: number;
  revenue: number;
  paid: number;
  balance: number;
  overdue: number;
  last: number;
};

export default function DealerReportDashboardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const permissionState = usePagePermission('/reports/dealers/dashboard');
  const [dealers, setDealers] = React.useState<DealerItem[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    const [dealerResult, saleResult] = await Promise.allSettled([
      (async () => {
        const all: DealerItem[] = [];
        let page = 1;
        while (true) {
          const next = await dealerService.getDealers(page, PAGE_SIZE);
          all.push(...next);
          if (next.length < PAGE_SIZE) break;
          page += 1;
        }
        return all;
      })(),
      (async () => {
        const all: Sale[] = [];
        let page = 1;
        while (true) {
          const next = await saleService.getSales(page, PAGE_SIZE);
          all.push(...next);
          if (next.length < PAGE_SIZE) break;
          page += 1;
        }
        return all;
      })(),
    ]);

    if (dealerResult.status === "rejected" && saleResult.status === "rejected") {
      SnackBar.Error(t('reports.common.loadFailed'));
    }
    setDealers(dealerResult.status === "fulfilled" ? dealerResult.value : []);
    setSales(saleResult.status === "fulfilled" ? saleResult.value : []);
    setLoading(false);
    setRefreshing(false);
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
    const dealerById = new Map(dealers.map((dealer) => [dealer.id, dealer]));
    const dealerSales = sales.filter((sale) => sale.dealerId && sale.status !== "Voided");
    const stats = new Map<string, DealerStats>();

    dealers.forEach((dealer) => {
      stats.set(dealer.id, {
        id: dealer.id,
        name: dealer.dealerName,
        isActive: dealer.isActive !== false,
        location: [dealer.city, dealer.stateDivision, dealer.country].filter(Boolean).join(", ") || "No location",
        phone: dealer.phoneNumber,
        orders: 0,
        revenue: 0,
        paid: 0,
        balance: 0,
        overdue: 0,
        last: 0,
      });
    });

    dealerSales.forEach((sale) => {
      const id = sale.dealerId;
      if (!id) return;
      const dealer = dealerById.get(id);
      const entry = stats.get(id) ?? {
        id,
        name: dealer?.dealerName ?? sale.customerName,
        isActive: dealer?.isActive !== false,
        location: [dealer?.city, dealer?.stateDivision, dealer?.country].filter(Boolean).join(", ") || "No location",
        phone: dealer?.phoneNumber,
        orders: 0,
        revenue: 0,
        paid: 0,
        balance: 0,
        overdue: 0,
        last: 0,
      };
      const saleMs = timestamp(sale.saleDate);
      entry.orders += 1;
      entry.revenue += sale.netTotal;
      entry.paid += sale.paidAmount;
      entry.balance += Math.max(sale.balance, 0);
      if (sale.balance > 0 && nowMs - saleMs > 60 * DAY) entry.overdue += sale.balance;
      entry.last = Math.max(entry.last, saleMs);
      stats.set(id, entry);
    });

    const statList = [...stats.values()];
    const totalRevenue = dealerSales.reduce((sum, sale) => sum + sale.netTotal, 0);
    const totalPaid = dealerSales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const receivables = dealerSales.reduce((sum, sale) => sum + Math.max(sale.balance, 0), 0);
    const avgOrder = dealerSales.length ? totalRevenue / dealerSales.length : 0;
    const buyers = statList.filter((dealer) => dealer.orders > 0).length;
    const repeatBuyers = statList.filter((dealer) => dealer.orders >= 2).length;
    const activeBuyers = statList.filter((dealer) => dealer.orders > 0 && nowMs - dealer.last <= DORMANT_DAYS * DAY).length;
    const dormant = buyers - activeBuyers;
    const neverPurchased = statList.filter((dealer) => dealer.orders === 0).length;
    const top5Revenue = [...statList]
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5)
      .reduce((sum, dealer) => sum + dealer.revenue, 0);

    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: monthKey(date),
          label: date.toLocaleDateString(i18n.language, { month: "short" }),
        revenue: 0,
        collected: 0,
        newDealers: 0,
        buyers: new Set<string>(),
      };
    });
    const bucket = new Map(months.map((month) => [month.key, month]));
    dealerSales.forEach((sale) => {
      const month = bucket.get(monthKey(new Date(timestamp(sale.saleDate))));
      if (!month || !sale.dealerId) return;
      month.revenue += sale.netTotal;
      month.collected += sale.paidAmount;
      month.buyers.add(sale.dealerId);
    });
    dealers.forEach((dealer) => {
      if (!dealer.createdAtUtc) return;
      const month = bucket.get(monthKey(new Date(timestamp(dealer.createdAtUtc))));
      if (month) month.newDealers += 1;
    });

    const thisMonth = bucket.get(currentMonth)?.revenue ?? 0;
    const lastMonth = months[months.length - 2]?.revenue ?? 0;
    const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
    const newLast30 = dealers.filter((dealer) =>
      dealer.createdAtUtc && nowMs - timestamp(dealer.createdAtUtc) <= 30 * DAY,
    ).length;

    const aging = [
      { label: "0-30d", min: 0, max: 30, value: 0 },
      { label: "31-60d", min: 31, max: 60, value: 0 },
      { label: "61-90d", min: 61, max: 90, value: 0 },
      { label: "90d+", min: 91, max: Infinity, value: 0 },
    ];
    let paidInvoices = 0;
    let partialInvoices = 0;
    let unpaidInvoices = 0;
    dealerSales.forEach((sale) => {
      if (sale.balance <= 0) paidInvoices += 1;
      else if (sale.paidAmount > 0) partialInvoices += 1;
      else unpaidInvoices += 1;
      if (sale.balance <= 0) return;
      const age = Math.floor((nowMs - timestamp(sale.saleDate)) / DAY);
      const slot = aging.find((item) => age >= item.min && age <= item.max);
      if (slot) slot.value += sale.balance;
    });

    const topByRevenue = [...statList].sort((left, right) => right.revenue - left.revenue).slice(0, 8);
    const topByBalance = [...statList].filter((dealer) => dealer.balance > 0)
      .sort((left, right) => right.balance - left.balance).slice(0, 5);
    const overdueAccounts = [...statList].filter((dealer) => dealer.overdue > 0)
      .sort((left, right) => right.overdue - left.overdue).slice(0, 5);
    const recentDealers = [...dealers]
      .sort((left, right) => timestamp(right.createdAtUtc) - timestamp(left.createdAtUtc))
      .slice(0, 6);
    const activeDealers = dealers.filter((dealer) => dealer.isActive !== false).length;
    const locationMap = new Map<string, { count: number; revenue: number }>();
    statList.forEach((dealer) => {
      const area = dealer.location.split(",")[0] || "No location";
      const entry = locationMap.get(area) ?? { count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += dealer.revenue;
      locationMap.set(area, entry);
    });
    const topLocations = [...locationMap.entries()]
      .map(([label, value]) => ({ label, ...value }))
      .sort((left, right) => right.revenue - left.revenue || right.count - left.count)
      .slice(0, 8);

    return {
      months,
      totalRevenue,
      totalPaid,
      receivables,
      avgOrder,
      orders: dealerSales.length,
      buyers,
      repeatBuyers,
      activeBuyers,
      dormant,
      neverPurchased,
      top5Share: percent(top5Revenue, totalRevenue),
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
      recentDealers,
      activeDealers,
      topLocations,
    };
  }, [dealers, sales, i18n.language]);

  const inactiveDealers = dealers.length - report.activeDealers;
  const collectionRate = percent(report.totalPaid, report.totalRevenue);
  const dealerListRoute = "/dealers/dealers" as Href;

  const openDealer = (id: string) =>
    router.push({ pathname: "/dealers/view", params: { id } } as Href);

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <LoadingOverlay isLoading={permissionState === 'authorized' && loading} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{t('reports.dealers.title')}</Text>
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
          <Text style={styles.eyebrow}>{t('reports.dealers.eyebrow')}</Text>
          <Text style={styles.title}>{t('reports.dealers.overview')}</Text>
          <Text style={styles.subtitle}>
            {t('reports.dealers.subtitle', { count: count(report.orders) })}
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi label={t('reports.dealers.kpi.totalDealers')} value={count(dealers.length)} caption={t('reports.dealers.caption.inactive', { count: count(inactiveDealers) })} icon={BriefcaseBusiness} tone="blue" />
          <Kpi label={t('reports.dealers.kpi.activeDealers')} value={count(report.activeDealers)} caption={`${percent(report.activeDealers, dealers.length)}% of base`} icon={UserRoundCheck} tone="green" />
          <Kpi label={t('reports.dealers.kpi.new30')} value={count(report.newLast30)} caption={t('reports.dealers.caption.dealersAdded')} icon={UserPlus} tone="blue" />
          <Kpi label={t('reports.dealers.kpi.revenueMonth')} value={money(report.thisMonth)} caption={report.growth === null ? t('reports.dealers.caption.noPriorMonth') : t('reports.dealers.caption.growth', { growth: `${report.growth >= 0 ? "+" : ""}${report.growth}` })} icon={TrendingUp} tone={report.growth !== null && report.growth < 0 ? "red" : "green"} />
          <Kpi label={t('reports.dealers.kpi.lifetimeRevenue')} value={money(report.totalRevenue)} caption={t('reports.dealers.caption.orders', { count: count(report.orders) })} icon={ShoppingCart} tone="green" />
          <Kpi label={t('reports.dealers.kpi.avgOrderValue')} value={money(report.avgOrder)} caption={t('reports.dealers.caption.perSale')} icon={Receipt} tone="blue" />
          <Kpi label={t('reports.dealers.kpi.outstanding')} value={money(report.receivables)} caption={t('reports.dealers.caption.openInvoices', { count: count(report.partialInvoices + report.unpaidInvoices) })} icon={HandCoins} tone="amber" />
          <Kpi label={t('reports.dealers.kpi.collectionRate')} value={`${collectionRate}%`} caption={t('reports.dealers.caption.collected', { amount: money(report.totalPaid) })} icon={Percent} tone={collectionRate >= 80 ? "green" : "amber"} />
          <Kpi label={t('reports.dealers.kpi.repeatRate')} value={`${percent(report.repeatBuyers, report.buyers)}%`} caption={t('reports.dealers.caption.buyers', { repeat: count(report.repeatBuyers), total: count(report.buyers) })} icon={Repeat} tone="green" />
          <Kpi label={t('reports.dealers.kpi.top5Share')} value={`${report.top5Share}%`} caption={t('reports.dealers.caption.dealerRevenue')} icon={AlertTriangle} tone={report.top5Share >= 60 ? "red" : "blue"} />
        </View>

        <Section title={t('reports.dealers.section.revenueTrend')} subtitle={t('reports.dealers.subtitleSection.billedCollected12Months')}>
          <LineChart
            labels={report.months.map((month) => month.label)}
            series={[
              { name: t('reports.dealers.series.billed'), color: COLORS.green, values: report.months.map((month) => month.revenue) },
              { name: t('reports.dealers.series.collected'), color: COLORS.blue, values: report.months.map((month) => month.collected) },
            ]}
          />
        </Section>

        <Section title={t('reports.dealers.section.activity')} subtitle={t('reports.dealers.subtitleSection.activity')}>
          <BarChart
            data={report.months.map((month) => ({ label: month.label, values: [month.newDealers, month.buyers.size] }))}
            series={[
              { name: t('reports.dealers.series.newDealers'), color: COLORS.blue },
              { name: t('reports.dealers.series.buyingDealers'), color: COLORS.green },
            ]}
          />
        </Section>

        <Section title={t('reports.dealers.section.dealerBase')} subtitle={t('reports.dealers.subtitleSection.activeInactive')}>
          <DonutChart
            centerLabel={t('reports.dealers.chart.dealers')}
            centerValue={count(dealers.length)}
            slices={[
              { label: t('reports.dealers.chart.active'), value: report.activeDealers, color: COLORS.green },
              { label: t('reports.dealers.chart.inactive'), value: inactiveDealers, color: COLORS.slate },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title={t('reports.dealers.section.buyingBehaviour')} subtitle={t('reports.dealers.subtitleSection.boughtDormant', { days: DORMANT_DAYS })}>
          <DonutChart
            centerLabel={t('reports.dealers.chart.dealers')}
            centerValue={count(dealers.length)}
            slices={[
              { label: t('reports.dealers.chart.activeBuyers'), value: report.activeBuyers, color: COLORS.green },
              { label: t('reports.dealers.chart.dormant'), value: report.dormant, color: COLORS.amber },
              { label: t('reports.dealers.chart.neverPurchased'), value: report.neverPurchased, color: COLORS.slate },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title={t('reports.dealers.section.invoiceStatus')} subtitle={t('reports.dealers.subtitleSection.allSales')}>
          <DonutChart
            centerLabel={t('reports.dealers.chart.invoices')}
            centerValue={count(report.orders)}
            slices={[
              { label: t('reports.dealers.chart.paid'), value: report.paidInvoices, color: COLORS.green },
              { label: t('reports.dealers.chart.partial'), value: report.partialInvoices, color: COLORS.amber },
              { label: t('reports.dealers.chart.unpaid'), value: report.unpaidInvoices, color: COLORS.red },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title={t('reports.dealers.section.receivablesAging')} subtitle={t('reports.dealers.subtitleSection.aging')}>
          <BarChart
            data={report.aging.map((item, index) => ({ label: t(['reports.common.age0to30', 'reports.common.age31to60', 'reports.common.age61to90', 'reports.common.age90Plus'][index]), values: [item.value] }))}
            series={[{ name: t('reports.dealers.series.outstanding'), color: COLORS.amber }]}
            height={160}
          />
        </Section>

        <Section title={t('reports.dealers.section.topDealers')} subtitle={t('reports.dealers.subtitleSection.lifetimeRevenue')} onViewAll={() => router.push(dealerListRoute)}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>{t('reports.dealers.field.dealer')}</Text>
              <Text style={[styles.th, styles.tdSmall]}>{t('reports.dealers.field.orders')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.dealers.field.revenue')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.dealers.field.balance')}</Text>
            </View>
            {report.topByRevenue.map((dealer) => (
              <Pressable key={dealer.id} style={styles.tableRow} onPress={() => openDealer(dealer.id)}>
                <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>{dealer.name}</Text>
                <Text style={[styles.td, styles.tdSmall]}>{count(dealer.orders)}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>{compactNumber(dealer.revenue)}</Text>
                <Text style={[styles.td, styles.tdNum, dealer.balance > 0 ? styles.amber : null]} numberOfLines={1}>{compactNumber(dealer.balance)}</Text>
              </Pressable>
            ))}
            {report.topByRevenue.length === 0 ? <Text style={styles.empty}>{t('reports.dealers.empty.noSales')}</Text> : null}
          </View>
        </Section>

        <Section title={t('reports.dealers.section.revenueConcentration')} subtitle={t('reports.dealers.subtitleSection.shareRevenue')}>
          <RankedBars
            items={report.topByRevenue.slice(0, 5).map((dealer) => ({
              label: dealer.name,
              value: dealer.revenue,
              caption: t('reports.dealers.captionText.revenueShare', { count: count(dealer.orders), percent: percent(dealer.revenue, report.totalRevenue) }),
            }))}
            color={COLORS.green}
            formatValue={money}
            emptyText={t('reports.dealers.empty.noSales')}
          />
        </Section>

        <Section title={t('reports.dealers.section.highestReceivables')} subtitle={t('reports.dealers.subtitleSection.largestBalances')}>
          <RankedBars
            items={report.topByBalance.map((dealer) => ({ label: dealer.name, value: dealer.balance }))}
            color={COLORS.amber}
            formatValue={money}
            emptyText={t('reports.dealers.empty.noBalances')}
          />
        </Section>

        <Section title={t('reports.dealers.section.overdueAccounts')} subtitle={t('reports.dealers.subtitleSection.overdue60Days')}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>{t('reports.dealers.field.dealer')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.dealers.field.overdue')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.dealers.field.lastOrder')}</Text>
            </View>
            {report.overdueAccounts.map((dealer) => (
              <Pressable key={dealer.id} style={styles.tableRow} onPress={() => openDealer(dealer.id)}>
                <Text style={[styles.td, styles.tdWide]} numberOfLines={1}>{dealer.name}</Text>
                <Text style={[styles.td, styles.tdNum, styles.red]} numberOfLines={1}>{money(dealer.overdue)}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>
                  {dealer.last ? new Date(dealer.last).toLocaleDateString() : "-"}
                </Text>
              </Pressable>
            ))}
            {report.overdueAccounts.length === 0 ? <Text style={styles.empty}>{t('reports.dealers.empty.noOverdue')}</Text> : null}
          </View>
        </Section>

        <Section title={t('reports.dealers.section.locations')} subtitle={t('reports.dealers.subtitleSection.locations')}>
          <RankedBars
            items={report.topLocations.map((area) => ({
              label: area.label === 'No location' ? t('reports.dealers.empty.noLocation') : area.label,
              value: area.revenue,
              caption: t('reports.dealers.captionText.dealerCount', { count: count(area.count) }),
            }))}
            color={COLORS.blue}
            formatValue={money}
            emptyText={t('reports.dealers.empty.noLocations')}
          />
        </Section>

        <Section title={t('reports.dealers.section.recentlyAdded')} subtitle={t('reports.dealers.subtitleSection.newestAccounts')} onViewAll={() => router.push(dealerListRoute)}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>{t('reports.dealers.field.dealer')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.dealers.field.added')}</Text>
              <Text style={[styles.th, styles.tdStatus]}>{t('reports.dealers.field.status')}</Text>
            </View>
            {report.recentDealers.map((dealer) => {
              const active = dealer.isActive !== false;
              return (
                <Pressable key={dealer.id} style={styles.tableRow} onPress={() => openDealer(dealer.id)}>
                  <View style={styles.tdWide}>
                    <Text style={styles.td} numberOfLines={1}>{dealer.dealerName}</Text>
                    <View style={styles.locationRow}>
                      <MapPin size={10} color={COLORS.muted} />
                      <Text style={styles.tdSub} numberOfLines={1}>
                        {[dealer.city, dealer.country].filter(Boolean).join(", ") || t('reports.dealers.empty.noLocation')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.td, styles.tdNum]}>
                    {dealer.createdAtUtc ? new Date(dealer.createdAtUtc).toLocaleDateString() : "-"}
                  </Text>
                  <View style={styles.tdStatus}>
                    <View style={[styles.statusPill, { backgroundColor: active ? "#D1FAE5" : "#FEE2E2" }]}>
                      <Text style={[styles.statusText, { color: active ? "#047857" : "#B91C1C" }]}>
                        {active ? t('reports.common.active') : t('reports.common.inactive')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {report.recentDealers.length === 0 ? <Text style={styles.empty}>{t('reports.dealers.empty.noDealers')}</Text> : null}
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
  tdSub: { flex: 1, fontSize: 10, color: COLORS.muted },
  tdWide: { flex: 2, minWidth: 0 },
  tdSmall: { flex: 0.8, textAlign: "right" },
  tdNum: { flex: 1.2, textAlign: "right" },
  tdStatus: { flex: 1.1, alignItems: "flex-end" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  amber: { color: COLORS.amber, fontWeight: "700" },
  red: { color: COLORS.red, fontWeight: "700" },
  statusPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { marginTop: 8, textAlign: "center" },
  empty: { padding: 14, textAlign: "center", fontSize: 12, color: COLORS.muted },
});