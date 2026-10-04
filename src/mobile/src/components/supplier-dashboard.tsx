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
  Building2,
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
import { Supplier } from '@/models/supplier';
import { SupplierServiceClient } from '@/services/supplierService';

const supplierService = new SupplierServiceClient();

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
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

function RecentSupplierRow({ supplier }: { supplier: Supplier }) {
  const lastUpdated = supplier.updatedAtUtc ?? supplier.createdAtUtc ?? null;

  return (
    <View style={styles.supplierRow}>
      <View style={styles.supplierCell}>
        <Text className="text-foreground" style={styles.supplierName} numberOfLines={1}>{supplier.supplierName}</Text>
        <View style={styles.metaRow}>
          <Icon className="text-muted-foreground" as={MapPin} size={12} />
          <Text className="text-muted-foreground" style={styles.supplierMeta} numberOfLines={1}>
            {supplier.city || supplier.stateDivision || supplier.country || 'No location'}
          </Text>
        </View>
      </View>
      <Text className="text-muted-foreground" style={styles.supplierUpdated} numberOfLines={1}>
        {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '-'}
      </Text>
      <Text className={supplier.isActive ? 'text-green-600' : 'text-red-500'} style={styles.supplierStatus}>
        {supplier.isActive ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
}

export function SupplierDashboardContent({
  showHeader = true,
  title = 'Suppliers',
  onBack,
}: {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadSuppliers = React.useCallback(async () => {
    try {
      const result = await supplierService.getSuppliers(1, 200);
      setSuppliers(result);
    } catch (error) {
      setSuppliers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadSuppliers();
      return undefined;
    }, [loadSuppliers])
  );

  const recentSuppliers = React.useMemo(
    () =>
      [...suppliers]
        .sort((a, b) => {
          const aDate = new Date(a.updatedAtUtc ?? a.createdAtUtc ?? 0).getTime();
          const bDate = new Date(b.updatedAtUtc ?? b.createdAtUtc ?? 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 5),
    [suppliers]
  );

  const metrics = React.useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((supplier) => supplier.isActive !== false).length;
    const inactiveSuppliers = suppliers.filter((supplier) => supplier.isActive === false).length;

    return [
      { label: 'Total Suppliers', value: totalSuppliers.toLocaleString('en-US'), icon: Building2, tone: 'blue' as const },
      { label: 'Active', value: activeSuppliers.toLocaleString('en-US'), icon: UserRoundCheck, tone: 'green' as const },
      { label: 'Inactive', value: inactiveSuppliers.toLocaleString('en-US'), icon: UserRoundX, tone: 'amber' as const },
      { label: 'Recent', value: recentSuppliers.length.toLocaleString('en-US'), icon: CalendarDays, tone: 'red' as const },
    ];
  }, [suppliers, recentSuppliers]);

  const quickActions = [
    { label: 'New Supplier', icon: CirclePlus, route: '/suppliers/suppliers' as const },
    { label: 'View Suppliers', icon: ClipboardList, route: '/suppliers/suppliers' as const },
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

      {loading && suppliers.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading suppliers...</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          className="bg-background"
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadSuppliers();
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
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Suppliers</Text>
                <Text className="text-muted-foreground" style={styles.sectionSubtitle}>Latest supplier updates</Text>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllButton}
                onPress={() => router.push('/suppliers/suppliers' as Parameters<typeof router.push>[0])}
              >
                <Text className="text-foreground" style={styles.seeAllText}>View all</Text>
              </Button>
            </View>

            <View style={styles.tableHeader}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.supplierColumn]}>Supplier</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.updatedColumn]}>Updated</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.statusColumn]}>Status</Text>
            </View>

            {recentSuppliers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No suppliers found.</Text>
              </View>
            ) : (
              recentSuppliers.map((supplier) => <RecentSupplierRow key={supplier.id} supplier={supplier} />)
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
  supplierColumn: { flex: 1.5 },
  updatedColumn: { flex: 0.9 },
  statusColumn: { width: 86, textAlign: 'right' },
  supplierRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  supplierCell: { flex: 1.5, paddingRight: 8 },
  supplierName: { fontSize: 14, fontWeight: '600' },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  supplierMeta: { fontSize: 12, flex: 1 },
  supplierUpdated: { flex: 0.9, fontSize: 12, color: '#6B7280' },
  supplierStatus: { width: 86, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { marginTop: 12, fontSize: 14 },
  emptyState: { padding: 16, alignItems: 'center' },
});
