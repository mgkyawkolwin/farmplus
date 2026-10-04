'use client';

import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, ChevronLeft, Package, Pencil, Plus, Store, Trash2 } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import LoadingOverlay from '@/components/loadingOverlay';
import { container, DI_TOKENS } from '@/di';
import { Purchase } from '@/models/purchase';
import { IPurchaseService } from '@/services/purchaseService';

const purchaseService = container.resolve<IPurchaseService>(DI_TOKENS.IPurchaseService);
const PAGE_SIZE = 20;

function formatMoney(amount: number) {
  return `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} MMK`;
}

export default function PurchaseListScreen() {
  const router = useRouter();
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

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
      fetchPurchases();
      return undefined;
    }, [fetchPurchases]),
  );

  const deletePurchase = (purchase: Purchase) => {
    Alert.alert('Delete purchase', `Delete the purchase from ${purchase.supplierName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await purchaseService.deletePurchase(purchase.id);
            setPurchases((current) => current.filter((item) => item.id !== purchase.id));
            SnackBar.Success('Purchase deleted successfully');
          } catch (error) {
            SnackBar.Error(error instanceof Error ? error.message : 'Failed to delete purchase');
          }
        },
      },
    ]);
  };

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPurchases(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && purchases.length > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Purchases</Text>
        <Button
          variant="ghost"
          onPress={() => router.push('/purchases/new' as Parameters<typeof router.push>[0])}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Plus} size={20} />
        </Button>
      </View>

      {loading && purchases.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#2563EB" />
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
                fetchPurchases();
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
              style={styles.purchaseCard}
              onPress={() => router.push(`/purchases/edit?id=${encodeURIComponent(purchase.id)}` as Parameters<typeof router.push>[0])}
            >
              <View style={styles.cardHeader}>
                <View style={styles.supplierIcon}>
                  <Icon className="text-muted-foreground" as={Store} size={20} />
                </View>
                <View style={styles.purchaseMain}>
                  <Text className="text-foreground" style={styles.supplierName} numberOfLines={1}>
                    {purchase.supplierName}
                  </Text>
                  <View style={styles.detailRow}>
                    <Icon className="text-muted-foreground" as={CalendarDays} size={14} />
                    <Text className="text-muted-foreground" style={styles.detailText}>
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text className="text-foreground" style={styles.purchaseTotal} numberOfLines={1}>
                  {formatMoney(purchase.netTotal)}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.detailRow}>
                  <Icon className="text-muted-foreground" as={Package} size={14} />
                  <Text className="text-muted-foreground" style={styles.detailText}>
                    {purchase.totalProducts} products
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit purchase from ${purchase.supplierName}`}
                    onPress={() => router.push(`/purchases/edit?id=${encodeURIComponent(purchase.id)}` as Parameters<typeof router.push>[0])}
                    style={styles.iconButton}
                  >
                    <Icon className="text-foreground" as={Pencil} size={18} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete purchase from ${purchase.supplierName}`}
                    onPress={(event) => {
                      event.stopPropagation();
                      deletePurchase(purchase);
                    }}
                    style={styles.iconButton}
                  >
                    <Icon className="text-destructive" as={Trash2} size={18} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))}
          {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color="#2563EB" /> : null}
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  content: { padding: 16, gap: 10 },
  purchaseCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  supplierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  purchaseMain: { flex: 1, gap: 4 },
  supplierName: { fontSize: 15, fontWeight: '600' },
  purchaseTotal: { maxWidth: 130, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 4 },
  iconButton: { padding: 7 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
});