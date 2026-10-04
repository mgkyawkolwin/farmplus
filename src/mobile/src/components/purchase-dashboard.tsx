'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CalendarDays,
  ChevronLeft,
  CirclePlus,
  ClipboardList,
  HandCoins,
  Package,
  ReceiptText,
  Store,
  TrendingUp,
} from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Purchase } from '@/models/purchase';
import { PurchaseServiceClient } from '@/services/purchaseService';

const purchaseService = new PurchaseServiceClient();

function formatMoney(value: number) {
  return `MMK ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

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
    <View style={[styles.metricCard, toneStyle]}>
      <View style={styles.metricIcon}>
        <MetricIcon
          size={19}
          color={tone === 'green' ? '#16794B' : tone === 'blue' ? '#2367A8' : tone === 'amber' ? '#9A6700' : '#B42318'}
        />
      </View>
      <Text className="text-muted-foreground" style={styles.metricLabel}>{label}</Text>
      <Text className="text-foreground" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function RecentPurchaseRow({ purchase }: { purchase: Purchase }) {
  return (
    <View style={styles.purchaseRow}>
      <View style={styles.purchaseCell}>
        <Text className="text-foreground" style={styles.purchaseName} numberOfLines={1}>{purchase.supplierName}</Text>
        <View style={styles.metaRow}>
          <Icon className="text-muted-foreground" as={CalendarDays} size={12} />
          <Text className="text-muted-foreground" style={styles.purchaseMeta} numberOfLines={1}>
            {new Date(purchase.purchaseDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text className="text-muted-foreground" style={styles.purchaseAmount} numberOfLines={1}>
        {formatMoney(purchase.netTotal)}
      </Text>
      <Text className="text-foreground" style={styles.purchaseCount} numberOfLines={1}>
        {purchase.totalProducts}
      </Text>
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

  const quickActions = [
    { label: 'New Purchase', icon: CirclePlus, route: '/purchases/new' as const },
    { label: 'View Purchases', icon: ClipboardList, route: '/purchases/list' as const },
  ];

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
        <KeyboardAwareScrollView
          className="bg-background"
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadPurchases();
          }} />}
        >
          <View style={styles.headerRow}>
            <Text variant="h3" className="text-foreground">Overview</Text>
          </View>

          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <Metric key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} tone={metric.tone} />
            ))}
          </View>

          <View style={styles.quickActionsContainer}>
            <Text variant="h3" className="text-foreground" style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Pressable key={`${action.label}-${index}`} style={styles.actionButton} onPress={() => router.push(action.route)}>
                    <IconComponent size={28} color="#1F2937" />
                    <Text className="text-foreground text-xs" style={styles.actionLabel}>{action.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.tableCard}>
            <View style={styles.sectionHeading}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Purchases</Text>
                <Text className="text-muted-foreground" style={styles.sectionSubtitle}>Latest purchase entries</Text>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllButton}
                onPress={() => router.push('/purchases/list' as Parameters<typeof router.push>[0])}
              >
                <Text className="text-foreground" style={styles.seeAllText}>View all</Text>
              </Button>
            </View>

            <View style={styles.tableHeader}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.purchaseColumn]}>Supplier</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.amountColumn]}>Net total</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.countColumn]}>Items</Text>
            </View>

            {recentPurchases.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No purchases found.</Text>
              </View>
            ) : (
              recentPurchases.map((purchase) => <RecentPurchaseRow key={purchase.id} purchase={purchase} />)
            )}
          </View>
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  headerButton: { minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', minHeight: 126, borderRadius: 8, borderWidth: 1, padding: 13, justifyContent: 'space-between' },
  metricgreen: { backgroundColor: '#EFF8F2', borderColor: '#CDE8D6' },
  metricblue: { backgroundColor: '#EEF6FC', borderColor: '#D1E5F5' },
  metricamber: { backgroundColor: '#FFF8E8', borderColor: '#F0E0B7' },
  metricred: { backgroundColor: '#FFF1F0', borderColor: '#F2D4D0' },
  metricIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFAA' },
  metricLabel: { fontSize: 12, fontWeight: '500' },
  metricValue: { fontSize: 19, fontWeight: '700' },
  quickActionsContainer: { marginTop: 18, gap: 10 },
  quickActionsTitle: { fontSize: 17, fontWeight: '700' },
  quickActionsGrid: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, minHeight: 64, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  actionLabel: { fontSize: 12, fontWeight: '600' },
  tableCard: { marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12, overflow: 'hidden' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { fontSize: 12, marginTop: 2 },
  seeAllButton: { paddingHorizontal: 8, paddingVertical: 4 },
  seeAllText: { fontSize: 12, fontWeight: '600' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  headerCell: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  purchaseColumn: { flex: 1.5 },
  amountColumn: { flex: 1.2 },
  countColumn: { width: 70, textAlign: 'right' },
  purchaseRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  purchaseCell: { flex: 1.5, paddingRight: 8 },
  purchaseName: { fontSize: 14, fontWeight: '600' },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  purchaseMeta: { fontSize: 12, flex: 1 },
  purchaseAmount: { flex: 1.2, fontSize: 12, color: '#111827', textAlign: 'right' },
  purchaseCount: { width: 70, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { marginTop: 12, fontSize: 14 },
  emptyState: { padding: 16, alignItems: 'center' },
});
