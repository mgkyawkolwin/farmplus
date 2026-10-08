'use client';

import * as React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  HandCoins,
  Package,
  ReceiptText,
  TrendingUp,
} from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Purchase } from '@/models/purchase';
import { PurchaseServiceClient } from '@/services/purchaseService';
import { useSelectedShopChanged } from '@/lib/selectedShop';

const purchaseService = new PurchaseServiceClient();

function formatMoney(value: number) {
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
  icon: typeof HandCoins;
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

function RecentPurchaseRow({ purchase }: { purchase: Purchase }) {
  return (
    <View style={styles.purchaseRow}>
      <View style={styles.purchaseCell}>
        <Text className="text-foreground" style={styles.purchaseName} numberOfLines={1}>{purchase.supplierName}</Text>
        <View style={styles.dateRow}>
          <Icon className="text-muted-foreground" as={CalendarDays} size={12} />
          <Text className="text-muted-foreground" style={styles.purchaseDate}>
            {new Date(purchase.purchaseDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text className="text-muted-foreground" style={styles.purchaseCount}>{purchase.totalProducts}</Text>
      <Text className="text-foreground" style={styles.purchaseTotal} numberOfLines={1}>{formatMoney(purchase.netTotal)}</Text>
    </View>
  );
}

export function PurchaseDashboardContent({
  showHeader = true,
  title = 'Purchases',
  onBack,
}: {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadPurchases = React.useCallback(async () => {
    try {
      const result = await purchaseService.getPurchases(1, 200);
      setPurchases(result);
    } catch (error) {
      setPurchases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadPurchases();
      return undefined;
    }, [loadPurchases])
  );

  useSelectedShopChanged(() => {
    void loadPurchases();
  });

  const recentPurchases = React.useMemo(
    () =>
      [...purchases]
        .sort((a, b) => {
          const aDate = new Date(a.purchaseDate).getTime();
          const bDate = new Date(b.purchaseDate).getTime();
          return bDate - aDate;
        })
        .slice(0, 5),
    [purchases]
  );

  const metrics = React.useMemo(() => {
    const totalPurchases = purchases.length;
    const totalProducts = purchases.reduce((sum, purchase) => sum + (purchase.totalProducts ?? 0), 0);
    const totalNet = purchases.reduce((sum, purchase) => sum + (purchase.netTotal ?? 0), 0);
    const recentCount = recentPurchases.length;

    return [
      { label: 'Total Purchases', value: totalPurchases.toLocaleString('en-US'), icon: ReceiptText, tone: 'blue' as const },
      { label: 'Products', value: totalProducts.toLocaleString('en-US'), icon: Package, tone: 'green' as const },
      { label: 'Net Value', value: formatMoney(totalNet), icon: HandCoins, tone: 'amber' as const },
      { label: 'Recent', value: recentCount.toLocaleString('en-US'), icon: TrendingUp, tone: 'red' as const },
    ];
  }, [purchases, recentPurchases]);

  return (
    <View style={styles.page}>
      {showHeader ? (
        <View className="bg-background border-b border-border" style={styles.headerBar}>
          <Button variant="ghost" onPress={onBack ?? (() => router.back())} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text className="text-foreground" style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerButton} />
        </View>
      ) : null}

      {loading && purchases.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading purchases...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadPurchases();
          }} />}
        >
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <Metric key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} tone={metric.tone} />
            ))}
          </View>

          <View style={styles.actionRow}>
            <Button
              style={[styles.actionButton, styles.actionPrimary]}
              onPress={() => router.push('/purchases/new' as Parameters<typeof router.push>[0])}
            >
              <CirclePlus size={18} color="#FFFFFF" />
              <Text style={[styles.actionLabel, styles.actionPrimaryLabel]}>New Purchase</Text>
            </Button>
            <Button
              variant="outline"
              style={[styles.actionButton, styles.actionSecondary]}
              onPress={() => router.push('/purchases/list' as Parameters<typeof router.push>[0])}
            >
              <ClipboardList size={18} color="#16794B" />
              <Text style={[styles.actionLabel, styles.actionSecondaryLabel]}>View Purchases</Text>
            </Button>
          </View>

          <View style={styles.recentSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Purchases</Text>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllButton}
                onPress={() => router.push('/purchases/list' as Parameters<typeof router.push>[0])}
              >
                <Text style={styles.seeAllText}>View all</Text>
                <ChevronRight size={14} color="#16794B" />
              </Button>
            </View>

            <View style={styles.tableHeader}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.purchaseColumn]}>Supplier / Date</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.countColumn]}>Items</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.totalColumn]}>Net Total</Text>
            </View>
            {recentPurchases.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No purchases found.</Text>
              </View>
            ) : (
              recentPurchases.map((purchase) => <RecentPurchaseRow key={purchase.id} purchase={purchase} />)
            )}
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
  seeAllButton: { minHeight: 30, paddingHorizontal: 10, paddingVertical: 0, flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, borderWidth: 1, borderColor: '#CDE8D6', backgroundColor: '#F4FAF6' },
  seeAllText: { fontSize: 11, fontWeight: '700', color: '#16794B', letterSpacing: 0.2 },
  tableHeader: { minHeight: 32, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: '#F1F5F9', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D9DEE5' },
  headerCell: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  purchaseColumn: { flex: 1 },
  countColumn: { width: 45, textAlign: 'right' },
  totalColumn: { width: 118, textAlign: 'right' },
  purchaseRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#CBD5E1', gap: 8 },
  purchaseCell: { flex: 1, gap: 3 },
  purchaseName: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  purchaseDate: { fontSize: 10 },
  purchaseCount: { width: 45, textAlign: 'right', fontSize: 12 },
  purchaseTotal: { width: 118, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  emptyState: { paddingVertical: 26, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});
