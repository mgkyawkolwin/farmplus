'use client';

import * as React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, Boxes, ChevronLeft, ClipboardPenLine, List, Package, Wallet, Warehouse } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { ProductItem } from '@/models/product';
import { getInventoryProducts } from '@/services/inventoryService';

function stockOf(product: ProductItem) {
  return Math.max(0, product.currentStock ?? 0);
}

function money(value: number) {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} MMK`;
}

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Boxes;
  tone: 'green' | 'blue' | 'amber' | 'red';
}) {
  const IconComponent = icon;
  return (
    <View style={[styles.metricCard, styles[`metric${tone}`]]}>
      <View style={styles.metricIcon}>
        <IconComponent size={19} color={tone === 'green' ? '#16794B' : tone === 'blue' ? '#2367A8' : tone === 'amber' ? '#9A6700' : '#B42318'} />
      </View>
      <Text className="text-muted-foreground" style={styles.metricLabel}>{label}</Text>
      <Text className="text-foreground" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

export default function InventoryDashboardScreen() {
  const router = useRouter();
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadInventory = React.useCallback(async () => {
    try {
      const result = await getInventoryProducts();
      setProducts(result);
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Unable to load inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadInventory();
      return undefined;
    }, [loadInventory]),
  );

  const totalStock = products.reduce((total, product) => total + stockOf(product), 0);
  const totalValue = products.reduce((total, product) => total + stockOf(product) * (product.purchasePrice ?? 0), 0);
  const lowStockCount = products.filter((product) => {
    const stock = stockOf(product);
    return stock > 0 && (product.minimumStock ?? 0) > 0 && stock <= (product.minimumStock ?? 0);
  }).length;
  const outOfStockCount = products.filter((product) => stockOf(product) === 0).length;

  const categoryTotals = Array.from(products.reduce((totals, product) => {
    const category = product.category?.trim() || 'Uncategorized';
    totals.set(category, (totals.get(category) ?? 0) + stockOf(product));
    return totals;
  }, new Map<string, number>())).map(([category, quantity]) => ({
    category,
    quantity,
    percentage: totalStock > 0 ? (quantity / totalStock) * 100 : 0,
  })).sort((left, right) => right.quantity - left.quantity);

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && products.length > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Inventory</Text>
        <View style={styles.headerButton} />
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading inventory...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              void loadInventory();
            }} />
          }
        >
          <View style={styles.metricsGrid}>
            <Metric label="Total Stock Qty" value={totalStock.toLocaleString('en-US')} icon={Boxes} tone="green" />
            <Metric label="Total Value" value={money(totalValue)} icon={Wallet} tone="blue" />
            <Metric label="Low Stock Items" value={lowStockCount.toLocaleString('en-US')} icon={AlertTriangle} tone="amber" />
            <Metric label="Out of Stock" value={outOfStockCount.toLocaleString('en-US')} icon={Package} tone="red" />
          </View>

          <View style={styles.actionsRow}>
            <Button
              variant="outline"
              style={styles.actionButton}
              onPress={() => router.push('/inventory/adjustment' as Parameters<typeof router.push>[0])}
            >
              <Icon className="text-foreground" as={ClipboardPenLine} size={18} />
              <Text className="text-foreground" style={styles.actionLabel}>Adjustment</Text>
            </Button>
            <Button
              variant="outline"
              style={styles.actionButton}
              onPress={() => router.push('/inventory/list' as Parameters<typeof router.push>[0])}
            >
              <Icon className="text-foreground" as={List} size={18} />
              <Text className="text-foreground" style={styles.actionLabel}>Stock List</Text>
            </Button>
          </View>

          <View style={styles.categorySection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>Stock by Category</Text>
                <Text className="text-muted-foreground" style={styles.sectionSubtitle}>Share of total on-hand quantity</Text>
              </View>
              <Icon className="text-muted-foreground" as={Warehouse} size={19} />
            </View>

            <View style={styles.tableHeader}>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.categoryColumn]}>Category</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.barColumn]}>Share</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.qtyColumn]}>Qty</Text>
              <Text className="text-muted-foreground" style={[styles.headerCell, styles.percentColumn]}>%</Text>
            </View>

            {categoryTotals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No stock categories to display.</Text>
              </View>
            ) : categoryTotals.map((item) => (
              <View key={item.category} style={styles.tableRow}>
                <Text className="text-foreground" style={[styles.categoryText, styles.categoryColumn]} numberOfLines={1}>
                  {item.category}
                </Text>
                <View style={[styles.barColumn, styles.progressTrack]}>
                  <View style={[styles.progressFill, { width: `${item.percentage}%` }]} />
                </View>
                <Text className="text-foreground" style={[styles.qtyText, styles.qtyColumn]} numberOfLines={1}>
                  {item.quantity.toLocaleString('en-US')}
                </Text>
                <Text className="text-muted-foreground" style={[styles.percentText, styles.percentColumn]}>
                  {Math.round(item.percentage)}%
                </Text>
              </View>
            ))}
          </View>
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
  content: { padding: 16, paddingBottom: 28, gap: 20 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', minHeight: 126, borderRadius: 8, borderWidth: 1, padding: 13, justifyContent: 'space-between' },
  metricgreen: { backgroundColor: '#EFF8F2', borderColor: '#CDE8D6' },
  metricblue: { backgroundColor: '#EEF6FC', borderColor: '#D1E5F5' },
  metricamber: { backgroundColor: '#FFF8E8', borderColor: '#F0E0B7' },
  metricred: { backgroundColor: '#FFF1F0', borderColor: '#F2D4D0' },
  metricIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFAA' },
  metricLabel: { fontSize: 12, fontWeight: '500' },
  metricValue: { fontSize: 19, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, minHeight: 48, gap: 8, borderRadius: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  categorySection: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { marginTop: 3, fontSize: 12 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D9DEE5', paddingBottom: 9 },
  headerCell: { fontSize: 11, fontWeight: '600' },
  categoryColumn: { flex: 1.2 },
  barColumn: { flex: 1.1 },
  qtyColumn: { width: 55, textAlign: 'right' },
  percentColumn: { width: 42, textAlign: 'right' },
  tableRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  categoryText: { fontSize: 12, fontWeight: '600' },
  qtyText: { fontSize: 12, fontVariant: ['tabular-nums'] },
  percentText: { fontSize: 12, textAlign: 'right' },
  progressTrack: { height: 7, backgroundColor: '#E7EBEF', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', minWidth: 2, backgroundColor: '#2D8A61', borderRadius: 99 },
  emptyState: { paddingVertical: 24, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});