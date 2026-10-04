'use client';

import * as React from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Search } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { ProductItem } from '@/models/product';
import { getInventoryProducts } from '@/services/inventoryService';

type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
type StatusFilter = 'All' | StockStatus;

function getStockStatus(product: ProductItem): StockStatus {
  const stock = product.currentStock ?? 0;
  if (stock <= 0) return 'Out of Stock';
  if ((product.minimumStock ?? 0) > 0 && stock <= (product.minimumStock ?? 0)) return 'Low Stock';
  return 'In Stock';
}

function categoryName(product: ProductItem) {
  return product.category?.trim() || 'Uncategorized';
}

export default function InventoryStockListScreen() {
  const router = useRouter();
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [selectedStatus, setSelectedStatus] = React.useState<StatusFilter>('All');

  const loadProducts = React.useCallback(async () => {
    try {
      setProducts(await getInventoryProducts());
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Unable to load stock list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadProducts();
      return undefined;
    }, [loadProducts]),
  );

  const categories = ['All', ...new Set(products.map(categoryName))];
  const filteredProducts = products.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = selectedCategory === 'All' || categoryName(product) === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || getStockStatus(product) === selectedStatus;
    return matchesName && matchesCategory && matchesStatus;
  });

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && products.length > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Stock List</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.searchContainer}>
        <Icon className="text-muted-foreground" as={Search} size={16} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search product name"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterSection}>
        <Text className="text-muted-foreground" style={styles.filterLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilters}>
          {categories.map((category) => {
            const selected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
              >
                <Text className={selected ? 'text-background' : 'text-foreground'} style={styles.categoryChipText}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text className="text-muted-foreground" style={styles.filterLabel}>Stock Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFilters}>
          {(['All', 'In Stock', 'Low Stock', 'Out of Stock'] as const).map((status) => {
            const selected = selectedStatus === status;
            const statusStyle = status === 'In Stock'
              ? styles.statusChipInStock
              : status === 'Low Stock'
                ? styles.statusChipLowStock
                : status === 'Out of Stock'
                  ? styles.statusChipOutofStock
                  : undefined;
            return (
              <Pressable
                key={status}
                onPress={() => setSelectedStatus(status)}
                style={[styles.statusChip, selected && styles.statusChipSelected, !selected && statusStyle]}
              >
                <Text className={selected ? 'text-background' : 'text-foreground'} style={styles.statusChipText}>
                  {status}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading stock...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>No stock items found</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>Try changing your search or filters.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadProducts();
          }} />}
        >
          <Text className="text-muted-foreground" style={styles.resultCount}>{filteredProducts.length} products</Text>
          <View style={styles.tableHeader}>
            <Text className="text-muted-foreground" style={[styles.headerCell, styles.productColumn]}>Product</Text>
            <Text className="text-muted-foreground" style={[styles.headerCell, styles.stockColumn]}>Current Stock</Text>
            <Text className="text-muted-foreground" style={[styles.headerCell, styles.statusColumn]}>Status</Text>
          </View>
          {filteredProducts.map((product) => {
            const stock = product.currentStock ?? 0;
            const status = getStockStatus(product);
            const badgeStyle = status === 'In Stock'
              ? styles.badgeInStock
              : status === 'Low Stock'
                ? styles.badgeLowStock
                : styles.badgeOutofStock;
            const badgeTextStyle = status === 'In Stock'
              ? styles.badgeTextInStock
              : status === 'Low Stock'
                ? styles.badgeTextLowStock
                : styles.badgeTextOutofStock;
            return (
              <Pressable
                key={product.id}
                style={styles.stockRow}
                onPress={() => router.push(`/products/view?id=${encodeURIComponent(product.id)}` as Parameters<typeof router.push>[0])}
              >
                <View style={[styles.productColumn, styles.productCell]}>
                  {product.coverImageUrl ? (
                    <Image source={{ uri: product.coverImageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productIcon}>
                      <Icon className="text-muted-foreground" as={Package} size={20} />
                    </View>
                  )}
                  <Text className="text-foreground" style={styles.productName} numberOfLines={2}>{product.name}</Text>
                </View>
                <View style={styles.stockColumn}>
                  <Text className="text-foreground" style={styles.stockQuantity}>
                    {stock.toLocaleString('en-US')}{product.unit ? ` ${product.unit}` : ''}
                  </Text>
                </View>
                <View style={styles.statusColumn}>
                  <View style={[styles.statusBadge, badgeStyle]}>
                    <Text style={[styles.statusBadgeText, badgeTextStyle]}>{status}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginHorizontal: 16, marginTop: 14, marginBottom: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: '100%', color: '#111827', fontSize: 14 },
  filterSection: { gap: 7, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterLabel: { marginHorizontal: 16, marginTop: 2, fontSize: 11, fontWeight: '600' },
  categoryFilters: { gap: 7, paddingHorizontal: 16 },
  categoryChip: { minHeight: 32, justifyContent: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 16, paddingHorizontal: 12 },
  categoryChipSelected: { borderColor: '#16794B', backgroundColor: '#16794B' },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  statusFilters: { gap: 7, paddingHorizontal: 16 },
  statusChip: { minHeight: 30, justifyContent: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 16, paddingHorizontal: 10 },
  statusChipSelected: { borderColor: '#263B33', backgroundColor: '#263B33' },
  statusChipInStock: { backgroundColor: '#EFF8F2', borderColor: '#B9DEC6' },
  statusChipLowStock: { backgroundColor: '#FFF8E8', borderColor: '#E9D49A' },
  statusChipOutofStock: { backgroundColor: '#FFF1F0', borderColor: '#EBC6C1' },
  statusChipText: { fontSize: 11, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  resultCount: { marginBottom: 8, fontSize: 12 },
  tableHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#D9DEE5' },
  headerCell: { fontSize: 10, fontWeight: '700' },
  productColumn: { flex: 1 },
  stockColumn: { width: 88, alignItems: 'flex-end' },
  statusColumn: { width: 94, alignItems: 'flex-end' },
  stockRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D9DEE5', paddingVertical: 9 },
  productCell: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 4 },
  productImage: { width: 38, height: 38, borderRadius: 6, backgroundColor: '#F1F5F3' },
  productIcon: { width: 38, height: 38, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F3' },
  productName: { flex: 1, fontSize: 12, fontWeight: '600' },
  stockQuantity: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'right' },
  statusBadge: { minHeight: 25, minWidth: 78, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 13, paddingHorizontal: 7 },
  badgeInStock: { backgroundColor: '#EFF8F2', borderColor: '#B9DEC6' },
  badgeLowStock: { backgroundColor: '#FFF8E8', borderColor: '#E9D49A' },
  badgeOutofStock: { backgroundColor: '#FFF1F0', borderColor: '#EBC6C1' },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  badgeTextInStock: { color: '#16794B' },
  badgeTextLowStock: { color: '#9A6700' },
  badgeTextOutofStock: { color: '#B42318' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
});