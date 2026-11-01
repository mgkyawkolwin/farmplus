"use client";

import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Layers,
  Package,
  Percent,
  Tags,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BarChart,
  DonutChart,
  RankedBars,
  compactNumber,
} from "@/components/charts";
import LoadingOverlay from "@/components/loadingOverlay";
import UnauthorizedView from "@/components/unauthorized-view";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import SnackBar from "@/components/ui/snack-bar";
import { container, DI_TOKENS } from "@/di";
import { ProductItem } from "@/models/product";
import { IProductService } from "@/services/productService";
import { usePagePermission } from "@/lib/usePagePermission";
import { useTranslation } from 'react-i18next';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);

const COLORS = {
  ink: "#0F172A",
  muted: "#64748B",
  border: "#D9DEE5",
  green: "#16794B",
  blue: "#2367A8",
  amber: "#9A6700",
  red: "#B42318",
  purple: "#7C3AED",
  slate: "#94A3B8",
};

type Tone = "green" | "blue" | "amber" | "red";

const TONES: Record<Tone, { fg: string; bg: string; border: string }> = {
  green: { fg: "#16794B", bg: "#F4FAF6", border: "#D5E9DC" },
  blue: { fg: "#2367A8", bg: "#F3F8FC", border: "#D6E6F3" },
  amber: { fg: "#9A6700", bg: "#FFFAEE", border: "#EFE2BF" },
  red: { fg: "#B42318", bg: "#FFF5F4", border: "#F0D8D5" },
};

const PAGE_SIZE = 100;
const DAY = 86_400_000;

function money(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} MMK`;
}

function count(value: number) {
  return value.toLocaleString("en-US");
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function Section({
  title,
  subtitle,
  onViewAll,
  children,
}: {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleBlock}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {onViewAll ? (
          <Pressable style={styles.seeAll} onPress={onViewAll}>
            <Text style={styles.seeAllText}>{t('reports.common.viewAll')}</Text>
            <ChevronRight size={14} color={COLORS.green} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.panel}>{children}</View>
    </View>
  );
}

function Kpi({
  label,
  value,
  caption,
  icon: IconComponent,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Wallet;
  tone: Tone;
}) {
  const palette = TONES[tone];
  return (
    <View
      style={[
        styles.kpi,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderTopColor: palette.fg,
        },
      ]}
    >
      <View style={styles.kpiHeader}>
        <View style={styles.kpiIcon}>
          <IconComponent size={16} color={palette.fg} />
        </View>
        <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      <Text style={styles.kpiCaption} numberOfLines={1}>{caption}</Text>
    </View>
  );
}

type ProductGroup = { label: string; count: number; units: number; value: number };

export default function ProductReportDashboardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const permissionState = usePagePermission('/reports/products/dashboard');
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const allProducts: ProductItem[] = [];
      let page = 1;
      while (true) {
        const pageProducts = await productService.getProducts(page, PAGE_SIZE);
        allProducts.push(...pageProducts);
        if (pageProducts.length < PAGE_SIZE) break;
        page += 1;
      }
      setProducts(allProducts);
    } catch (error) {
      setProducts([]);
      SnackBar.Error(error instanceof Error ? error.message : t('reports.common.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void load();
      return undefined;
    }, [load, permissionState]),
  );

  const report = React.useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const activeProducts = products.filter((product) => product.isActive !== false);
    const inactiveProducts = products.length - activeProducts.length;
    const stockUnits = products.reduce((sum, product) => sum + Math.max(product.currentStock ?? 0, 0), 0);
    const stockValue = products.reduce(
      (sum, product) => sum + Math.max(product.currentStock ?? 0, 0) * Math.max(product.salePrice ?? 0, 0),
      0,
    );
    const lowStockProducts = products
      .filter((product) => {
        const stock = Math.max(product.currentStock ?? 0, 0);
        const minimum = Math.max(product.minimumStock ?? 0, 0);
        return stock <= minimum;
      })
      .sort((left, right) => (left.currentStock ?? 0) - (right.currentStock ?? 0))
      .slice(0, 8);
    const outOfStock = products.filter((product) => (product.currentStock ?? 0) <= 0).length;
    const lowStock = products.filter((product) => {
      const stock = product.currentStock ?? 0;
      const minimum = product.minimumStock ?? 0;
      return stock > 0 && minimum > 0 && stock <= minimum;
    }).length;
    const averagePrice = products.length
      ? products.reduce((sum, product) => sum + Math.max(product.salePrice ?? 0, 0), 0) / products.length
      : 0;

    const categoryMap = new Map<string, ProductGroup>();
    const brandMap = new Map<string, ProductGroup>();
    products.forEach((product) => {
      const stock = Math.max(product.currentStock ?? 0, 0);
      const price = Math.max(product.salePrice ?? 0, 0);
      const category = product.category?.trim() || "Uncategorized";
      const brand = product.brand?.trim() || "Unbranded";
      const categoryGroup = categoryMap.get(category) ?? { label: category, count: 0, units: 0, value: 0 };
      categoryGroup.count += 1;
      categoryGroup.units += stock;
      categoryGroup.value += stock * price;
      categoryMap.set(category, categoryGroup);
      const brandGroup = brandMap.get(brand) ?? { label: brand, count: 0, units: 0, value: 0 };
      brandGroup.count += 1;
      brandGroup.units += stock;
      brandGroup.value += stock * price;
      brandMap.set(brand, brandGroup);
    });
    const categories = [...categoryMap.values()].sort((left, right) => right.value - left.value);
    const brands = [...brandMap.values()].sort((left, right) => right.count - left.count);

    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return { key: monthKey(date), label: date.toLocaleDateString(i18n.language, { month: "short" }), added: 0 };
    });
    const monthBuckets = new Map(months.map((month) => [month.key, month]));
    products.forEach((product) => {
      if (!product.createdAtUtc) return;
      const month = monthBuckets.get(monthKey(new Date(product.createdAtUtc)));
      if (month) month.added += 1;
    });

    const newLast30 = products.filter((product) =>
      product.createdAtUtc && nowMs - new Date(product.createdAtUtc).getTime() <= 30 * DAY,
    ).length;
    const priceBands = [
      { label: "<10k", min: 0, max: 10_000, value: 0 },
      { label: "10-50k", min: 10_000, max: 50_000, value: 0 },
      { label: "50-100k", min: 50_000, max: 100_000, value: 0 },
      { label: "100k+", min: 100_000, max: Infinity, value: 0 },
    ];
    products.forEach((product) => {
      const price = Math.max(product.salePrice ?? 0, 0);
      const band = priceBands.find((item) => price >= item.min && price < item.max);
      if (band) band.value += 1;
    });

    const highestValue = [...products]
      .sort((left, right) =>
        (right.currentStock ?? 0) * (right.salePrice ?? 0) -
        (left.currentStock ?? 0) * (left.salePrice ?? 0),
      )
      .slice(0, 8);
    const recentlyAdded = [...products]
      .sort((left, right) =>
        new Date(right.createdAtUtc ?? 0).getTime() - new Date(left.createdAtUtc ?? 0).getTime(),
      )
      .slice(0, 6);
    const categoryCount = categoryMap.size;
    const brandCount = brandMap.size;

    return {
      activeProducts,
      inactiveProducts,
      stockUnits,
      stockValue,
      lowStockProducts,
      outOfStock,
      lowStock,
      averagePrice,
      categories,
      brands,
      months,
      newLast30,
      priceBands,
      highestValue,
      recentlyAdded,
      categoryCount,
      brandCount,
    };
  }, [products, i18n.language]);

  const stockHealthy = Math.max(products.length - report.outOfStock - report.lowStock, 0);
  const stockRisk = report.outOfStock + report.lowStock;
  const topCategoryValue = report.categories.slice(0, 5).reduce((sum, item) => sum + item.value, 0);
  const otherCategoryValue = Math.max(report.stockValue - topCategoryValue, 0);
  const categoryLabel = (label: string) => label === 'Uncategorized' ? t('reports.products.labels.uncategorized') : label;
  const brandLabel = (label: string) => label === 'Unbranded' ? t('reports.products.labels.unbranded') : label;
  const priceBandLabel = (label: string) => ({
    '<10k': t('reports.products.priceBand.under10k'),
    '10-50k': t('reports.products.priceBand.10to50k'),
    '50-100k': t('reports.products.priceBand.50to100k'),
    '100k+': t('reports.products.priceBand.100kPlus'),
  }[label] ?? label);
  const categorySlices = [
    ...report.categories.slice(0, 5).map((item, index) => ({
      label: categoryLabel(item.label),
      value: item.value,
      color: [COLORS.green, COLORS.blue, COLORS.amber, COLORS.purple, COLORS.red][index],
    })),
    ...(otherCategoryValue > 0 ? [{ label: t('reports.products.chart.other'), value: otherCategoryValue, color: COLORS.slate }] : []),
  ];
  const topStockValue = report.highestValue[0]
    ? (report.highestValue[0].currentStock ?? 0) * (report.highestValue[0].salePrice ?? 0)
    : 0;
  const productListRoute = "/products/list" as Href;

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <LoadingOverlay isLoading={permissionState === 'authorized' && loading} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{t('reports.products.title')}</Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}><ActivityIndicator size="large" color="#16794B" /><Text className="text-muted-foreground" style={styles.stateText}>{t('reports.common.checkingPermission')}</Text></View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('reports.common.unauthorizedTitle')} message={t('reports.common.unauthorizedDescription')} />
      ) : <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            void load();
          }} />
        }
      >
        <View>
          <Text style={styles.eyebrow}>{t('reports.products.eyebrow')}</Text>
          <Text style={styles.title}>{t('reports.products.overview')}</Text>
          <Text style={styles.subtitle}>
            {t('reports.products.subtitle', { count: count(products.length) })}
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi label={t('reports.products.kpi.totalProducts')} value={count(products.length)} caption={t('reports.products.caption.categoryCount', { count: count(report.categoryCount) })} icon={Boxes} tone="blue" />
          <Kpi label={t('reports.products.kpi.activeProducts')} value={count(report.activeProducts.length)} caption={t('reports.products.caption.inactive', { count: count(report.inactiveProducts) })} icon={Package} tone="green" />
          <Kpi label={t('reports.products.kpi.stockOnHand')} value={count(report.stockUnits)} caption={t('reports.products.caption.skusOut', { count: count(report.outOfStock) })} icon={Layers} tone={report.outOfStock > 0 ? "amber" : "green"} />
          <Kpi label={t('reports.products.kpi.stockValue')} value={money(report.stockValue)} caption={t('reports.products.caption.atSalePrice')} icon={Wallet} tone="green" />
          <Kpi label={t('reports.products.kpi.lowStock')} value={count(report.lowStock)} caption={t('reports.products.caption.atOrBelowMinimum')} icon={AlertTriangle} tone={report.lowStock > 0 ? "amber" : "green"} />
          <Kpi label={t('reports.products.kpi.outOfStock')} value={count(report.outOfStock)} caption={t('reports.products.caption.noStockSelectedShop')} icon={AlertTriangle} tone={report.outOfStock > 0 ? "red" : "green"} />
          <Kpi label={t('reports.products.kpi.averagePrice')} value={money(report.averagePrice)} caption={t('reports.products.caption.allProducts')} icon={Percent} tone="blue" />
          <Kpi label={t('reports.products.kpi.new30')} value={count(report.newLast30)} caption={t('reports.products.caption.newCatalog')} icon={CalendarDays} tone="blue" />
          <Kpi label={t('reports.products.kpi.categoryGroups')} value={count(report.categoryCount)} caption={t('reports.products.caption.brandCount', { count: count(report.brandCount) })} icon={Tags} tone="green" />
          <Kpi label={t('reports.products.kpi.largestStockValue')} value={money(topStockValue)} caption={report.highestValue[0]?.name ?? t('reports.products.caption.noProducts')} icon={TrendingUp} tone="amber" />
        </View>

        <Section title={t('reports.products.section.additions')} subtitle={t('reports.products.subtitleSection.additions')}>
          <BarChart
            data={report.months.map((month) => ({ label: month.label, values: [month.added] }))}
            series={[{ name: t('reports.products.series.productsAdded'), color: COLORS.blue }]}
          />
        </Section>

        <Section title={t('reports.products.section.stockHealth')} subtitle={t('reports.products.subtitleSection.skuAvailability')}>
          <DonutChart
            centerLabel={t('reports.products.chart.products')}
            centerValue={count(products.length)}
            slices={[
              { label: t('reports.products.chart.healthy'), value: stockHealthy, color: COLORS.green },
              { label: t('reports.products.chart.lowStock'), value: report.lowStock, color: COLORS.amber },
              { label: t('reports.products.chart.outOfStock'), value: report.outOfStock, color: COLORS.red },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title={t('reports.products.section.categoryValue')} subtitle={t('reports.products.subtitleSection.stockValue')}>
          <DonutChart
            centerLabel={t('reports.products.chart.stockValue')}
            centerValue={compactNumber(report.stockValue)}
            slices={categorySlices}
            formatValue={money}
          />
        </Section>

        <Section title={t('reports.products.section.priceDistribution')} subtitle={t('reports.products.subtitleSection.priceDistribution')}>
          <BarChart
            data={report.priceBands.map((band) => ({ label: priceBandLabel(band.label), values: [band.value] }))}
            series={[{ name: t('reports.products.chart.products'), color: COLORS.purple }]}
            height={160}
          />
        </Section>

        <Section title={t('reports.products.section.topCategories')} subtitle={t('reports.products.subtitleSection.byValue')}>
          <RankedBars
            items={report.categories.slice(0, 8).map((category) => ({
              label: categoryLabel(category.label),
              value: category.value,
              caption: `${count(category.count)} ${t('reports.products.chart.products')} · ${count(category.units)} ${t('reports.products.chart.units')}`,
            }))}
            color={COLORS.green}
            formatValue={money}
            emptyText={t('reports.products.empty.noCategories')}
          />
        </Section>

        <Section title={t('reports.products.section.topBrands')} subtitle={t('reports.products.subtitleSection.byCount')}>
          <RankedBars
            items={report.brands.slice(0, 8).map((brand) => ({
              label: brandLabel(brand.label),
              value: brand.count,
              caption: `${count(brand.units)} ${t('reports.products.chart.units')} · ${money(brand.value)} ${t('reports.products.chart.stockValue')}`,
            }))}
            color={COLORS.blue}
            formatValue={count}
            emptyText={t('reports.products.empty.noBrands')}
          />
        </Section>

        <Section
          title={t('reports.products.section.highestValue')}
          subtitle={t('reports.products.subtitleSection.greatestValue')}
          onViewAll={() => router.push(productListRoute)}
        >
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>{t('reports.products.field.product')}</Text>
              <Text style={[styles.th, styles.tdSmall]}>{t('reports.products.field.stock')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.products.field.value')}</Text>
            </View>
            {report.highestValue.map((product) => (
              <Pressable
                key={product.id}
                style={styles.tableRow}
                onPress={() => router.push({ pathname: "/products/view", params: { id: product.id } } as Href)}
              >
                <View style={styles.tdWide}>
                  <Text style={styles.td} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.tdSub} numberOfLines={1}>{product.category || t('reports.products.labels.uncategorized')}</Text>
                </View>
                <Text style={[styles.td, styles.tdSmall]}>{count(product.currentStock ?? 0)}</Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>
                  {compactNumber((product.currentStock ?? 0) * (product.salePrice ?? 0))}
                </Text>
              </Pressable>
            ))}
            {report.highestValue.length === 0 ? <Text style={styles.empty}>{t('reports.products.empty.noProducts')}</Text> : null}
          </View>
        </Section>

        <Section title={t('reports.products.section.reorderAttention')} subtitle={t('reports.products.subtitleSection.reorder')}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>{t('reports.products.field.product')}</Text>
              <Text style={[styles.th, styles.tdSmall]}>{t('reports.products.field.stock')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.products.field.minimum')}</Text>
            </View>
            {report.lowStockProducts.map((product) => (
              <Pressable
                key={product.id}
                style={styles.tableRow}
                onPress={() => router.push({ pathname: "/products/view", params: { id: product.id } } as Href)}
              >
                <View style={styles.tdWide}>
                  <Text style={styles.td} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.tdSub} numberOfLines={1}>{product.category || t('reports.products.labels.uncategorized')}</Text>
                </View>
                <Text style={[styles.td, styles.tdSmall, styles.red]}>{count(product.currentStock ?? 0)}</Text>
                <Text style={[styles.td, styles.tdNum]}>{count(product.minimumStock ?? 0)}</Text>
              </Pressable>
            ))}
            {report.lowStockProducts.length === 0 ? <Text style={styles.empty}>{t('reports.products.empty.aboveMinimum')}</Text> : null}
          </View>
        </Section>

        <Section
          title={t('reports.products.section.recentlyAdded')}
          subtitle={t('reports.products.subtitleSection.newest')}
          onViewAll={() => router.push(productListRoute)}
        >
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>{t('reports.products.field.product')}</Text>
              <Text style={[styles.th, styles.tdNum]}>{t('reports.products.field.added')}</Text>
              <Text style={[styles.th, styles.tdStatus]}>{t('reports.products.field.status')}</Text>
            </View>
            {report.recentlyAdded.map((product) => {
              const active = product.isActive !== false;
              return (
                <Pressable
                  key={product.id}
                  style={styles.tableRow}
                  onPress={() => router.push({ pathname: "/products/view", params: { id: product.id } } as Href)}
                >
                  <View style={styles.tdWide}>
                    <Text style={styles.td} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.tdSub} numberOfLines={1}>{product.brand || t('reports.products.labels.unbranded')}</Text>
                  </View>
                  <Text style={[styles.td, styles.tdNum]}>
                    {product.createdAtUtc ? new Date(product.createdAtUtc).toLocaleDateString() : "-"}
                  </Text>
                  <View style={styles.tdStatus}>
                    <View style={[styles.statusPill, { backgroundColor: active ? "#D1FAE5" : "#FEE2E2" }]}>
                      <Text style={[styles.statusText, { color: active ? "#047857" : "#B91C1C" }]}>
                        {active ? t('reports.common.active') : t('reports.common.inactive')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {report.recentlyAdded.length === 0 ? <Text style={styles.empty}>{t('reports.products.empty.noProductsYet')}</Text> : null}
          </View>
        </Section>
      </ScrollView>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 6 },
  headerButton: { minWidth: 40 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", color: COLORS.green },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.ink },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: { width: "48%", padding: 12, gap: 6, borderWidth: 1, borderTopWidth: 3, borderRadius: 6 },
  kpiHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  kpiIcon: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  kpiLabel: { flex: 1, fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase", color: COLORS.muted },
  kpiValue: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  kpiCaption: { fontSize: 11, color: COLORS.muted },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionTitleBlock: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.ink },
  sectionSubtitle: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: "700", color: COLORS.green },
  panel: { padding: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, backgroundColor: "#FFFFFF" },
  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, overflow: "hidden" },
  tableHeader: { flexDirection: "row", alignItems: "center", minHeight: 30, paddingHorizontal: 10, gap: 6, backgroundColor: "#F1F5F9" },
  th: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase", color: COLORS.muted },
  tableRow: { flexDirection: "row", alignItems: "center", minHeight: 40, paddingHorizontal: 10, paddingVertical: 6, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#CBD5E1" },
  td: { fontSize: 12, color: COLORS.ink },
  tdSub: { fontSize: 10, color: COLORS.muted },
  tdWide: { flex: 2, minWidth: 0 },
  tdSmall: { flex: 0.8, textAlign: "right" },
  tdNum: { flex: 1.2, textAlign: "right" },
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { marginTop: 8, textAlign: "center" },
  tdStatus: { flex: 1.1, alignItems: "flex-end" },
  red: { color: COLORS.red, fontWeight: "700" },
  statusPill: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  empty: { padding: 14, textAlign: "center", fontSize: 12, color: COLORS.muted },
});