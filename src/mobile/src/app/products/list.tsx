'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { ChevronLeft, Package, Plus, Search } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { container, DI_TOKENS } from '@/di';
import { ProductItem } from '@/models/product';
import { IProductService } from '@/services/productService';
import LoadingOverlay from '@/components/loadingOverlay';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);

export default function ProductListScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [searchText, setSearchText] = React.useState('');
  const pageSize = 20;

  const loadProducts = React.useCallback(async (nextPage = 1, reset = false, name?: string) => {
    if (nextPage === 1 && !reset) {
      setLoading(true);
    }

    try {
      const result = await productService.getProducts(nextPage, pageSize);
      const filtered = name
        ? result.filter((item) => item.name.toLowerCase().includes(name.toLowerCase()))
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
  }, []);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    setProducts([]);
    try {
      const result = await productService.getProducts(1, pageSize);
      const filtered = searchText.trim()
        ? result.filter((item) => item.name.toLowerCase().includes(searchText.trim().toLowerCase()))
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
  }, [pageSize, searchText]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
      return undefined;
    }, [fetchProducts])
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

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar className="bg-background" barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'} />
      <LoadingOverlay isLoading={loading} />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          Products
        </Text>
        <Button variant="ghost" onPress={() => router.push('/products/new')} style={styles.addButton}>
          <Icon className="text-foreground" as={Plus} size={20} />
        </Button>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon className="text-muted-foreground" as={Search} size={16} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by product name"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-muted-foreground" style={styles.stateText}>
            Loading products...
          </Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>
            No products found
          </Text>
          <Text className="text-muted-foreground" style={styles.stateText}>
            Add a product to get started.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;
            if (isNearBottom) {
              onLoadMore();
            }
          }}
        >
          {products.map((product) => (
            <Pressable
              key={product.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/products/view', params: { id: product.id } })}
            >
              <View style={styles.leftSection}>
                <Text className="text-foreground" style={styles.productName}>
                  {product.name}
                </Text>
                <View style={styles.detailRow}>
                  <Icon className="text-muted-foreground" as={Package} size={14} />
                  <Text className="text-muted-foreground" style={styles.productDetail}>
                    {product.category || '-'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text className="text-muted-foreground" style={styles.productDetail}>
                    Stock: {product.currentStock ?? 0}
                  </Text>
                </View>
              </View>

              <View style={styles.rightSection}>
                <Text className="text-muted-foreground" style={styles.priceLabel}>
                  Sale Price
                </Text>
                <Text className="text-foreground" style={styles.priceValue}>
                  {product.salePrice != null ? `${product.salePrice} MMK` : '0 MMK'}
                </Text>
              </View>
            </Pressable>
          ))}

          {loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#4f46e5" />
              <Text className="text-muted-foreground" style={styles.loadMoreText}>
                Loading more...
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButton: {
    minWidth: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    minWidth: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  leftSection: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productDetail: {
    fontSize: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 13,
  },
});
