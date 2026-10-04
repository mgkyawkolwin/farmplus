'use client';

import * as React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ArrowUpRight, ContactRound, HandCoins, Package, ShieldCheck, TrendingUp, Wallet } from 'lucide-react-native';

import HomeTopBar from '@/components/homeTopBar';
import LoadingOverlay from '@/components/loadingOverlay';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { CustomerItem } from '@/models/customer';
import { ProductItem } from '@/models/product';
import { Purchase } from '@/models/purchase';
import { SaleDashboard } from '@/models/sale';
import { ICustomerService } from '@/services/customerService';
import { IProductService } from '@/services/productService';
import { IPurchaseService } from '@/services/purchaseService';
import { ISaleService } from '@/services/saleService';
import { SafeAreaView } from 'react-native-safe-area-context';

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);
const purchaseService = container.resolve<IPurchaseService>(DI_TOKENS.IPurchaseService);
const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);
const customerService = container.resolve<ICustomerService>(DI_TOKENS.ICustomerService);

function money(value: number) {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} MMK`;
}

function countText(value: number) {
  return value.toLocaleString('en-US');
}

function numberBadge(value: number, positive: boolean) {
  return (
    <View style={[styles.trendPill, positive ? styles.trendUp : styles.trendDown]}>
      <ArrowUpRight size={12} color={positive ? '#16794B' : '#B42318'} />
      <Text style={[styles.trendText, positive ? styles.trendTextUp : styles.trendTextDown]}>{value}%</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: typeof Wallet;
  tone: 'green' | 'blue' | 'amber' | 'red';
}) {
  const IconComponent = icon;
  const palette = tone === 'green'
    ? { box: styles.metricGreenBox, accent: '#16794B', bg: '#ECF9F0' }
    : tone === 'blue'
      ? { box: styles.metricBlueBox, accent: '#2367A8', bg: '#EAF4FF' }
      : tone === 'amber'
        ? { box: styles.metricAmberBox, accent: '#A06A00', bg: '#FFF7EA' }
        : { box: styles.metricRedBox, accent: '#B42318', bg: '#FFF1F0' };

  return (
    <View style={[styles.metricCard, palette.box]}>
      <View style={[styles.metricIconWrap, { backgroundColor: palette.bg }]}>
        <IconComponent size={18} color={palette.accent} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtext}>{subtext}</Text>
    </View>
  );
}

function PerformanceRow({
  label,
  value,
  total,
  progress,
  accent,
  hint,
}: {
  label: string;
  value: string;
  total: string;
  progress: number;
  accent: string;
  hint: string;
}) {
  return (
    <View style={styles.performanceRow}>
      <View style={styles.performanceMeta}>
        <Text style={styles.performanceLabel}>{label}</Text>
        <Text style={styles.performanceHint}>{hint}</Text>
      </View>
      <View style={styles.performanceRight}>
        <Text style={styles.performanceValue}>{value}</Text>
        <Text style={styles.performanceTotal}>{total}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(Math.max(progress, 0), 100)}%`, backgroundColor: accent }]} />
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const [sales, setSales] = React.useState<SaleDashboard | null>(null);
  const [purchaseItems, setPurchaseItems] = React.useState<Purchase[]>([]);
  const [productItems, setProductItems] = React.useState<ProductItem[]>([]);
  const [customerItems, setCustomerItems] = React.useState<CustomerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadMetrics = React.useCallback(async () => {
    try {
      const [saleDashboard, products, customers, purchases] = await Promise.all([
        saleService.getDashboard(),
        productService.getProducts(1, 2000),
        customerService.getCustomers(1, 2000),
        purchaseService.getPurchases(1, 2000),
      ]);

      setSales(saleDashboard ?? null);
      setPurchaseItems(Array.isArray(purchases) ? purchases : []);
      setProductItems(Array.isArray(products) ? products : []);
      setCustomerItems(Array.isArray(customers) ? customers : []);
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Unable to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadMetrics();
      return undefined;
    }, [loadMetrics]),
  );

  const monthSales = sales?.thisMonthSales ?? 0;
  const todaySales = sales?.todaySales ?? 0;
  const purchaseTotal = purchaseItems.reduce((sum, item) => sum + (Number(item.netTotal ?? 0) || 0), 0);
  const totalPurchases = purchaseItems.length;
  const averagePurchaseValue = totalPurchases > 0 ? purchaseTotal / totalPurchases : 0;

  const productCount = productItems.length;
  const activeProducts = productItems.filter((product) => product.isActive !== false).length;
  const lowStockProducts = productItems.filter((product) => Number(product.currentStock ?? 0) <= Number(product.minimumStock ?? 0)).length;
  const inventoryHealth = productCount > 0 ? (activeProducts / productCount) * 100 : 0;

  const customerCount = customerItems.length;
  const activeCustomers = customerItems.filter((customer) => customer.isActive !== false).length;
  const inactiveCustomers = customerCount - activeCustomers;
  const customerHealth = customerCount > 0 ? (activeCustomers / customerCount) * 100 : 0;

  const grossMargin = Math.max(monthSales - purchaseTotal, 0);
  const marginPercent = monthSales > 0 ? (grossMargin / monthSales) * 100 : 0;
  const avgOrderValue = sales && sales.recentSales && sales.recentSales.length > 0 ? monthSales / sales.recentSales.length : 0;

  const topProduct = productItems.reduce<ProductItem | null>((best, item) => {
    if (!best) return item;
    return Number(item.currentStock ?? 0) > Number(best.currentStock ?? 0) ? item : best;
  }, null);

  const insights = [
    {
      title: 'Gross margin',
      value: money(grossMargin),
      detail: `${Math.round(marginPercent)}% of sales retained after stock cost`,
      tone: 'green' as const,
    },
    {
      title: 'Inventory alert',
      value: `${countText(lowStockProducts)} items`,
      detail: `${countText(activeProducts)} active products ready for movement`,
      tone: 'amber' as const,
    },
    {
      title: 'Customer health',
      value: `${Math.round(customerHealth)}%`,
      detail: `${countText(activeCustomers)} active vs ${countText(inactiveCustomers)} inactive`,
      tone: 'red' as const,
    },
  ];

  const kpis = [
    {
      label: 'Monthly sales',
      value: money(monthSales),
      subtext: `${money(todaySales)} today`,
      icon: Wallet,
      tone: 'green' as const,
    },
    {
      label: 'Purchases',
      value: money(purchaseTotal),
      subtext: `${countText(totalPurchases)} orders`,
      icon: HandCoins,
      tone: 'blue' as const,
    },
    {
      label: 'Products',
      value: countText(productCount),
      subtext: `${Math.round(inventoryHealth)}% active`,
      icon: Package,
      tone: 'amber' as const,
    },
    {
      label: 'Customers',
      value: countText(customerCount),
      subtext: `${Math.round(customerHealth)}% engaged`,
      icon: ContactRound,
      tone: 'red' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.page}>
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
              void loadMetrics();
            }}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.eyebrow}>Executive summary</Text>
            <Text variant="h2" style={styles.header}>Operations dashboard</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.dotLive} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroLabel}>Month-to-date revenue</Text>
              <Text style={styles.heroValue}>{money(monthSales)}</Text>
            </View>
            <View style={styles.heroTrendWrap}>
              <Icon as={TrendingUp} size={16} color="#A7F3D0" />
              {numberBadge(Math.min(96, Math.max(15, Math.round(marginPercent))), true)}
            </View>
          </View>

          <View style={styles.heroGrid}>
            <View style={styles.heroMiniCard}>
              <Text style={styles.miniLabel}>Today</Text>
              <Text style={styles.miniValue}>{money(todaySales)}</Text>
            </View>
            <View style={styles.heroMiniCard}>
              <Text style={styles.miniLabel}>Gross margin</Text>
              <Text style={styles.miniValue}>{money(grossMargin)}</Text>
            </View>
            <View style={styles.heroMiniCard}>
              <Text style={styles.miniLabel}>Avg order</Text>
              <Text style={styles.miniValue}>{money(avgOrderValue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricGrid}>
          {kpis.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              subtext={item.subtext}
              icon={item.icon}
              tone={item.tone}
            />
          ))}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Performance overview</Text>
            <Text style={styles.panelHint}>Commercial health</Text>
          </View>

          <PerformanceRow
            label="Sales efficiency"
            value={money(monthSales)}
            total={money(monthSales + purchaseTotal)}
            progress={Math.min(100, Math.max(0, marginPercent))}
            accent="#16794B"
            hint={`${Math.round(marginPercent)}% margin`}
          />
          <PerformanceRow
            label="Purchase load"
            value={money(purchaseTotal)}
            total={money(monthSales + purchaseTotal)}
            progress={Math.min(100, Math.max(0, (purchaseTotal / Math.max(monthSales + purchaseTotal, 1)) * 100))}
            accent="#2367A8"
            hint={`${countText(totalPurchases)} orders`}
          />
          <PerformanceRow
            label="Inventory health"
            value={`${Math.round(inventoryHealth)}%`}
            total={`${countText(activeProducts)} active`}
            progress={Math.min(100, Math.max(0, inventoryHealth))}
            accent="#A06A00"
            hint={`${countText(lowStockProducts)} low-stock`}
          />
          <PerformanceRow
            label="Customer retention"
            value={`${Math.round(customerHealth)}%`}
            total={`${countText(activeCustomers)} active`}
            progress={Math.min(100, Math.max(0, customerHealth))}
            accent="#B42318"
            hint={`${countText(inactiveCustomers)} inactive`}
          />
        </View>

        <View style={styles.dualGrid}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Inventory pulse</Text>
              <Text style={styles.panelHint}>Stock</Text>
            </View>

            <View style={styles.listRow}>
              <Text style={styles.listLabel}>Low stock</Text>
              <Text style={styles.listValue}>{countText(lowStockProducts)}</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listLabel}>Active products</Text>
              <Text style={styles.listValue}>{countText(activeProducts)}</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listLabel}>Top stock item</Text>
              <Text style={styles.listValue} numberOfLines={1}>
                {topProduct?.name ?? 'No data'}
              </Text>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Customer pulse</Text>
              <Text style={styles.panelHint}>Engagement</Text>
            </View>

            <View style={styles.listRow}>
              <Text style={styles.listLabel}>Active</Text>
              <Text style={styles.listValue}>{countText(activeCustomers)}</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listLabel}>Inactive</Text>
              <Text style={styles.listValue}>{countText(inactiveCustomers)}</Text>
            </View>
            <View style={styles.listRow}>
              <Text style={styles.listLabel}>Coverage</Text>
              <Text style={styles.listValue}>{Math.round(customerHealth)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Operational insights</Text>
            <View style={styles.insightBadge}>
              <ShieldCheck size={14} color="#16794B" />
              <Text style={styles.insightBadgeText}>Healthy</Text>
            </View>
          </View>

          {insights.map((item) => (
            <View key={item.title} style={styles.insightRow}>
              <View style={[styles.insightDot, item.tone === 'green' ? styles.dotGreen : item.tone === 'amber' ? styles.dotAmber : styles.dotRed]} />
              <View style={styles.insightTextWrap}>
                <Text style={styles.insightTitle}>{item.title}</Text>
                <Text style={styles.insightDetail}>{item.detail}</Text>
              </View>
              <Text style={styles.insightValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#EEF2F4',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 100,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
  },
  header: {
    fontWeight: '700',
    fontSize: 26,
    color: '#0F172A',
  },
  eyebrow: {
    color: '#475467',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAFBF0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CDE8D6',
  },
  dotLive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D9A59',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16794B',
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#0F172A',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTitleWrap: {
    flex: 1,
    gap: 4,
  },
  heroLabel: {
    color: '#B7C4D0',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '800',
  },
  heroTrendWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  miniLabel: {
    color: '#C7D5CF',
    fontSize: 11,
    marginBottom: 6,
  },
  miniValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    minHeight: 124,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  metricGreenBox: {
    backgroundColor: '#F2FBF5',
    borderColor: '#CDE8D6',
  },
  metricBlueBox: {
    backgroundColor: '#F1F8FF',
    borderColor: '#D9EAFB',
  },
  metricAmberBox: {
    backgroundColor: '#FFF9EE',
    borderColor: '#F1E0AF',
  },
  metricRedBox: {
    backgroundColor: '#FFF3F1',
    borderColor: '#F3D7D2',
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    color: '#101828',
    fontSize: 20,
    fontWeight: '800',
  },
  metricSubtext: {
    color: '#6B7280',
    fontSize: 11,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  panelTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  panelHint: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  performanceRow: {
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  performanceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  performanceLabel: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  performanceHint: {
    color: '#6B7280',
    fontSize: 11,
  },
  performanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  performanceValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  performanceTotal: {
    color: '#6B7280',
    fontSize: 11,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  dualGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  listLabel: {
    color: '#475467',
    fontSize: 12,
    flex: 1,
  },
  listValue: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    maxWidth: '55%',
    textAlign: 'right',
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAFBF0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#CDE8D6',
  },
  insightBadgeText: {
    color: '#16794B',
    fontSize: 10,
    fontWeight: '700',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insightDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  dotGreen: {
    backgroundColor: '#16794B',
  },
  dotAmber: {
    backgroundColor: '#A06A00',
  },
  dotRed: {
    backgroundColor: '#B42318',
  },
  insightTextWrap: {
    flex: 1,
    gap: 2,
  },
  insightTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  insightDetail: {
    color: '#6B7280',
    fontSize: 11,
    lineHeight: 16,
  },
  insightValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  trendUp: {
    backgroundColor: '#E8F7EE',
  },
  trendDown: {
    backgroundColor: '#FDECEC',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trendTextUp: {
    color: '#16794B',
  },
  trendTextDown: {
    color: '#B42318',
  },
});
