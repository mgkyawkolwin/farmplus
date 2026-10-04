'use client';

import * as React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, ChevronLeft, CirclePlus, ClipboardList, ContactRound, Package, TrendingUp, Wallet } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { Sale, SaleDashboard } from '@/models/sale';
import { ISaleService } from '@/services/saleService';

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);

function money(value: number) {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} MMK`;
}

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
    <View style={[styles.metricCard, toneStyle]}>
      <View style={styles.metricIcon}>
        <MetricIcon size={19} color={tone === 'green' ? '#16794B' : tone === 'blue' ? '#2367A8' : tone === 'amber' ? '#9A6700' : '#B42318'} />
      </View>
      <Text className="text-muted-foreground" style={styles.metricLabel}>{label}</Text>
      <Text className="text-foreground" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function RecentSaleRow({ sale }: { sale: Sale }) {
  return (
    <View style={styles.saleRow}>
      <View style={styles.customerCell}>
        <Text className="text-foreground" style={styles.customerName} numberOfLines={1}>{sale.customerName}</Text>
        <View style={styles.dateRow}>
          <Icon className="text-muted-foreground" as={CalendarDays} size={12} />
          <Text className="text-muted-foreground" style={styles.saleDate}>{new Date(sale.saleDate).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text className="text-muted-foreground" style={styles.productCount}>{sale.totalProducts}</Text>
      <Text className="text-foreground" style={styles.saleTotal} numberOfLines={1}>{money(sale.netTotal)}</Text>
    </View>
  );
}

export default function SalesDashboardScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && dashboard !== null} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Sales</Text>
        <View style={styles.headerButton} />
      </View>

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
            <Metric label="Total Products" value={(dashboard?.totalProducts ?? 0).toLocaleString('en-US')} icon={Package} tone="amber" />
            <Metric label="Total Customers" value={(dashboard?.totalCustomers ?? 0).toLocaleString('en-US')} icon={ContactRound} tone="red" />
          </View>

          <View style={styles.actionRow}>
            <Button
              variant="outline"
              style={styles.actionButton}
              onPress={() => router.push('/sales/new' as Parameters<typeof router.push>[0])}
            >
              <Icon className="text-foreground" as={CirclePlus} size={19} />
              <Text className="text-foreground" style={styles.actionLabel}>New Sale</Text>
            </Button>
            <Button
              variant="outline"
              style={styles.actionButton}
              onPress={() => router.push('/sales/list' as Parameters<typeof router.push>[0])}
            >
              <Icon className="text-foreground" as={ClipboardList} size={19} />
              <Text className="text-foreground" style={styles.actionLabel}>View Sales</Text>
            </Button>
          </View>

          <View style={styles.recentSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Sales</Text>
                <Text className="text-muted-foreground" style={styles.sectionSubtitle}>Latest 10 transactions</Text>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllButton}
                onPress={() => router.push('/sales/list' as Parameters<typeof router.push>[0])}
              >
                <Text className="text-foreground" style={styles.seeAllText}>View all</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  headerButton: { minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 28, gap: 20 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', minHeight: 126, borderRadius: 8, borderWidth: 1, padding: 13, justifyContent: 'space-between' },
  metricgreen: { backgroundColor: '#EFF8F2', borderColor: '#CDE8D6' },
  metricblue: { backgroundColor: '#EEF6FC', borderColor: '#D1E5F5' },
  metricamber: { backgroundColor: '#FFF8E8', borderColor: '#F0E0B7' },
  metricred: { backgroundColor: '#FFF1F0', borderColor: '#F2D4D0' },
  metricIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFAA' },
  metricLabel: { fontSize: 12, fontWeight: '500' },
  metricValue: { fontSize: 19, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, minHeight: 48, gap: 8, borderRadius: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  recentSection: { gap: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { marginTop: 3, fontSize: 12 },
  seeAllButton: { minHeight: 36, paddingHorizontal: 8 },
  seeAllText: { fontSize: 12, fontWeight: '600' },
  tableHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D9DEE5' },
  headerCell: { fontSize: 10, fontWeight: '700' },
  customerColumn: { flex: 1 },
  qtyColumn: { width: 45, textAlign: 'right' },
  totalColumn: { width: 118, textAlign: 'right' },
  saleRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB', gap: 8 },
  customerCell: { flex: 1, gap: 3 },
  customerName: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saleDate: { fontSize: 10 },
  productCount: { width: 45, textAlign: 'right', fontSize: 12 },
  saleTotal: { width: 118, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  emptyState: { paddingVertical: 26, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});