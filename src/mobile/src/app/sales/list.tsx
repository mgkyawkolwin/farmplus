'use client';

import * as React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import ShopBanner from '@/components/shopBanner';
import { useSelectedShopName } from '@/lib/useSelectedShopName';
import { container, DI_TOKENS } from '@/di';
import { Sale } from '@/models/sale';
import { ISaleService } from '@/services/saleService';

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);
const PAGE_SIZE = 20;

const COLORS = {
  paid: '#047857',
  due: '#B45309',
  void: '#B91C1C',
  ink: '#0F172A',
  muted: '#64748B',
};

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatus(sale: Sale) {
  if (sale.status === 'Voided') return { label: 'VOID', color: COLORS.void, bg: '#FEE2E2' };
  if (sale.paidAmount > 0 && sale.balance <= 0) return { label: 'PAID', color: COLORS.paid, bg: '#D1FAE5' };
  return { label: 'UNPAID', color: COLORS.due, bg: '#FEF3C7' };
}

function Field({ label, value, align }: { label: string; value: string | number; align?: 'left' | 'right' }) {
  return (
    <View style={[styles.field, align === 'right' && styles.fieldRight]}>
      <Text style={[styles.fieldLabel, align === 'right' && styles.textRight]}>{label}</Text>
      <Text style={[styles.fieldValue, align === 'right' && styles.textRight]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function SalesListScreen() {
  const router = useRouter();
  const { shopName, shopLoaded } = useSelectedShopName();
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const loadSales = React.useCallback(async (nextPage = 1, append = false) => {
    try {
      const result = await saleService.getSales(nextPage, PAGE_SIZE);
      setSales((current) => append ? [...current, ...result] : result);
      setPage(nextPage);
      setHasMore(result.length === PAGE_SIZE);
    } catch (error) {
      if (!append) setSales([]);
      SnackBar.Error(error instanceof Error ? error.message : 'Unable to load sales');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadSales();
      return undefined;
    }, [loadSales]),
  );

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void loadSales(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && sales.length > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <View style={styles.headerTitleWrap}>
          <Text className="text-foreground" style={styles.headerTitle}>Sales</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.shopBannerWrap}>
        <ShopBanner
          label="Showing sales for"
          name={shopName}
          emptyText={shopLoaded ? 'No shop selected. Choose one from the top bar.' : undefined}
        />
      </View>

      {loading && sales.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading sales...</Text>
        </View>
      ) : sales.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>No sales found</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>New sales will appear here.</Text>
        </View>
      ) : (
        <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              void loadSales();
            }} />}
            onMomentumScrollEnd={(event) => {
              const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
              if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 120) loadMore();
            }}
          >
            {sales.map((sale) => {
              const status = getStatus(sale);
              const isVoided = sale.status === 'Voided';
              return (
                <Pressable
                  key={sale.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Sale ${sale.id.slice(0, 8)}`}
                  style={({ pressed }) => [
                    styles.saleRow,
                    isVoided && styles.saleRowVoided,
                    pressed && styles.saleRowPressed,
                  ]}
                  onPress={() => router.push({ pathname: '/sales/view', params: { id: sale.id } })}
                >
                  <View style={styles.saleTopRow}>
                    <Text style={styles.saleId}>#{sale.id.slice(0, 8).toUpperCase()}</Text>
                    <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    <Text style={styles.saleDate}>{formatDate(sale.saleDate)}</Text>
                    <Icon className="text-muted-foreground" as={ChevronRight} size={14} />
                  </View>

                  <View style={styles.fieldRow}>
                    <View style={styles.fieldWide}>
                      <Field label="Customer" value={sale.customerName} />
                    </View>
                    <Field label="Products" value={sale.totalProducts} align="right" />
                    <Field label="Total Qty" value={sale.totalProducts} align="right" />
                  </View>

                  <View style={styles.amountRow}>
                    <Field label="Net" value={money(sale.netTotal)} align="right" />
                    <Field label="Paid" value={money(sale.paidAmount)} align="right" />
                    <View style={[styles.field, styles.fieldRight]}>
                      <Text style={[styles.fieldLabel, styles.textRight]}>Balance</Text>
                      <Text
                        style={[
                          styles.fieldValue,
                          styles.textRight,
                          { color: isVoided ? COLORS.muted : sale.balance > 0 ? COLORS.due : COLORS.paid },
                        ]}
                        numberOfLines={1}
                      >
                        {money(sale.balance)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color="#16794B" /> : null}
            {!hasMore ? <Text style={styles.endNote}>End of list</Text> : null}
          </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  headerButton: { minWidth: 44 },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  shopBannerWrap: { paddingHorizontal: 10, paddingTop: 10 },
  content: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 16, gap: 10 },
  saleRow: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  saleRowVoided: { backgroundColor: '#F1F5F9', opacity: 0.7 },
  saleRowPressed: { backgroundColor: '#EEF2F7' },
  saleTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saleId: { flex: 1, fontSize: 13, fontWeight: '800', color: COLORS.ink, letterSpacing: 0.3 },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  saleDate: { fontSize: 10, color: COLORS.muted },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  fieldWide: { flex: 1, minWidth: 0 },
  amountRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E1',
  },
  field: { flex: 1, minWidth: 0 },
  fieldRight: { alignItems: 'flex-end' },
  fieldLabel: { fontSize: 8.5, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  fieldValue: { fontSize: 12.5, fontWeight: '700', color: COLORS.ink },
  textRight: { textAlign: 'right' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
  endNote: { textAlign: 'center', fontSize: 10, color: COLORS.muted, marginVertical: 8 },
});
