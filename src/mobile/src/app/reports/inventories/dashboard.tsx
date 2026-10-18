"use client";

import * as React from "react";
import {
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
  Repeat,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BarChart,
  DonutChart,
  LineChart,
  RankedBars,
  compactNumber,
} from "@/components/charts";
import LoadingOverlay from "@/components/loadingOverlay";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import SnackBar from "@/components/ui/snack-bar";
import { container, DI_TOKENS } from "@/di";
import { InventoryMovement, ProductItem } from "@/models/product";
import { getInventoryProducts } from "@/services/inventoryService";
import { IProductService } from "@/services/productService";
import { useSelectedShopChanged } from "@/lib/selectedShop";

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

const PAGE_SIZE = 500;
const DAY = 86_400_000;

function count(value: number) {
  return value.toLocaleString("en-US");
}

function money(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} MMK`;
}

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function timestamp(value?: string) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function movementIsTransfer(type: string) {
  return type.toLowerCase().includes("transfer");
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
  return (
    <View>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleBlock}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {onViewAll ? (
          <Pressable style={styles.seeAll} onPress={onViewAll}>
            <Text style={styles.seeAllText}>View all</Text>
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

type CategoryStats = { name: string; skus: number; units: number; value: number };
type ProductMovementStats = { id: string; name: string; units: number; events: number };
type MovementTypeStats = { name: string; quantity: number; events: number };

export default function InventoryReportDashboardScreen() {
  const router = useRouter();
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [movements, setMovements] = React.useState<InventoryMovement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    const [productResult, movementResult] = await Promise.allSettled([
      getInventoryProducts(),
      (async () => {
        const all: InventoryMovement[] = [];
        let page = 1;
        while (true) {
          const next = await productService.getInventoryMovements(page, PAGE_SIZE);
          all.push(...next);
          if (next.length < PAGE_SIZE) break;
          page += 1;
        }
        return all;
      })(),
    ]);

    if (productResult.status === "rejected" && movementResult.status === "rejected") {
      SnackBar.Error("Unable to load inventory report");
    }
    setProducts(productResult.status === "fulfilled" ? productResult.value : []);
    setMovements(movementResult.status === "fulfilled" ? movementResult.value : []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void load();
      return undefined;
    }, [load]),
  );

  useSelectedShopChanged(() => {
    void load();
  });

  const report = React.useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const stockUnits = products.reduce((sum, product) => sum + Math.max(product.currentStock ?? 0, 0), 0);
    const stockValue = products.reduce(
      (sum, product) => sum + Math.max(product.currentStock ?? 0, 0) * Math.max(product.salePrice ?? 0, 0),
      0,
    );
    const activeProducts = products.filter((product) => product.isActive !== false).length;
    const outOfStockProducts = products.filter((product) => (product.currentStock ?? 0) <= 0);
    const lowStockProducts = products.filter((product) => {
      const stock = product.currentStock ?? 0;
      const minimum = product.minimumStock ?? 0;
      return stock > 0 && minimum > 0 && stock <= minimum;
    }).sort((left, right) => (left.currentStock ?? 0) - (right.currentStock ?? 0));
    const healthyStock = Math.max(products.length - outOfStockProducts.length - lowStockProducts.length, 0);

    const monthly = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return {
        key: monthKey(date),
        label: date.toLocaleDateString("en-US", { month: "short" }),
        stockIn: 0,
        stockOut: 0,
        transferIn: 0,
        transferOut: 0,
        events: 0,
      };
    });
    const monthBuckets = new Map(monthly.map((item) => [item.key, item]));
    const categoryMap = new Map<string, CategoryStats>();
    const productMap = new Map<string, ProductMovementStats>();
    const typeMap = new Map<string, MovementTypeStats>();
    let stockIn = 0;
    let stockOut = 0;
    let transferUnits = 0;
    let damageUnits = 0;
    let movementsLast30 = 0;

    products.forEach((product) => {
      const name = product.category?.trim() || "Uncategorized";
      const category = categoryMap.get(name) ?? { name, skus: 0, units: 0, value: 0 };
      const units = Math.max(product.currentStock ?? 0, 0);
      category.skus += 1;
      category.units += units;
      category.value += units * Math.max(product.salePrice ?? 0, 0);
      categoryMap.set(name, category);
    });

    movements.forEach((movement) => {
      const quantity = movement.quantity;
      const absoluteQuantity = Math.abs(quantity);
      const transfer = movementIsTransfer(movement.type);
      const isIn = quantity > 0;
      const time = timestamp(movement.createdAtUtc);
      const month = monthBuckets.get(monthKey(new Date(time)));
      if (time > 0 && nowMs - time <= 30 * DAY) movementsLast30 += 1;

      if (transfer) {
        transferUnits += absoluteQuantity;
        if (month) {
          if (isIn) month.transferIn += absoluteQuantity;
          else month.transferOut += absoluteQuantity;
        }
      } else if (isIn) {
        stockIn += absoluteQuantity;
        if (month) month.stockIn += absoluteQuantity;
      } else {
        stockOut += absoluteQuantity;
        if (month) month.stockOut += absoluteQuantity;
        if (movement.type.toLowerCase().includes("damage")) damageUnits += absoluteQuantity;
      }
      if (month) month.events += 1;

      const type = typeMap.get(movement.type) ?? { name: movement.type, quantity: 0, events: 0 };
      type.quantity += absoluteQuantity;
      type.events += 1;
      typeMap.set(movement.type, type);

      const product = productMap.get(movement.productId) ?? {
        id: movement.productId,
        name: movement.productName,
        units: 0,
        events: 0,
      };
      product.units += absoluteQuantity;
      product.events += 1;
      productMap.set(movement.productId, product);
    });

    const typeStats = [...typeMap.values()].sort((left, right) => right.quantity - left.quantity);
    const categories = [...categoryMap.values()].sort((left, right) => right.value - left.value);
    const topProducts = [...productMap.values()].sort((left, right) => right.units - left.units).slice(0, 8);
    const recentMovements = [...movements]
      .sort((left, right) => timestamp(right.createdAtUtc) - timestamp(left.createdAtUtc))
      .slice(0, 10);
    const newProductsLast30 = products.filter((product) =>
      product.createdAtUtc && nowMs - timestamp(product.createdAtUtc) <= 30 * DAY,
    ).length;

    return {
      stockUnits,
      stockValue,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      healthyStock,
      monthly,
      categories,
      typeStats,
      topProducts,
      recentMovements,
      stockIn,
      stockOut,
      transferUnits,
      damageUnits,
      movementsLast30,
      newProductsLast30,
    };
  }, [movements, products]);

  const otherCategoryValue = Math.max(report.stockValue - report.categories.slice(0, 5).reduce((sum, item) => sum + item.value, 0), 0);
  const categorySlices = [
    ...report.categories.slice(0, 5).map((category, index) => ({
      label: category.name,
      value: category.value,
      color: [COLORS.green, COLORS.blue, COLORS.amber, COLORS.purple, COLORS.red][index],
    })),
    ...(otherCategoryValue > 0 ? [{ label: "Other", value: otherCategoryValue, color: COLORS.slate }] : []),
  ];
  const stockListRoute = "/inventory/list" as Href;
  const openProduct = (id: string) => router.push({ pathname: "/inventory/view", params: { id } } as Href);

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Inventory Report</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          void load();
        }} />}
      >
        <View>
          <Text style={styles.eyebrow}>Inventory analytics</Text>
          <Text style={styles.title}>Inventory overview</Text>
          <Text style={styles.subtitle}>
            {count(products.length)} SKUs · current stock and movements for the selected shop when active
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi label="Stock on hand" value={count(report.stockUnits)} caption="Units across all products" icon={Boxes} tone="green" />
          <Kpi label="Stock value" value={money(report.stockValue)} caption="At current sale price" icon={Wallet} tone="blue" />
          <Kpi label="Active products" value={count(report.activeProducts)} caption={`${count(products.length - report.activeProducts)} inactive`} icon={Package} tone="green" />
          <Kpi label="Low stock SKUs" value={count(report.lowStockProducts.length)} caption="At or below minimum" icon={AlertTriangle} tone={report.lowStockProducts.length > 0 ? "amber" : "green"} />
          <Kpi label="Out of stock" value={count(report.outOfStockProducts.length)} caption="SKUs at zero" icon={AlertTriangle} tone={report.outOfStockProducts.length > 0 ? "red" : "green"} />
          <Kpi label="Stock in" value={count(report.stockIn)} caption="Units in movement history" icon={TrendingUp} tone="green" />
          <Kpi label="Stock out" value={count(report.stockOut)} caption="Units out, excluding transfers" icon={TrendingDown} tone="amber" />
          <Kpi label="Transfer movement" value={count(report.transferUnits)} caption="Units moved between shops" icon={Repeat} tone="blue" />
          <Kpi label="Damage recorded" value={count(report.damageUnits)} caption="Units written off" icon={AlertTriangle} tone={report.damageUnits > 0 ? "red" : "green"} />
          <Kpi label="Events · 30 days" value={count(report.movementsLast30)} caption={`${count(report.newProductsLast30)} new SKUs`} icon={CalendarDays} tone="blue" />
        </View>

        <Section title="Stock movement trend" subtitle="Last 12 months · units in vs out, excluding transfers">
          <LineChart
            labels={report.monthly.map((month) => month.label)}
            series={[
              { name: "Stock in", color: COLORS.green, values: report.monthly.map((month) => month.stockIn) },
              { name: "Stock out", color: COLORS.amber, values: report.monthly.map((month) => month.stockOut) },
            ]}
          />
        </Section>

        <Section title="Movement events" subtitle="Recorded movement count by month">
          <BarChart
            data={report.monthly.map((month) => ({ label: month.label, values: [month.events] }))}
            series={[{ name: "Movement events", color: COLORS.blue }]}
            height={160}
          />
        </Section>

        <Section title="Stock health" subtitle="Current SKU availability">
          <DonutChart
            centerLabel="Products"
            centerValue={count(products.length)}
            slices={[
              { label: "Healthy", value: report.healthyStock, color: COLORS.green },
              { label: "Low stock", value: report.lowStockProducts.length, color: COLORS.amber },
              { label: "Out of stock", value: report.outOfStockProducts.length, color: COLORS.red },
            ]}
            formatValue={count}
          />
        </Section>

        <Section title="Inventory value by category" subtitle="Current stock × current sale price">
          <DonutChart
            centerLabel="Stock value"
            centerValue={compactNumber(report.stockValue)}
            slices={categorySlices}
            formatValue={money}
          />
        </Section>

        <Section title="Movement type" subtitle="Units represented by recorded event type">
          <RankedBars
            items={report.typeStats.slice(0, 8).map((type) => ({
              label: type.name,
              value: type.quantity,
              caption: `${count(type.events)} events`,
            }))}
            color={COLORS.purple}
            formatValue={count}
            emptyText="No stock movements recorded."
          />
        </Section>

        <Section title="Products with most movement" subtitle="Absolute units moved">
          <RankedBars
            items={report.topProducts.map((product) => ({
              label: product.name,
              value: product.units,
              caption: `${count(product.events)} events`,
            }))}
            color={COLORS.blue}
            formatValue={count}
            emptyText="No stock movements recorded."
          />
        </Section>

        <Section title="Reorder attention" subtitle="Out-of-stock or at/below minimum" onViewAll={() => router.push(stockListRoute)}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Product</Text>
              <Text style={[styles.th, styles.tdSmall]}>Stock</Text>
              <Text style={[styles.th, styles.tdNum]}>Minimum</Text>
            </View>
            {report.outOfStockProducts.concat(report.lowStockProducts).slice(0, 8).map((product) => (
              <Pressable key={product.id} style={styles.tableRow} onPress={() => openProduct(product.id)}>
                <View style={styles.tdWide}>
                  <Text style={styles.td} numberOfLines={1}>{product.name}</Text>
                  <Text style={styles.tdSub} numberOfLines={1}>{product.category || "Uncategorized"}</Text>
                </View>
                <Text style={[styles.td, styles.tdSmall, styles.amber]}>{count(product.currentStock ?? 0)}</Text>
                <Text style={[styles.td, styles.tdNum]}>{count(product.minimumStock ?? 0)}</Text>
              </Pressable>
            ))}
            {report.outOfStockProducts.length + report.lowStockProducts.length === 0 ? (
              <Text style={styles.empty}>All products are above minimum stock.</Text>
            ) : null}
          </View>
        </Section>

        <Section title="Recent stock movements" subtitle="Latest selected-shop events">
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.tdWide]}>Product</Text>
              <Text style={[styles.th, styles.tdSmall]}>Type</Text>
              <Text style={[styles.th, styles.tdNum]}>Qty</Text>
              <Text style={[styles.th, styles.tdNum]}>Date</Text>
            </View>
            {report.recentMovements.map((movement) => (
              <Pressable key={movement.id} style={styles.tableRow} onPress={() => openProduct(movement.productId)}>
                <View style={styles.tdWide}>
                  <Text style={styles.td} numberOfLines={1}>{movement.productName}</Text>
                  <Text style={styles.tdSub} numberOfLines={1}>{movement.shopName}</Text>
                </View>
                <Text style={[styles.td, styles.tdSmall]} numberOfLines={1}>{movement.type}</Text>
                <Text style={[styles.td, styles.tdNum, movement.quantity < 0 ? styles.red : styles.green]}>
                  {movement.quantity > 0 ? "+" : ""}{count(movement.quantity)}
                </Text>
                <Text style={[styles.td, styles.tdNum]} numberOfLines={1}>
                  {new Date(timestamp(movement.createdAtUtc)).toLocaleDateString()}
                </Text>
              </Pressable>
            ))}
            {report.recentMovements.length === 0 ? <Text style={styles.empty}>No stock movements recorded.</Text> : null}
          </View>
        </Section>
      </ScrollView>
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
  tdSmall: { flex: 1, textAlign: "right" },
  tdNum: { flex: 1.1, textAlign: "right" },
  amber: { color: COLORS.amber, fontWeight: "700" },
  green: { color: COLORS.green, fontWeight: "700" },
  red: { color: COLORS.red, fontWeight: "700" },
  empty: { padding: 14, textAlign: "center", fontSize: 12, color: COLORS.muted },
});