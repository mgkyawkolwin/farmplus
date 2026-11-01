"use client";

import * as React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import { ChevronLeft, Pencil } from "lucide-react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from 'nativewind';

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import { container, DI_TOKENS } from "@/di";
import { usePagePermission } from "@/lib/usePagePermission";
import { ProductItem } from "@/models/product";
import { IProductService } from "@/services/productService";
import SnackBar from "@/components/ui/snack-bar";
import Gallery from "@/components/gallery";
import { THEME } from '@/lib/theme';

const productService = container.resolve<IProductService>(
  DI_TOKENS.IProductService,
);

type SummaryTileProps = {
  label: string;
  value: string;
  accent: StyleProp<ViewStyle>;
  theme: typeof THEME.light;
  valueStyle?: StyleProp<TextStyle>;
};

function SummaryTile({ label, value, accent, theme, valueStyle }: SummaryTileProps) {
  return (
    <View style={[styles.kpiTile, accent]}>
      <Text style={[styles.tileLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <Text style={[styles.tileValue, { color: theme.foreground }, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function ProductViewScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const permissionState = usePagePermission('/products/view');
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [product, setProduct] = React.useState<ProductItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadProduct = React.useCallback(async () => {
    if (!productId) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      const result = await productService.getProductById(productId);
      setProduct(result);
    } catch (error) {
      SnackBar.Error("Failed to load product details");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      void loadProduct();
      return undefined;
    }, [loadProduct, permissionState]),
  );

  const otherImages = React.useMemo(() => {
    if (!product) {
      return [] as string[];
    }

    const urls = (product.medias ?? [])
      .map((media) => media.url)
      .filter((url): url is string => Boolean(url));

    return urls.filter((url) => url !== product.coverImageUrl);
  }, [product]);

  if (permissionState !== 'authorized' || !product) {
    return (
      <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
        <StatusBar />
        <View style={[styles.headerBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>Product</Text>
          <View style={styles.headerButton} />
        </View>
        {permissionState === 'denied' ? <UnauthorizedView /> : (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>{permissionState === 'checking' ? 'Checking permission...' : 'Loading product...'}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const isActive = Boolean(product.isActive);
  const isLowStock = (product.currentStock ?? 0) < (product.minimumStock ?? 0);
  const subtitle =
    [product.category, product.brand].filter(Boolean).join(" · ") ||
    "No category";
  const formatMoney = (amount: number | undefined) =>
    `${(amount ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} MMK`;
  const detailRows = [
    { label: "Brand", value: product.brand || "-" },
    { label: "Category", value: product.category || "-" },
    { label: "Unit", value: product.unit || "-" },
  ];

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
      <StatusBar />

      <View style={[styles.headerBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>Product</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit product"
          onPress={() =>
            router.push({
              pathname: "/products/edit",
              params: { id: product.id },
            })
          }
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Pencil} size={18} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={[styles.profilePanel, { backgroundColor: theme.card, borderColor: theme.border, borderTopColor: theme.primary }]}>
          <View style={styles.profileRow}>
            {product.coverImageUrl ? (
              <Image
                source={{ uri: product.coverImageUrl }}
                style={[styles.thumbImage, { borderColor: theme.border, backgroundColor: theme.muted }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumbPlaceholder, { borderColor: theme.border, backgroundColor: theme.secondary }]}>
                <Text style={[styles.thumbInitial, { color: theme.primary }]}>
                  {product.name?.charAt(0)?.toUpperCase() || "P"}
                </Text>
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={[styles.productName, { color: theme.foreground }]} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={[styles.productMeta, { color: theme.mutedForeground }]} numberOfLines={1}>
                {subtitle}
              </Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: theme.secondary },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: isActive ? theme.chart2 : theme.destructive },
                  ]}
                >
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Details</Text>
        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                index < detailRows.length - 1 ? [styles.rowDivider, { borderBottomColor: theme.border }] : null,
              ]}
            >
              <Text style={[styles.detailLabel, { color: theme.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.detailValue, { color: theme.foreground }]} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Description</Text>
        <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.descriptionText, { color: theme.foreground }]}>
            {product.description || "No description provided"}
          </Text>
        </View>

        <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Inventory</Text>
        <View style={[styles.kpiPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.kpiCell}>
            <Text style={[styles.kpiLabel, { color: theme.mutedForeground }]}>Sale Price</Text>
            <Text style={[styles.kpiValue, { color: theme.foreground }]} numberOfLines={1}>
              {product.salePrice != null ? `${product.salePrice} MMK` : "0 MMK"}
            </Text>
          </View>
          <View style={[styles.kpiDivider, { backgroundColor: theme.border }]} />
          <View style={styles.kpiCell}>
            <Text style={[styles.kpiLabel, { color: theme.mutedForeground }]}>Current Stock</Text>
            <Text
              style={[
                styles.kpiValue,
                { color: isLowStock ? theme.chart4 : theme.foreground },
              ]}
            >
              {product.currentStock ?? 0}
            </Text>
          </View>
          <View style={[styles.kpiDivider, { backgroundColor: theme.border }]} />
          <View style={styles.kpiCell}>
            <Text style={[styles.kpiLabel, { color: theme.mutedForeground }]}>Minimum Stock</Text>
            <Text style={[styles.kpiValue, { color: theme.foreground }]}>{product.minimumStock ?? 0}</Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Summary</Text>
        <View style={styles.kpiGrid}>
          <SummaryTile
            label="Total Revenue"
            value={formatMoney(product.totalRevenue)}
            accent={{ borderTopColor: theme.chart1, backgroundColor: theme.secondary }}
            theme={theme}
          />
          <SummaryTile
            label="Total Orders"
            value={(product.totalOrders ?? 0).toLocaleString("en-US")}
            accent={{ borderTopColor: theme.mutedForeground, backgroundColor: theme.secondary }}
            theme={theme}
          />
          <SummaryTile
            label="Units Sold"
            value={(product.totalQuantitySold ?? 0).toLocaleString("en-US")}
            accent={{ borderTopColor: theme.chart2, backgroundColor: theme.secondary }}
            theme={theme}
          />
          <SummaryTile
            label="Current Stock"
            value={(product.currentStock ?? 0).toLocaleString("en-US")}
            accent={{ borderTopColor: isLowStock ? theme.chart4 : theme.chart2, backgroundColor: theme.secondary }}
            valueStyle={isLowStock ? { color: theme.chart4 } : undefined}
            theme={theme}
          />
        </View>

        {otherImages.length > 0 ? (
          <Gallery images={otherImages} title="Other Images" />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 44,
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  contentContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  profilePanel: {
    borderWidth: 1,
    borderTopWidth: 3,
    borderRadius: 6,
    padding: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  thumbImage: {
    width: 72,
    height: 72,
    borderRadius: 6,
    borderWidth: 1,
  },
  thumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbInitial: {
    fontSize: 24,
    fontWeight: "800",
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
  },
  productMeta: {
    fontSize: 13,
  },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sectionHeading: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    flexShrink: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  descriptionText: {
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  kpiPanel: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  kpiCell: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  kpiDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
  },
  kpiLabel: {
    marginBottom: 4,
    fontSize: 11,
    textAlign: "center",
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiTile: {
    width: "48%",
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderTopWidth: 3,
    borderRadius: 6,
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "left",
  },
  tileValue: { fontSize: 15, fontWeight: "800" },
});
