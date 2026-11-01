'use client';

import * as React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
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
import UnauthorizedView from '@/components/unauthorized-view';
import { Supplier } from '@/models/supplier';
import { SupplierServiceClient } from '@/services/supplierService';
import { usePagePermission } from '@/lib/usePagePermission';
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

const supplierService = new SupplierServiceClient();

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
  icon: typeof Building2;
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

function RecentSupplierRow({ supplier, theme }: { supplier: Supplier; theme: ThemeColors }) {
  const { t } = useTranslation();
  const lastUpdated = supplier.updatedAtUtc ?? supplier.createdAtUtc ?? null;
  const isActive = supplier.isActive !== false;

  return (
    <View style={[styles.supplierRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <View style={styles.supplierCell}>
        <Text className="text-foreground" style={styles.supplierName} numberOfLines={1}>{supplier.supplierName}</Text>
        <View style={styles.metaRow}>
          <Icon className="text-muted-foreground" as={MapPin} size={12} />
          <Text className="text-muted-foreground" style={styles.supplierMeta} numberOfLines={1}>
            {supplier.city || supplier.stateDivision || supplier.country || t('suppliers.dashboard.noLocation')}
          </Text>
        </View>
      </View>
      <Text className="text-muted-foreground" style={styles.supplierUpdated} numberOfLines={1}>
        {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '-'}
      </Text>
      <View style={styles.statusColumn}>
        <View style={[styles.statusPill, { backgroundColor: theme.secondary }]}>
          <Text style={[styles.statusText, { color: isActive ? theme.chart2 : theme.destructive }]}>
            {isActive ? t('suppliers.status.active') : t('suppliers.status.inactive')}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function SupplierDashboardContent({
  showHeader = true,
  title,
  onBack,
}: {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/suppliers/dashboard');
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
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void loadSuppliers();
      return undefined;
    }, [loadSuppliers, permissionState])
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
      { label: t('suppliers.dashboard.totalSuppliers'), value: totalSuppliers.toLocaleString('en-US'), icon: Building2, tone: 'blue' as const },
      { label: t('suppliers.dashboard.active'), value: activeSuppliers.toLocaleString('en-US'), icon: UserRoundCheck, tone: 'green' as const },
      { label: t('suppliers.dashboard.inactive'), value: inactiveSuppliers.toLocaleString('en-US'), icon: UserRoundX, tone: 'amber' as const },
      { label: t('suppliers.dashboard.recent'), value: recentSuppliers.length.toLocaleString('en-US'), icon: CalendarDays, tone: 'red' as const },
    ];
  }, [suppliers, recentSuppliers, t]);

  return (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      {showHeader ? (
        <View style={[styles.headerBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Button variant="ghost" onPress={onBack ?? (() => router.back())} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>{title ?? t('suppliers.dashboard.title')}</Text>
          <View style={styles.headerButton} />
        </View>
      ) : null}

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('suppliers.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('suppliers.unauthorized.title')} message={t('suppliers.unauthorized.description')} />
      ) : loading && suppliers.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('suppliers.dashboard.loading')}</Text>
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
              <Metric key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} tone={metric.tone} theme={theme} />
            ))}
          </View>

          <View style={styles.actionRow}>
            <Button
              style={[styles.actionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => router.push('/suppliers/new' as Parameters<typeof router.push>[0])}
            >
              <CirclePlus size={18} color={theme.primaryForeground} />
              <Text style={[styles.actionLabel, { color: theme.primaryForeground }]}>{t('suppliers.dashboard.newSupplier')}</Text>
            </Button>
            <Button
              variant="outline"
              style={[styles.actionButton, { backgroundColor: theme.secondary, borderColor: theme.border }]}
              onPress={() => router.push('/suppliers/list' as Parameters<typeof router.push>[0])}
            >
              <ClipboardList size={18} color={theme.primary} />
              <Text style={[styles.actionLabel, { color: theme.primary }]}>{t('suppliers.dashboard.viewSuppliers')}</Text>
            </Button>
          </View>

          <View style={styles.recentSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>{t('suppliers.dashboard.recentSuppliers')}</Text>
              </View>
              <Button
                variant="ghost"
                style={[styles.seeAllButton, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                onPress={() => router.push('/suppliers/list' as Parameters<typeof router.push>[0])}
              >
                <Text style={[styles.seeAllText, { color: theme.primary }]}>{t('suppliers.dashboard.viewAll')}</Text>
                <ChevronRight size={14} color={theme.primary} />
              </Button>
            </View>

            <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderColor: theme.border }]}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.supplierColumn]}>{t('suppliers.fields.supplier')}</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.updatedColumn]}>{t('suppliers.dashboard.updated')}</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.statusHeaderColumn]}>{t('suppliers.dashboard.status')}</Text>
            </View>
            {recentSuppliers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">{t('suppliers.dashboard.noSuppliersFound')}</Text>
              </View>
            ) : (
              recentSuppliers.map((supplier) => <RecentSupplierRow key={supplier.id} supplier={supplier} theme={theme} />)
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
  supplierColumn: { flex: 1 },
  updatedColumn: { width: 82, textAlign: 'right' },
  statusHeaderColumn: { width: 76, textAlign: 'right' },
  supplierRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  supplierCell: { flex: 1, gap: 3 },
  supplierName: { fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  supplierMeta: { fontSize: 10, flex: 1 },
  supplierUpdated: { width: 82, textAlign: 'right', fontSize: 11 },
  statusColumn: { width: 76, alignItems: 'flex-end' },
  statusPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },
  statusText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  emptyState: { paddingVertical: 26, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});
