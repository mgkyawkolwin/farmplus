'use client';

import * as React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarDays, ChevronLeft, ChevronRight, CirclePlus, ClipboardList, ContactRound, Package, ReceiptText, TrendingUp, Wallet } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { Sale, SaleDashboard } from '@/models/sale';
import { ISaleService } from '@/services/saleService';
import { useSelectedShopChanged } from '@/lib/selectedShop';

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);

function money(value: number) {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} MMK`;
}

const TONE_COLORS = {
  green: '#16794B',
  blue: '#2367A8',
  amber: '#9A6700',
  red: '#B42318',
};

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: 'green' | 'blue' | 'amber' | 'red';
}) {
  const MetricIcon = icon;
  const toneStyle = tone === 'green'
    ? styles.metricgreen
    : tone === 'blue'
      ? styles.metricblue
      : tone === 'amber'
        ? styles.metricamber
        : styles.metricred;

  return (
    <View style={[styles.metricCard, toneStyle, { borderTopColor: TONE_COLORS[tone] }]}>
      <View style={styles.metricHeader}>
        <View style={styles.metricIcon}>
          <MetricIcon size={16} color={TONE_COLORS[tone]} />
        </View>
        <Text className="text-muted-foreground" style={styles.metricLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text className="text-foreground" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function getPaymentStatus(sale: Sale) {
  if (sale.status === 'Voided') return { label: 'VOID', color: '#B91C1C', bg: '#FEE2E2' };
  if (sale.paidAmount > 0 && sale.balance <= 0) return { label: 'PAID', color: '#047857', bg: '#D1FAE5' };
  return { label: 'UNPAID', color: '#B45309', bg: '#FEF3C7' };
}

function RecentSaleRow({ sale }: { sale: Sale }) {
  const status = getPaymentStatus(sale);
  return (
    <View style={styles.saleRow}>
      <View style={styles.customerCell}>
        <Text className="text-foreground" style={styles.customerName} numberOfLines={1}>{sale.customerName}</Text>
        <View style={styles.dateRow}>
          <Icon className="text-muted-foreground" as={CalendarDays} size={12} />
          <Text className="text-muted-foreground" style={styles.saleDate}>{new Date(sale.saleDate).toLocaleDateString()}</Text>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>
      <Text className="text-muted-foreground" style={styles.productCount}>{sale.totalProducts}</Text>
      <Text className="text-foreground" style={styles.saleTotal} numberOfLines={1}>{money(sale.netTotal)}</Text>
    </View>
  );
}

export function SalesDashboardContent({
  showHeader = true,
  title = 'Sales',
  onBack,
}: {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [dashboard, setDashboard] = React.useState<SaleDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadDashboard = React.useCallback(async () => {
    try {
      setDashboard(await saleService.getDashboard());
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Unable to load sales dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadDashboard();
      return undefined;
    }, [loadDashboard]),
  );

  useSelectedShopChanged(() => {
    void loadDashboard();
  });

  return (
    <View style={styles.page}>
      <LoadingOverlay isLoading={loading && dashboard !== null} />
      {showHeader ? (
        <View className="bg-background border-b border-border" style={styles.headerBar}>
          <Button variant="ghost" onPress={onBack ?? (() => router.back())} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text className="text-foreground" style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerButton} />
        </View>
      ) : null}

      {loading && !dashboard ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading sales...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadDashboard();
          }} />}
        >
          <View style={styles.metricsGrid}>
            <Metric label="Today Sale" value={money(dashboard?.todaySales ?? 0)} icon={Wallet} tone="green" />
            <Metric label="This Month Sales" value={money(dashboard?.thisMonthSales ?? 0)} icon={TrendingUp} tone="blue" />
            <Metric label="Total Unpaid Sales" value={(dashboard?.unpaidSales ?? 0).toLocaleString('en-US')} icon={ReceiptText} tone="red" />
            <Metric label="Total Unpaid Amt" value={money(dashboard?.unpaidAmount ?? 0)} icon={Wallet} tone="red" />
            <Metric label="Total Products" value={(dashboard?.totalProducts ?? 0).toLocaleString('en-US')} icon={Package} tone="amber" />
            <Metric label="Total Customers" value={(dashboard?.totalCustomers ?? 0).toLocaleString('en-US')} icon={ContactRound} tone="blue" />
          </View>

          <View style={styles.actionRow}>
            <Button
              style={[styles.actionButton, styles.actionPrimary]}
              onPress={() => router.push('/sales/new' as Parameters<typeof router.push>[0])}
            >
              <CirclePlus size={18} color="#FFFFFF" />
              <Text style={[styles.actionLabel, styles.actionPrimaryLabel]}>New Sale</Text>
            </Button>
            <Button
              variant="outline"
              style={[styles.actionButton, styles.actionSecondary]}
              onPress={() => router.push('/sales/list' as Parameters<typeof router.push>[0])}
            >
              <ClipboardList size={18} color="#16794B" />
              <Text style={[styles.actionLabel, styles.actionSecondaryLabel]}>View Sales</Text>
            </Button>
          </View>

          <View style={styles.recentSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Sales</Text>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllButton}
                onPress={() => router.push('/sales/list' as Parameters<typeof router.push>[0])}
              >
                <Text style={styles.seeAllText}>View all</Text>
                <ChevronRight size={14} color="#16794B" />
              </Button>
            </View>

            <View style={styles.tableHeader}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.customerColumn]}>Customer / Date</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.qtyColumn]}>Qty</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.totalColumn]}>Total</Text>
            </View>
            {(dashboard?.recentSales ?? []).length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No sales recorded yet.</Text>
              </View>
            ) : dashboard?.recentSales.map((sale) => <RecentSaleRow key={sale.id} sale={sale} />)}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  headerButton: { minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 28, gap: 20 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', minHeight: 88, borderRadius: 6, borderWidth: 1, borderTopWidth: 3, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'space-between', gap: 10 },
  metricgreen: { backgroundColor: '#F4FAF6', borderColor: '#D5E9DC' },
  metricblue: { backgroundColor: '#F3F8FC', borderColor: '#D6E6F3' },
  metricamber: { backgroundColor: '#FFFAEE', borderColor: '#EFE2BF' },
  metricred: { backgroundColor: '#FFF5F4', borderColor: '#F0D8D5' },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricIcon: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFAA' },
  metricLabel: { flex: 1, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, minHeight: 46, gap: 8, borderRadius: 6 },
  actionPrimary: { backgroundColor: '#16794B', borderWidth: 1, borderColor: '#16794B' },
  actionSecondary: { backgroundColor: '#F4FAF6', borderWidth: 1, borderColor: '#16794B' },
  actionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  actionPrimaryLabel: { color: '#FFFFFF' },
  actionSecondaryLabel: { color: '#16794B' },
  recentSection: { gap: 0 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionSubtitle: { marginTop: 3, fontSize: 11 },
  seeAllButton: { minHeight: 30, paddingHorizontal: 10, paddingVertical: 0, flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, borderWidth: 1, borderColor: '#CDE8D6', backgroundColor: '#F4FAF6' },
  seeAllText: { fontSize: 11, fontWeight: '700', color: '#16794B', letterSpacing: 0.2 },
  tableHeader: { minHeight: 32, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: '#F1F5F9', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D9DEE5' },
  headerCell: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  customerColumn: { flex: 1 },
  qtyColumn: { width: 45, textAlign: 'right' },
  totalColumn: { width: 118, textAlign: 'right' },
  saleRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#CBD5E1', gap: 8 },
  customerCell: { flex: 1, gap: 3 },
  customerName: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saleDate: { fontSize: 10 },
  statusPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, marginLeft: 4 },
  statusText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  productCount: { width: 45, textAlign: 'right', fontSize: 12 },
  saleTotal: { width: 118, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  emptyState: { paddingVertical: 26, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});
