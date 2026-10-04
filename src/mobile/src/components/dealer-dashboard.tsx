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
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  CirclePlus,
  ClipboardList,
  MapPin,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { DealerItem } from '@/models/dealer';
import { DealerServiceClient } from '@/services/dealerService';

const dealerService = new DealerServiceClient();

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof BriefcaseBusiness;
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

function RecentDealerRow({ dealer }: { dealer: DealerItem }) {
  const lastUpdated = dealer.updatedAtUtc ?? dealer.createdAtUtc ?? null;

  return (
    <View style={styles.dealerRow}>
      <View style={styles.dealerCell}>
        <Text className="text-foreground" style={styles.dealerName} numberOfLines={1}>{dealer.dealerName}</Text>
        <View style={styles.metaRow}>
          <Icon className="text-muted-foreground" as={MapPin} size={12} />
          <Text className="text-muted-foreground" style={styles.dealerMeta} numberOfLines={1}>
            {dealer.city || dealer.stateDivision || dealer.country || 'No location'}
          </Text>
        </View>
      </View>
      <Text className="text-muted-foreground" style={styles.dealerUpdated} numberOfLines={1}>
        {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '-'}
      </Text>
      <Text className={dealer.isActive ? 'text-green-600' : 'text-red-500'} style={styles.dealerStatus}>
        {dealer.isActive ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
}

export function DealerDashboardContent({
  showHeader = true,
  title = 'Dealers',
  onBack,
}: {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [dealers, setDealers] = React.useState<DealerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadDealers = React.useCallback(async () => {
    try {
      const result = await dealerService.getDealers(1, 200);
      setDealers(result);
    } catch (error) {
      setDealers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadDealers();
      return undefined;
    }, [loadDealers])
  );

  const recentDealers = React.useMemo(
    () =>
      [...dealers]
        .sort((a, b) => {
          const aDate = new Date(a.updatedAtUtc ?? a.createdAtUtc ?? 0).getTime();
          const bDate = new Date(b.updatedAtUtc ?? b.createdAtUtc ?? 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 5),
    [dealers]
  );

  const metrics = React.useMemo(() => {
    const totalDealers = dealers.length;
    const activeDealers = dealers.filter((dealer) => dealer.isActive !== false).length;
    const inactiveDealers = dealers.filter((dealer) => dealer.isActive === false).length;

    return [
      { label: 'Total Dealers', value: totalDealers.toLocaleString('en-US'), icon: BriefcaseBusiness, tone: 'blue' as const },
      { label: 'Active', value: activeDealers.toLocaleString('en-US'), icon: UserRoundCheck, tone: 'green' as const },
      { label: 'Inactive', value: inactiveDealers.toLocaleString('en-US'), icon: UserRoundX, tone: 'amber' as const },
      { label: 'Recent', value: recentDealers.length.toLocaleString('en-US'), icon: CalendarDays, tone: 'red' as const },
    ];
  }, [dealers, recentDealers]);

  const quickActions = [
    { label: 'New Dealer', icon: CirclePlus, route: '/dealers/dealers' as const },
    { label: 'View Dealers', icon: ClipboardList, route: '/dealers/dealers' as const },
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

      {loading && dealers.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading dealers...</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          className="bg-background"
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadDealers();
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
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Dealers</Text>
                <Text className="text-muted-foreground" style={styles.sectionSubtitle}>Latest dealer updates</Text>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllButton}
                onPress={() => router.push('/dealers/dealers' as Parameters<typeof router.push>[0])}
              >
                <Text className="text-foreground" style={styles.seeAllText}>View all</Text>
              </Button>
            </View>

            <View style={styles.tableHeader}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.dealerColumn]}>Dealer</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.updatedColumn]}>Updated</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.statusColumn]}>Status</Text>
            </View>

            {recentDealers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No dealers found.</Text>
              </View>
            ) : (
              recentDealers.map((dealer) => <RecentDealerRow key={dealer.id} dealer={dealer} />)
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
  dealerColumn: { flex: 1.5 },
  updatedColumn: { flex: 0.9 },
  statusColumn: { width: 86, textAlign: 'right' },
  dealerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dealerCell: { flex: 1.5, paddingRight: 8 },
  dealerName: { fontSize: 14, fontWeight: '600' },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dealerMeta: { fontSize: 12, flex: 1 },
  dealerUpdated: { flex: 0.9, fontSize: 12, color: '#6B7280' },
  dealerStatus: { width: 86, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { marginTop: 12, fontSize: 14 },
  emptyState: { padding: 16, alignItems: 'center' },
});
