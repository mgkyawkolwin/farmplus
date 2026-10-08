'use client';

import * as React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  MapPin,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Supplier } from '@/models/supplier';
import { SupplierServiceClient } from '@/services/supplierService';

const supplierService = new SupplierServiceClient();

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

function RecentSupplierRow({ supplier }: { supplier: Supplier }) {
  const lastUpdated = supplier.updatedAtUtc ?? supplier.createdAtUtc ?? null;
  const isActive = supplier.isActive !== false;

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
      <View style={styles.statusColumn}>
        <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>
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
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadSuppliers();
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
              onPress={() => router.push('/suppliers/suppliers' as Parameters<typeof router.push>[0])}
            >
              <CirclePlus size={18} color="#FFFFFF" />
              <Text style={[styles.actionLabel, styles.actionPrimaryLabel]}>New Supplier</Text>
            </Button>
            <Button
              variant="outline"
              style={[styles.actionButton, styles.actionSecondary]}
              onPress={() => router.push('/suppliers/suppliers' as Parameters<typeof router.push>[0])}
            >
              <ClipboardList size={18} color="#16794B" />
              <Text style={[styles.actionLabel, styles.actionSecondaryLabel]}>View Suppliers</Text>
            </Button>
          </View>

          <View style={styles.recentSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Suppliers</Text>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllButton}
                onPress={() => router.push('/suppliers/suppliers' as Parameters<typeof router.push>[0])}
              >
                <Text style={styles.seeAllText}>View all</Text>
                <ChevronRight size={14} color="#16794B" />
              </Button>
            </View>

            <View style={styles.tableHeader}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.supplierColumn]}>Supplier</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.updatedColumn]}>Updated</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.statusHeaderColumn]}>Status</Text>
            </View>
            {recentSuppliers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No suppliers found.</Text>
              </View>
            ) : (
              recentSuppliers.map((supplier) => <RecentSupplierRow key={supplier.id} supplier={supplier} />)
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
  supplierColumn: { flex: 1 },
  updatedColumn: { width: 82, textAlign: 'right' },
  statusHeaderColumn: { width: 76, textAlign: 'right' },
  supplierRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#CBD5E1', gap: 8 },
  supplierCell: { flex: 1, gap: 3 },
  supplierName: { fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  supplierMeta: { fontSize: 10, flex: 1 },
  supplierUpdated: { width: 82, textAlign: 'right', fontSize: 11 },
  statusColumn: { width: 76, alignItems: 'flex-end' },
  statusPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  statusTextActive: { color: '#047857' },
  statusTextInactive: { color: '#B91C1C' },
  emptyState: { paddingVertical: 26, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});
