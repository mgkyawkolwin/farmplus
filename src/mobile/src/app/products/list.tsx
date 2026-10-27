'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Search,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import UnauthorizedView from '@/components/unauthorized-view';
import { container, DI_TOKENS } from '@/di';
import { usePagePermission } from '@/lib/usePagePermission';
import { ProductItem } from '@/models/product';
import { IProductService } from '@/services/productService';
import LoadingOverlay from '@/components/loadingOverlay';

const productService = container.resolve<IProductService>(
  DI_TOKENS.IProductService,
);

const COLORS = {
  ink: '#0F172A',
  muted: '#64748B',
  border: '#D9DEE5',
  green: '#16794B',
  amber: '#9A6700',
};

export default function ProductListScreen() {
  const router = useRouter();
  const permissionState = usePagePermission('/products/list');
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [searchText, setSearchText] = React.useState('');
  const pageSize = 20;

  const loadProducts = React.useCallback(
    async (nextPage = 1, reset = false, name?: string) => {
      if (nextPage === 1 && !reset) {
        setLoading(true);
      }

      try {
        const result = await productService.getProducts(nextPage, pageSize);
        const filtered = name
          ? result.filter((item) =>
              item.name.toLowerCase().includes(name.toLowerCase()),
            )
          : result;

        if (reset) {
          setProducts(filtered);
        } else {
          setProducts((prev) => [...prev, ...filtered]);
        }
        setHasMore(filtered.length === pageSize);
        setPage(nextPage);
      } catch (error) {
        if (reset) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  const fetchProducts = React.useCallback(async () => {
    if (permissionState !== 'authorized') return;
    setLoading(true);
    setProducts([]);
    try {
      const result = await productService.getProducts(1, pageSize);
      const filtered = searchText.trim()
        ? result.filter((item) =>
            item.name.toLowerCase().includes(searchText.trim().toLowerCase()),
          )
        : result;
      setProducts(filtered);
      setHasMore(filtered.length === pageSize);
      setPage(1);
    } catch (error) {
      setProducts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [pageSize, permissionState, searchText]);

  React.useEffect(() => {
    if (permissionState === 'authorized') fetchProducts();
  }, [fetchProducts]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState === 'authorized') fetchProducts();
      return undefined;
    }, [fetchProducts, permissionState]),
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProducts(1, true, searchText.trim());
  }, [loadProducts, searchText]);

  const onLoadMore = React.useCallback(() => {
    if (loadingMore || !hasMore || loading) {
      return;
    }

    setLoadingMore(true);
    loadProducts(page + 1, false, searchText.trim());
  }, [loadingMore, hasMore, loading, loadProducts, page, searchText]);

  const listLabel = `Products · ${products.length}${hasMore ? '+' : ''}`;

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <LoadingOverlay isLoading={loading} />

      <View style={styles.headerBar}>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text style={styles.headerTitle}>Products</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New product"
          onPress={() => router.push('/products/new')}
          disabled={permissionState !== 'authorized'}
          style={styles.addButton}
        >
          <Plus size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.stateText}>Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : <>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.muted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by product name"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={COLORS.green} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>No products found</Text>
          <Text style={styles.stateText}>Add a product to get started.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.green}
            />
          }
          onMomentumScrollEnd={({ nativeEvent }) => {
            if (
              nativeEvent.layoutMeasurement.height +
                nativeEvent.contentOffset.y >=
              nativeEvent.contentSize.height - 120
            )
              onLoadMore();
          }}
        >
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.headerInfo]}>
              {listLabel}
            </Text>
            <Text style={[styles.headerCell, styles.stockColumn]}>Stock</Text>
            <Text style={[styles.headerCell, styles.priceColumn]}>
              Sale Price
            </Text>
            <View style={styles.headerChevronSpace} />
          </View>

          {products.map((product) => {
            const detail =
              [product.category, product.brand].filter(Boolean).join(' · ') ||
              '-';
            const isLowStock =
              product.currentStock != null &&
              product.minimumStock != null &&
              product.currentStock < product.minimumStock;

            return (
              <Pressable
                key={product.id}
                accessibilityRole="button"
                accessibilityLabel={`Product ${product.name}`}
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: '/products/view',
                    params: { id: product.id },
                  })
                }
              >
                <View style={styles.thumbWrapper}>
                  {product.coverImageUrl ? (
                    <Image
                      source={{ uri: product.coverImageUrl }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Icon
                        as={Package}
                        size={18}
                        className="text-muted-foreground"
                      />
                    </View>
                  )}
                </View>

                <View style={styles.infoColumn}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.productDetail} numberOfLines={1}>
                    {detail}
                  </Text>
                </View>

                <View style={styles.stockColumn}>
                  <Text
                    style={[
                      styles.numberValue,
                      isLowStock ? styles.lowStockText : null,
                    ]}
                  >
                    {product.currentStock ?? 0}
                  </Text>
                </View>

                <View style={styles.priceColumn}>
                  <Text style={styles.numberValue} numberOfLines={1}>
                    {product.salePrice != null
                      ? `${product.salePrice} MMK`
                      : '0 MMK'}
                  </Text>
                </View>

                <Icon
                  as={ChevronRight}
                  size={16}
                  className="text-muted-foreground"
                />
              </Pressable>
            );
          })}

          {loadingMore ? (
            <View style={styles.loadMoreRow}>
              <ActivityIndicator size="small" color={COLORS.green} />
            </View>
          ) : null}
        </ScrollView>
      )}
      </>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    minWidth: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
  },
  addButton: {
    width: 34,
    height: 34,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink,
    paddingVertical: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  centeredState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  stateText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
  },
  tableHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerCell: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerInfo: {
    flex: 1,
    paddingLeft: 56,
  },
  headerChevronSpace: {
    width: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  thumbWrapper: {
    width: 44,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F1F5F9',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  productDetail: {
    fontSize: 12,
    color: COLORS.muted,
  },
  stockColumn: {
    width: 56,
    alignItems: 'flex-end',
  },
  priceColumn: {
    width: 104,
    alignItems: 'flex-end',
  },
  numberValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  lowStockText: {
    color: COLORS.amber,
  },
  loadMoreRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
