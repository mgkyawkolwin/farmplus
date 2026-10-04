'use client';

import * as React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { Sale } from '@/models/sale';
import { ISaleService } from '@/services/saleService';

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);
const PAGE_SIZE = 20;

function money(value: number) {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} MMK`;
}

export default function SalesListScreen() {
  const router = useRouter();
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
        <Text className="text-foreground" style={styles.headerTitle}>Sales</Text>
        <View style={styles.headerButton} />
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
          <View style={styles.tableHeader}>
            <Text className="text-muted-foreground" style={[styles.headerCell, styles.customerColumn]}>Customer / Date</Text>
            <Text className="text-muted-foreground" style={[styles.headerCell, styles.qtyColumn]}>Qty</Text>
            <Text className="text-muted-foreground" style={[styles.headerCell, styles.totalColumn]}>Total</Text>
          </View>
          {sales.map((sale) => (
            <View key={sale.id} style={styles.saleRow}>
              <View style={styles.customerCell}>
                <Text className="text-foreground" style={styles.customerName} numberOfLines={1}>{sale.customerName}</Text>
                <View style={styles.dateRow}>
                  <Icon className="text-muted-foreground" as={CalendarDays} size={12} />
                  <Text className="text-muted-foreground" style={styles.saleDate}>{new Date(sale.saleDate).toLocaleString()}</Text>
                </View>
              </View>
              <Text className="text-muted-foreground" style={styles.productCount}>{sale.totalProducts}</Text>
              <Text className="text-foreground" style={styles.saleTotal} numberOfLines={1}>{money(sale.netTotal)}</Text>
            </View>
          ))}
          {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color="#16794B" /> : null}
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
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  tableHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D9DEE5' },
  headerCell: { fontSize: 10, fontWeight: '700' },
  customerColumn: { flex: 1 },
  qtyColumn: { width: 45, textAlign: 'right' },
  totalColumn: { width: 118, textAlign: 'right' },
  saleRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB', gap: 8 },
  customerCell: { flex: 1, gap: 3 },
  customerName: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saleDate: { fontSize: 10 },
  productCount: { width: 45, textAlign: 'right', fontSize: 12 },
  saleTotal: { width: 118, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
});