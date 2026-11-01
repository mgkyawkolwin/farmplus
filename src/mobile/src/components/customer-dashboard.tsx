'use client';

import * as React from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  ContactRound,
  Phone,
  User,
  UserRoundCheck,
  UserRoundX,
  Users,
} from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import UnauthorizedView from '@/components/unauthorized-view';
import { container, DI_TOKENS } from '@/di';
import { usePagePermission } from '@/lib/usePagePermission';
import { CustomerItem } from '@/models/customer';
import { ICustomerService } from '@/services/customerService';
import { THEME } from '@/lib/theme';

const customerService = container.resolve<ICustomerService>(DI_TOKENS.ICustomerService);

type ThemeColors = typeof THEME.light;
type MetricTone = 'green' | 'blue' | 'amber' | 'red';

const getToneColor = (tone: MetricTone, theme: ThemeColors) => {
  switch (tone) {
    case 'green': return theme.chart2;
    case 'blue': return theme.chart1;
    case 'amber': return theme.chart4;
    case 'red': return theme.destructive;
  }
};

function Metric({
  label,
  value,
  icon,
  tone,
  theme,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  tone: MetricTone;
  theme: ThemeColors;
}) {
  const MetricIcon = icon;

  return (
    <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border, borderTopColor: getToneColor(tone, theme) }]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: theme.secondary }]}>
          <MetricIcon size={16} color={getToneColor(tone, theme)} />
        </View>
        <Text style={[styles.metricLabel, { color: theme.mutedForeground }]} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, { color: theme.foreground }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function RecentCustomerRow({ customer, theme }: { customer: CustomerItem; theme: ThemeColors }) {
  const lastUpdated = customer.updatedAtUtc ?? customer.createdAtUtc ?? null;
  const isActive = customer.isActive !== false;

  return (
    <View style={[styles.customerRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <View style={[styles.avatarWrap, { backgroundColor: theme.muted }]}>
        {customer.profilePictureUrl ? (
          <Image source={{ uri: customer.profilePictureUrl }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: theme.secondary }]}>
            <Icon className="text-muted-foreground" as={User} size={16} />
          </View>
        )}
      </View>

      <View style={styles.customerCell}>
        <Text className="text-foreground" style={styles.customerName} numberOfLines={1}>{customer.name}</Text>
        <View style={styles.dateRow}>
          <Icon className="text-muted-foreground" as={Phone} size={12} />
          <Text className="text-muted-foreground" style={styles.customerMeta} numberOfLines={1}>
            {customer.phone || 'No phone'}
          </Text>
        </View>
      </View>
      <Text className="text-muted-foreground" style={styles.customerUpdated} numberOfLines={1}>
        {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '-'}
      </Text>
      <View style={styles.statusColumn}>
        <View style={[styles.statusPill, { backgroundColor: theme.secondary }]}>
          <Text style={[styles.statusText, { color: isActive ? theme.chart2 : theme.destructive }]}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>
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
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/customers/dashboard');
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
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void loadCustomers();
      return undefined;
    }, [loadCustomers, permissionState])
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

  return (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      {showHeader ? (
        <View style={[styles.headerBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Button variant="ghost" onPress={onBack ?? (() => router.back())} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>{title}</Text>
          <View style={styles.headerButton} />
        </View>
      ) : null}

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : loading && customers.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading customers...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadCustomers();
          }} />}
        >
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <Metric key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} tone={metric.tone} theme={theme} />
            ))}
          </View>

          <View style={styles.actionRow}>
            <Button
              style={[styles.actionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => router.push('/customers/new' as Parameters<typeof router.push>[0])}
            >
              <CirclePlus size={18} color={theme.primaryForeground} />
              <Text style={[styles.actionLabel, { color: theme.primaryForeground }]}>New Customer</Text>
            </Button>
            <Button
              variant="outline"
              style={[styles.actionButton, { backgroundColor: theme.secondary, borderColor: theme.border }]}
              onPress={() => router.push('/customers/list' as Parameters<typeof router.push>[0])}
            >
              <ClipboardList size={18} color={theme.primary} />
              <Text style={[styles.actionLabel, { color: theme.primary }]}>View Customers</Text>
            </Button>
          </View>

          <View style={styles.recentSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Customers</Text>
              </View>
              <Button
                variant="ghost"
                style={[styles.seeAllButton, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                onPress={() => router.push('/customers/list' as Parameters<typeof router.push>[0])}
              >
                <Text style={[styles.seeAllText, { color: theme.primary }]}>View all</Text>
                <ChevronRight size={14} color={theme.primary} />
              </Button>
            </View>

            <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderColor: theme.border }]}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.customerColumn]}>Customer</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.updatedColumn]}>Updated</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.statusHeaderColumn]}>Status</Text>
            </View>
            {recentCustomers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No customers found.</Text>
              </View>
            ) : (
              recentCustomers.map((customer) => <RecentCustomerRow key={customer.id} customer={customer} theme={theme} />)
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
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricIcon: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { flex: 1, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, minHeight: 46, gap: 8, borderRadius: 6 },
  actionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  recentSection: { gap: 0 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  seeAllButton: { minHeight: 30, paddingHorizontal: 10, paddingVertical: 0, flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, borderWidth: 1 },
  seeAllText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  tableHeader: { minHeight: 32, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderTopWidth: 1, borderBottomWidth: 1 },
  headerCell: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  customerColumn: { flex: 1 },
  updatedColumn: { width: 82, textAlign: 'right' },
  statusHeaderColumn: { width: 76, textAlign: 'right' },
  customerRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  avatarWrap: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 17 },
  avatarFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  customerCell: { flex: 1, gap: 3 },
  customerName: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  customerMeta: { fontSize: 10 },
  customerUpdated: { width: 82, textAlign: 'right', fontSize: 11 },
  statusColumn: { width: 76, alignItems: 'flex-end' },
  statusPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },
  statusText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  emptyState: { paddingVertical: 26, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});
