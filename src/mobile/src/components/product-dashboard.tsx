'use client';

import * as React from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CirclePlus,
  Package,
  TrendingUp,
  XCircle,
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { container, DI_TOKENS } from '@/di';
import { ProductItem } from '@/models/product';
import { IProductService } from '@/services/productService';
import { useSelectedShopChanged } from '@/lib/selectedShop';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);

const TONE_COLORS = {
  green: '#16794B',
  blue: '#2367A8',
  amber: '#9A6700',
  red: '#B42318',
};

function MetricTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: 'green' | 'blue' | 'amber' | 'red';
}) {
  const MetricIcon = icon;
  const toneStyle = tone === 'green'
    ? styles.metricGreen
    : tone === 'blue'
      ? styles.metricBlue
      : tone === 'amber'
        ? styles.metricAmber
        : styles.metricRed;

  return (
    <View style={[styles.metricCard, toneStyle, { borderTopColor: TONE_COLORS[tone] }]}>
      <View style={styles.metricHeader}>
        <View style={styles.metricIconWrap}>
          <MetricIcon size={16} color={TONE_COLORS[tone]} />
        </View>
        <Text className="text-muted-foreground" style={styles.metricLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text className="text-foreground" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

export function ProductsDashboardContent({
  showHeader = false,
  title = 'Products',
  onBack,
}: {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadProducts = React.useCallback(async () => {
    try {
      const result = await productService.getProducts(1, 200);
      setProducts(result);
    } catch (error) {
      setProducts([]);
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
    }, [loadProducts])
  );

  useSelectedShopChanged(() => {
    void loadProducts();
  });

  const metrics = React.useMemo(() => {
    const totalProducts = products.length;
    const categories = new Set(products.map((item) => item.category).filter(Boolean)).size;
    const activeProducts = products.filter((item) => item.isActive !== false).length;
    const inactiveProducts = products.filter((item) => item.isActive === false).length;
    const lowStock = products.filter((item) => {
      const minimumStock = item.minimumStock ?? 0;
      return (item.currentStock ?? 0) <= minimumStock && (item.currentStock ?? 0) > 0;
    }).length;
    const outOfStock = products.filter((item) => (item.currentStock ?? 0) <= 0).length;

    return [
      { label: 'Total Products', value: String(totalProducts), icon: Package, tone: 'blue' as const },
      { label: 'Categories', value: String(categories), icon: Boxes, tone: 'green' as const },
      { label: 'Active Products', value: String(activeProducts), icon: CheckCircle2, tone: 'green' as const },
      { label: 'Inactive Products', value: String(inactiveProducts), icon: XCircle, tone: 'amber' as const },
      { label: 'Low Stock', value: String(lowStock), icon: AlertTriangle, tone: 'amber' as const },
      { label: 'Out of Stock', value: String(outOfStock), icon: TrendingUp, tone: 'red' as const },
    ];
  }, [products]);

  const recentProducts = React.useMemo(
    () =>
      [...products]
        .sort((a, b) => {
          const aDate = new Date(a.updatedAtUtc ?? a.createdAtUtc ?? 0).getTime();
          const bDate = new Date(b.updatedAtUtc ?? b.createdAtUtc ?? 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 5),
    [products]
  );

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

      {loading && products.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading products...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void loadProducts();
          }} />}
        >
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <MetricTile
                key={metric.label}
                label={metric.label}
                value={metric.value}
                icon={metric.icon}
                tone={metric.tone}
              />
            ))}
          </View>

          <View style={styles.actionRow}>
            <Button
              style={[styles.actionButton, styles.actionPrimary]}
              onPress={() => router.push('/products/new' as Parameters<typeof router.push>[0])}
            >
              <CirclePlus size={18} color="#FFFFFF" />
              <Text style={[styles.actionLabel, styles.actionPrimaryLabel]}>New Product</Text>
            </Button>
            <Button
              variant="outline"
              style={[styles.actionButton, styles.actionSecondary]}
              onPress={() => router.push('/products/list' as Parameters<typeof router.push>[0])}
            >
              <ClipboardList size={18} color="#16794B" />
              <Text style={[styles.actionLabel, styles.actionSecondaryLabel]}>View Products</Text>
            </Button>
          </View>

          <View style={styles.recentSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>Recent Products</Text>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllButton}
                onPress={() => router.push('/products/list' as Parameters<typeof router.push>[0])}
              >
                <Text style={styles.seeAllText}>View all</Text>
                <ChevronRight size={14} color="#16794B" />
              </Button>
            </View>

            <View style={styles.tableHeader}>
              <View style={styles.photoColumn} />
              <View style={styles.productColumn}>
                <Text className="text-muted-foreground" style={styles.headerCell}>Product</Text>
              </View>
              <View style={styles.categoryColumn}>
                <Text className="text-muted-foreground" style={styles.headerCell}>Category</Text>
              </View>
              <View style={styles.stockColumn}>
                <Text className="text-muted-foreground" style={styles.headerCell}>Stock</Text>
              </View>
            </View>
            {recentProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">No products available.</Text>
              </View>
            ) : (
              recentProducts.map((product) => {
                const stock = product.currentStock ?? 0;
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => router.push({ pathname: '/products/view', params: { id: product.id } })}
                  >
                    <View style={styles.productRow}>
                      <View style={styles.photoColumn}>
                        {product.coverImageUrl ? (
                          <Image source={{ uri: product.coverImageUrl }} style={styles.photo} />
                        ) : (
                          <View style={[styles.photo, styles.photoFallback]}>
                            <Icon className="text-muted-foreground" as={Package} size={16} />
                          </View>
                        )}
                      </View>
                      <View style={styles.productColumn}>
                        <Text className="text-foreground" style={styles.productName} numberOfLines={1}>
                          {product.name}
                        </Text>
                      </View>
                      <View style={styles.categoryColumn}>
                        <Text className="text-muted-foreground" style={styles.categoryText} numberOfLines={1}>
                          {product.category || '-'}
                        </Text>
                      </View>
                      <View style={styles.stockColumn}>
                        <Text style={[styles.stockText, stock <= 0 && styles.stockOut]} numberOfLines={1}>
                          {stock.toLocaleString('en-US')}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })
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
  metricGreen: { backgroundColor: '#F4FAF6', borderColor: '#D5E9DC' },
  metricBlue: { backgroundColor: '#F3F8FC', borderColor: '#D6E6F3' },
  metricAmber: { backgroundColor: '#FFFAEE', borderColor: '#EFE2BF' },
  metricRed: { backgroundColor: '#FFF5F4', borderColor: '#F0D8D5' },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricIconWrap: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFAA' },
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
  tableHeader: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, backgroundColor: '#F1F5F9', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#D9DEE5' },
  headerCell: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  productColumn: { flex: 1, minWidth: 0, justifyContent: 'center' },
  photoColumn: { width: 36 },
  categoryColumn: { width: 92, justifyContent: 'center' },
  stockColumn: { width: 48, alignItems: 'flex-end', justifyContent: 'center' },
  productRow: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#CBD5E1' },
  photo: { width: 36, height: 36, borderRadius: 6 },
  photoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  productName: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  categoryText: { fontSize: 11 },
  stockText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  stockOut: { color: '#B91C1C' },
  emptyState: { paddingVertical: 26, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});
