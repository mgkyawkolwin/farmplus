'use client';

import * as React from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
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
import UnauthorizedView from '@/components/unauthorized-view';
import { usePagePermission } from '@/lib/usePagePermission';
import { ProductItem } from '@/models/product';
import { IProductService } from '@/services/productService';
import { useSelectedShopChanged } from '@/lib/selectedShop';
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);

type ThemeColors = typeof THEME.light;
type MetricTone = 'green' | 'blue' | 'amber' | 'red';

const getToneColor = (tone: MetricTone, theme: ThemeColors) => {
  switch (tone) {
    case 'green': return theme.chart2;
    case 'blue': return theme.chart1;
    case 'amber': return theme.chart4;
    case 'red': return theme.destructive;
  }
};

function MetricTile({
  label,
  value,
  icon,
  tone,
  theme,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: MetricTone;
  theme: ThemeColors;
}) {
  const MetricIcon = icon;

  return (
    <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border, borderTopColor: getToneColor(tone, theme) }]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconWrap, { backgroundColor: theme.secondary }]}>
          <MetricIcon size={16} color={getToneColor(tone, theme)} />
        </View>
        <Text style={[styles.metricLabel, { color: theme.mutedForeground }]} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, { color: theme.foreground }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

export function ProductsDashboardContent({
  showHeader = false,
  title,
  onBack,
}: {
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/products/dashboard');
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
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void loadProducts();
      return undefined;
    }, [loadProducts, permissionState])
  );

  useSelectedShopChanged(() => {
    if (permissionState === 'authorized') void loadProducts();
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
      { label: t('products.dashboard.totalProducts'), value: String(totalProducts), icon: Package, tone: 'blue' as const },
      { label: t('products.dashboard.categories'), value: String(categories), icon: Boxes, tone: 'green' as const },
      { label: t('products.dashboard.activeProducts'), value: String(activeProducts), icon: CheckCircle2, tone: 'green' as const },
      { label: t('products.dashboard.inactiveProducts'), value: String(inactiveProducts), icon: XCircle, tone: 'amber' as const },
      { label: t('products.dashboard.lowStock'), value: String(lowStock), icon: AlertTriangle, tone: 'amber' as const },
      { label: t('products.dashboard.outOfStock'), value: String(outOfStock), icon: TrendingUp, tone: 'red' as const },
    ];
  }, [products, t]);

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
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      {showHeader ? (
        <View style={[styles.headerBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Button variant="ghost" onPress={onBack ?? (() => router.back())} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>{title ?? t('products.dashboard.title')}</Text>
          <View style={styles.headerButton} />
        </View>
      ) : null}

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('products.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('products.unauthorized.title')} message={t('products.unauthorized.description')} />
      ) : loading && products.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('products.dashboard.loading')}</Text>
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
                theme={theme}
              />
            ))}
          </View>

          <View style={styles.actionRow}>
            <Button
              style={[styles.actionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => router.push('/products/new' as Parameters<typeof router.push>[0])}
            >
              <CirclePlus size={18} color={theme.primaryForeground} />
              <Text style={[styles.actionLabel, { color: theme.primaryForeground }]}>{t('products.dashboard.newProduct')}</Text>
            </Button>
            <Button
              variant="outline"
              style={[styles.actionButton, { backgroundColor: theme.secondary, borderColor: theme.border }]}
              onPress={() => router.push('/products/list' as Parameters<typeof router.push>[0])}
            >
              <ClipboardList size={18} color={theme.primary} />
              <Text style={[styles.actionLabel, { color: theme.primary }]}>{t('products.dashboard.viewProducts')}</Text>
            </Button>
          </View>

          <View style={styles.recentSection}>
            <View style={styles.sectionHeading}>
              <View>
                <Text className="text-foreground" style={styles.sectionTitle}>{t('products.dashboard.recentProducts')}</Text>
              </View>
              <Button
                variant="ghost"
                style={[styles.seeAllButton, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                onPress={() => router.push('/products/list' as Parameters<typeof router.push>[0])}
              >
                <Text style={[styles.seeAllText, { color: theme.primary }]}>{t('products.dashboard.viewAll')}</Text>
                <ChevronRight size={14} color={theme.primary} />
              </Button>
            </View>

            <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderColor: theme.border }]}>
              <View style={styles.photoColumn} />
              <View style={styles.productColumn}>
                <Text className="text-muted-foreground" style={styles.headerCell}>{t('products.fields.product')}</Text>
              </View>
              <View style={styles.categoryColumn}>
                <Text className="text-muted-foreground" style={styles.headerCell}>{t('products.fields.category')}</Text>
              </View>
              <View style={styles.stockColumn}>
                <Text className="text-muted-foreground" style={styles.headerCell}>{t('products.fields.stock')}</Text>
              </View>
            </View>
            {recentProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text className="text-muted-foreground">{t('products.dashboard.noProductsAvailable')}</Text>
              </View>
            ) : (
              recentProducts.map((product) => {
                const stock = product.currentStock ?? 0;
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => router.push({ pathname: '/products/view', params: { id: product.id } })}
                  >
                    <View style={[styles.productRow, { borderBottomColor: theme.border }]}>
                      <View style={styles.photoColumn}>
                        {product.coverImageUrl ? (
                          <Image source={{ uri: product.coverImageUrl }} style={styles.photo} />
                        ) : (
                          <View style={[styles.photo, styles.photoFallback, { backgroundColor: theme.secondary }]}>
                            <Icon className="text-muted-foreground" as={Package} size={16} />
                          </View>
                        )}
                      </View>
                      <View style={styles.productColumn}>
                        <Text style={[styles.productName, { color: theme.foreground }]} numberOfLines={1}>
                          {product.name}
                        </Text>
                      </View>
                      <View style={styles.categoryColumn}>
                        <Text style={[styles.categoryText, { color: theme.mutedForeground }]} numberOfLines={1}>
                          {product.category || '-'}
                        </Text>
                      </View>
                      <View style={styles.stockColumn}>
                        <Text style={[styles.stockText, { color: stock <= 0 ? theme.destructive : theme.foreground }]} numberOfLines={1}>
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
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricIconWrap: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { flex: 1, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, minHeight: 46, gap: 8, borderRadius: 6 },
  actionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  recentSection: { gap: 0 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  seeAllButton: { minHeight: 30, paddingHorizontal: 10, paddingVertical: 0, flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 999, borderWidth: 1 },
  seeAllText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  tableHeader: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, borderTopWidth: 1, borderBottomWidth: 1 },
  headerCell: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  productColumn: { flex: 1, minWidth: 0, justifyContent: 'center' },
  photoColumn: { width: 36 },
  categoryColumn: { width: 92, justifyContent: 'center' },
  stockColumn: { width: 48, alignItems: 'flex-end', justifyContent: 'center' },
  productRow: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  photo: { width: 36, height: 36, borderRadius: 6 },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 12, fontWeight: '700' },
  categoryText: { fontSize: 11 },
  stockText: { fontSize: 12, fontWeight: '800' },
  emptyState: { paddingVertical: 26, alignItems: 'center' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
});
