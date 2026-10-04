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
  ContactRound,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { container, DI_TOKENS } from '@/di';
import { CustomerItem } from '@/models/customer';
import { ICustomerService } from '@/services/customerService';

const customerService = container.resolve<ICustomerService>(DI_TOKENS.ICustomerService);

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Users;
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

function RecentCustomerRow({ customer }: { customer: CustomerItem }) {
  const lastUpdated = customer.updatedAtUtc ?? customer.createdAtUtc ?? null;

  return (
    <View style={styles.customerRow}>
      <View style={styles.customerCell}>
        <Text className="text-foreground" style={styles.customerName} numberOfLines={1}>{customer.name}</Text>
        <View style={styles.dateRow}>
          <Icon className="text-muted-foreground" as={CalendarDays} size={12} />
          <Text className="text-muted-foreground" style={styles.customerMeta}>
            {customer.phone || 'No phone'}
          </Text>
        </View>
      </View>
      <Text className="text-muted-foreground" style={styles.customerUpdated} numberOfLines={1}>
        {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '-'}
      </Text>
      <Text className={customer.isActive ? 'text-green-600' : 'text-red-500'} style={styles.customerStatus}>
        {customer.isActive ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
}

export function CustomerDashboardContent({
  showHeader = true,
  title = 'Customers',
  onBack,
}: {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [customers, setCustomers] = React.useState<CustomerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadCustomers = React.useCallback(async () => {
    try {
      const result = await customerService.getCustomers(1, 200);
      setCustomers(result);
    } catch (error) {
      setCustomers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadCustomers();
      return undefined;
    }, [loadCustomers])
  );

  const recentCustomers = React.useMemo(
    () =>
      [...customers]
        .sort((a, b) => {
          const aDate = new Date(a.updatedAtUtc ?? a.createdAtUtc ?? 0).getTime();
          const bDate = new Date(b.updatedAtUtc ?? b.createdAtUtc ?? 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 5),
    [customers]
  );

  const metrics = React.useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((customer) => customer.isActive !== false).length;
    const inactiveCustomers = customers.filter((customer) => customer.isActive === false).length;

    return [
      { label: 'Total Customers', value: totalCustomers.toLocaleString('en-US'), icon: Users, tone: 'blue' as const },
      { label: 'Active', value: activeCustomers.toLocaleString('en-US'), icon: UserRoundCheck, tone: 'green' as const },
      { label: 'Inactive', value: inactiveCustomers.toLocaleString('en-US'), icon: UserRoundX, tone: 'amber' as const },
      { label: 'Recent', value: recentCustomers.length.toLocaleString('en-US'), icon: ContactRound, tone: 'red' as const },
    ];
  }, [customers, recentCustomers]);

  const quickActions = [
    { label: 'New Customer', icon: CirclePlus, route: '/customers/new' as const },
    { label: 'View Customers', icon: ClipboardList, route: '/customers/list' as const },
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

      {loading && customers.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading customers...</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          className="bg-background"
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadCustomers();
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
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Customers</Text>
                <Text className="text-muted-foreground" style={styles.sectionSubtitle}>Latest customer updates</Text>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllButton}
                onPress={() => router.push('/customers/list' as Parameters<typeof router.push>[0])}
              >
                <Text className="text-foreground" style={styles.seeAllText}>View all</Text>
              </Button>
            </View>

            <View style={styles.tableHeader}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.customerColumn]}>Customer</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.updatedColumn]}>Updated</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.statusColumn]}>Status</Text>
            </View>

            {recentCustomers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No customers found.</Text>
              </View>
            ) : (
              recentCustomers.map((customer) => <RecentCustomerRow key={customer.id} customer={customer} />)
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
  tableCard: { marginTop: 18, gap: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { marginTop: 3, fontSize: 12 },
  seeAllButton: { minHeight: 36, paddingHorizontal: 8 },
  seeAllText: { fontSize: 12, fontWeight: '600' },
  tableHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D9DEE5' },
  headerCell: { fontSize: 10, fontWeight: '700' },
  customerColumn: { flex: 1 },
  updatedColumn: { width: 92, textAlign: 'right' },
  statusColumn: { width: 74, textAlign: 'right' },
  customerRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB', gap: 8 },
  customerCell: { flex: 1, gap: 3 },
  customerName: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  customerMeta: { fontSize: 10 },
  customerUpdated: { width: 92, textAlign: 'right', fontSize: 12 },
  customerStatus: { width: 74, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  emptyState: { paddingVertical: 26, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});
