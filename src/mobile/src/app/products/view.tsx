"use client";

import * as React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { ChevronLeft, Pencil } from "lucide-react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

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

const productService = container.resolve<IProductService>(
  DI_TOKENS.IProductService,
);

const COLORS = {
  ink: "#0F172A",
  muted: "#64748B",
  border: "#D9DEE5",
  green: "#16794B",
  greenTint: "#F4FAF6",
  amber: "#9A6700",
};

type SummaryTileProps = {
  label: string;
  value: string;
  accent: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
};

function SummaryTile({ label, value, accent, valueStyle }: SummaryTileProps) {
  return (
    <View style={[styles.kpiTile, accent]}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function ProductViewScreen() {
  const router = useRouter();
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
      <SafeAreaView style={styles.page}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.headerBar}>
          <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text style={styles.headerTitle}>Product</Text>
          <View style={styles.headerButton} />
        </View>
        {permissionState === 'denied' ? <UnauthorizedView /> : (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.loadingText}>{permissionState === 'checking' ? 'Checking permission...' : 'Loading product...'}</Text>
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
    <SafeAreaView style={styles.page}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <View style={styles.headerBar}>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text style={styles.headerTitle}>Product</Text>
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
        <View style={styles.profilePanel}>
          <View style={styles.profileRow}>
            {product.coverImageUrl ? (
              <Image
                source={{ uri: product.coverImageUrl }}
                style={styles.thumbImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Text style={styles.thumbInitial}>
                  {product.name?.charAt(0)?.toUpperCase() || "P"}
                </Text>
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.productMeta} numberOfLines={1}>
                {subtitle}
              </Text>
              <View
                style={[
                  styles.statusPill,
                  isActive ? styles.statusActive : styles.statusInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isActive
                      ? styles.statusTextActive
                      : styles.statusTextInactive,
                  ]}
                >
                  {isActive ? "ACTIVE" : "INACTIVE"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Details</Text>
        <View style={styles.panel}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                index < detailRows.length - 1 ? styles.rowDivider : null,
              ]}
            >
              <Text style={styles.detailLabel}>{row.label}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeading}>Description</Text>
        <View style={styles.panel}>
          <Text style={styles.descriptionText}>
            {product.description || "No description provided"}
          </Text>
        </View>

        <Text style={styles.sectionHeading}>Inventory</Text>
        <View style={styles.kpiPanel}>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>Sale Price</Text>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {product.salePrice != null ? `${product.salePrice} MMK` : "0 MMK"}
            </Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>Current Stock</Text>
            <Text
              style={[
                styles.kpiValue,
                isLowStock ? styles.kpiValueWarning : null,
              ]}
            >
              {product.currentStock ?? 0}
            </Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabel}>Minimum Stock</Text>
            <Text style={styles.kpiValue}>{product.minimumStock ?? 0}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Summary</Text>
        <View style={styles.kpiGrid}>
          <SummaryTile
            label="Total Revenue"
            value={formatMoney(product.totalRevenue)}
            accent={styles.accentBlue}
          />
          <SummaryTile
            label="Total Orders"
            value={(product.totalOrders ?? 0).toLocaleString("en-US")}
            accent={styles.accentSlate}
          />
          <SummaryTile
            label="Units Sold"
            value={(product.totalQuantitySold ?? 0).toLocaleString("en-US")}
            accent={styles.accentGreen}
          />
          <SummaryTile
            label="Current Stock"
            value={(product.currentStock ?? 0).toLocaleString("en-US")}
            accent={isLowStock ? styles.accentAmber : styles.accentGreen}
            valueStyle={isLowStock ? styles.kpiValueWarning : null}
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
    backgroundColor: "#FFFFFF",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    color: COLORS.ink,
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
    color: COLORS.muted,
  },
  profilePanel: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 3,
    borderTopColor: COLORS.green,
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
    borderColor: COLORS.border,
    backgroundColor: "#F1F5F9",
  },
  thumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.greenTint,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbInitial: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.green,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
  },
  productMeta: {
    fontSize: 13,
    color: COLORS.muted,
  },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: "#D1FAE5",
  },
  statusInactive: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: "#047857",
  },
  statusTextInactive: {
    color: "#B91C1C",
  },
  sectionHeading: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.muted,
  },
  detailValue: {
    flexShrink: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.ink,
    textAlign: "right",
  },
  descriptionText: {
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink,
  },
  kpiPanel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.border,
  },
  kpiLabel: {
    marginBottom: 4,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: "center",
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
  },
  kpiValueWarning: {
    color: COLORS.amber,
  },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiTile: {
    width: "48%",
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: COLORS.muted,
    textAlign: "left",
  },
  tileValue: { fontSize: 15, fontWeight: "800", color: COLORS.ink },
  accentBlue: { borderTopColor: "#2367A8", backgroundColor: "#F5F9FF" },
  accentGreen: {
    borderTopColor: COLORS.green,
    backgroundColor: COLORS.greenTint,
  },
  accentAmber: { borderTopColor: COLORS.amber, backgroundColor: "#FFFBEB" },
  accentSlate: { borderTopColor: COLORS.muted, backgroundColor: "#F8FAFC" },
});
