'use client';

import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  TrendingUp,
  XCircle,
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { container, DI_TOKENS } from '@/di';
import { ProductItem } from '@/models/product';
import { IProductService } from '@/services/productService';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);

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
    <View style={[styles.metricCard, toneStyle]}>
      <View style={styles.metricIconWrap}>
        <MetricIcon size={18} color={tone === 'green' ? '#16794B' : tone === 'blue' ? '#2367A8' : tone === 'amber' ? '#9A6700' : '#B42318'} />
      </View>
      <Text className="text-muted-foreground" style={styles.metricLabel}>{label}</Text>
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

  const loadProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts(1, 200);
      setProducts(result);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadProducts();
      return undefined;
    }, [loadProducts])
  );

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

  const quickActions = [
    { label: 'New Product', icon: Plus, route: '/products/new' as const },
    { label: 'Products', icon: Package, route: '/products/dashboard' as const },
  ];

  const recentProducts = React.useMemo(
    () =>
      [...products]
        .sort((a, b) => {
          const aDate = new Date(a.updatedAtUtc ?? a.createdAtUtc ?? 0).getTime();
          const bDate = new Date(b.updatedAtUtc ?? b.createdAtUtc ?? 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 4),
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

      <KeyboardAwareScrollView className="bg-background" style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text variant="h3" className="text-foreground">Overview</Text>
        </View>

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

        <View style={styles.quickActionsContainer}>
          <Text variant="h3" className="text-foreground" style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Pressable key={`${action.label}-${index}`} style={styles.actionButton} onPress={() => router.push(action.route)}>
                  <IconComponent size={28} color="#1F2937" />
                  <Text className="text-foreground text-xs" style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text variant="h4" className="text-foreground">Recent Products</Text>
            <Pressable onPress={() => router.push('/products/list')}>
              <ChevronRight size={18} color="#4f46e5" />
            </Pressable>
          </View>

          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]} className="text-muted-foreground text-xs font-semibold">Product</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.4 }]} className="text-muted-foreground text-xs font-semibold">Category</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]} className="text-muted-foreground text-xs font-semibold text-right">Stock</Text>
          </View>

          {loading ? (
            <Text className="text-muted-foreground" style={styles.emptyText}>Loading products...</Text>
          ) : recentProducts.length === 0 ? (
            <Text className="text-muted-foreground" style={styles.emptyText}>No products available.</Text>
          ) : (
            recentProducts.map((product) => (
              <Pressable
                key={product.id}
                style={styles.tableRow}
                onPress={() => router.push({ pathname: '/products/view', params: { id: product.id } })}
              >
                <View style={[styles.tableCell, { flex: 2 }]}> 
                  <Text className="text-foreground text-sm font-medium">{product.name}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1.4 }]}> 
                  <Text className="text-muted-foreground text-sm">{product.category || '-'}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1, alignItems: 'flex-end' }]}> 
                  <Text className={((product.currentStock ?? 0) === 0 ? 'text-red-500' : 'text-foreground')} style={styles.stockText}>
                    {product.currentStock ?? 0}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButton: {
    minWidth: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    minHeight: 126,
    borderRadius: 8,
    borderWidth: 1,
    padding: 13,
    justifyContent: 'space-between',
  },
  metricGreen: { backgroundColor: '#EFF8F2', borderColor: '#CDE8D6' },
  metricBlue: { backgroundColor: '#EEF6FC', borderColor: '#D1E5F5' },
  metricAmber: { backgroundColor: '#FFF8E8', borderColor: '#F0E0B7' },
  metricRed: { backgroundColor: '#FFF1F0', borderColor: '#F2D4D0' },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFFAA',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '700',
  },
  quickActionsContainer: {
    marginTop: 16,
    gap: 10,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    gap: 6,
  },
  actionLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  tableCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
  },
  tableCell: {
    justifyContent: 'center',
  },
  emptyText: {
    paddingVertical: 16,
  },
  stockText: {
    fontWeight: '600',
  },
});
