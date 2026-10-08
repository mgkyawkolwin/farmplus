'use client';

import * as React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import LoadingOverlay from '@/components/loadingOverlay';
import { container, DI_TOKENS } from '@/di';
import { Purchase } from '@/models/purchase';
import { IPurchaseService } from '@/services/purchaseService';
import { useSelectedShopChanged } from '@/lib/selectedShop';
import { getSelectedShopId } from '@/lib/authStorage';
import { ShopServiceClient } from '@/services/shopService';
import ShopBanner from '@/components/shopBanner';

const purchaseService = container.resolve<IPurchaseService>(DI_TOKENS.IPurchaseService);
const PAGE_SIZE = 20;
const shopService = new ShopServiceClient();

const COLORS = {
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

function Field({ label, value, align }: { label: string; value: string | number; align?: 'left' | 'right' }) {
  return (
    <View style={[styles.field, align === 'right' && styles.fieldRight]}>
      <Text style={[styles.fieldLabel, align === 'right' && styles.textRight]}>{label}</Text>
      <Text style={[styles.fieldValue, align === 'right' && styles.textRight]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default function PurchaseListScreen() {
  const router = useRouter();
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [shopName, setShopName] = React.useState<string | null>(null);

  const loadShopName = React.useCallback(async () => {
    try {
      const [shopId, shops] = await Promise.all([getSelectedShopId(), shopService.getShops(1, 200)]);
      setShopName(shops.find((shop) => shop.id === shopId)?.name ?? null);
    } catch {
      setShopName(null);
    }
  }, []);

  const fetchPurchases = React.useCallback(async (nextPage = 1, append = false) => {
    try {
      const result = await purchaseService.getPurchases(nextPage, PAGE_SIZE);
      setPurchases((current) => append ? [...current, ...result] : result);
      setHasMore(result.length === PAGE_SIZE);
      setPage(nextPage);
    } catch {
      if (!append) setPurchases([]);
      SnackBar.Error('Failed to load purchases');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void fetchPurchases();
      void loadShopName();
      return undefined;
    }, [fetchPurchases, loadShopName]),
  );

  // The API scopes purchases to the selected shop, so reload when it changes.
  useSelectedShopChanged(() => {
    setLoading(true);
    void fetchPurchases();
    void loadShopName();
  });

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void fetchPurchases(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && purchases.length > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <View style={styles.headerTitleWrap}>
          <Text className="text-foreground" style={styles.headerTitle}>Purchases</Text>
        </View>
        <Button
          variant="ghost"
          onPress={() => router.push('/purchases/new' as Parameters<typeof router.push>[0])}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Plus} size={20} />
        </Button>
      </View>

      <View style={styles.shopBannerWrap}>
        <ShopBanner label="Showing purchases for" name={shopName} emptyText="No shop selected. Choose one from the top bar." />
      </View>

      {loading && purchases.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading purchases...</Text>
        </View>
      ) : purchases.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>No purchases found</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>Add a purchase to record incoming stock.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void fetchPurchases();
              }}
            />
          }
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 120) loadMore();
          }}
        >
          {purchases.map((purchase) => (
            <Pressable
              key={purchase.id}
              accessibilityRole="button"
              accessibilityLabel={`Purchase from ${purchase.supplierName}`}
              style={({ pressed }) => [styles.purchaseRow, pressed && styles.purchaseRowPressed]}
              onPress={() => router.push({ pathname: '/purchases/view', params: { id: purchase.id } } as Parameters<typeof router.push>[0])}
            >
              <View style={styles.topRow}>
                <Text style={styles.purchaseId}>#{purchase.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.purchaseDate}>{formatDate(purchase.purchaseDate)}</Text>
                <Icon className="text-muted-foreground" as={ChevronRight} size={14} />
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldWide}>
                  <Field label="Supplier" value={purchase.supplierName} />
                </View>
                <Field label="Products" value={purchase.totalProducts} align="right" />
              </View>

              <View style={styles.amountRow}>
                <Field label="Sub Total" value={money(purchase.subTotal)} align="right" />
                <Field label="Discount" value={money(purchase.discount)} align="right" />
                <Field label="Net Total" value={money(purchase.netTotal)} align="right" />
              </View>
            </Pressable>
          ))}
          {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color="#16794B" /> : null}
          {!hasMore ? <Text style={styles.endNote}>End of list</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButton: { minWidth: 44 },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  shopBannerWrap: { paddingHorizontal: 10, paddingTop: 10 },
  content: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 16, gap: 10 },
  purchaseRow: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  purchaseRowPressed: { backgroundColor: '#EEF2F7' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  purchaseId: { flex: 1, fontSize: 13, fontWeight: '800', color: COLORS.ink, letterSpacing: 0.3 },
  purchaseDate: { fontSize: 10, color: COLORS.muted },
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