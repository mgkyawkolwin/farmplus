"use client";

import * as React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ChevronLeft,
  TriangleAlert,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { container, DI_TOKENS } from "@/di";
import { IProductService, StockMovement } from "@/services/productService";
import { ProductItem } from "@/models/product";
import SnackBar from "@/components/ui/snack-bar";
import Gallery from "@/components/gallery";
import { usePagePermission } from "@/lib/usePagePermission";

const productService = container.resolve<IProductService>(
  DI_TOKENS.IProductService,
);
const PAGE_SIZE = 20;

const COLORS = {
  ink: "#0F172A",
  muted: "#64748B",
  border: "#D9DEE5",
  green: "#16794B",
  greenTint: "#F4FAF6",
  amber: "#9A6700",
  blue: "#2367A8",
  red: "#B42318",
};

function MovementSeparator() {
  return <View style={styles.rowDivider} />;
}

export default function InventoryProductViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const permissionState = usePagePermission('/inventory/view');
  const [product, setProduct] = React.useState<ProductItem | null>(null);
  const [movements, setMovements] = React.useState<StockMovement[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [movementType, setMovementType] = React.useState<
    "stock-in" | "stock-out" | "damage" | null
  >(null);
  const [quantity, setQuantity] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(
    async (reset: boolean) => {
      if (!id) return;
      try {
        const nextPage = reset ? 1 : page;
        const [nextProduct, result] = await Promise.all([
          reset ? productService.getProductById(id) : Promise.resolve(product),
          productService.getStockMovements(id, nextPage, PAGE_SIZE),
        ]);
        if (nextProduct) setProduct(nextProduct);
        setMovements((current) =>
          reset ? result.items : [...current, ...result.items],
        );
        setPage(nextPage + 1);
        setHasMore(result.items.length === PAGE_SIZE);
      } catch (error) {
        SnackBar.Error(
          error instanceof Error
            ? error.message
            : "Unable to load stock details.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [id, page, product],
  );

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void load(true);
      return undefined;
    }, [id, permissionState]),
  );
  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      void load(false);
    }
  };
  const saveMovement = async () => {
    if (permissionState !== 'authorized') return;
    const amount = Number(quantity);
    if (!id || !movementType || !Number.isInteger(amount) || amount <= 0) {
      SnackBar.Error("Enter a positive whole quantity.");
      return;
    }
    setSaving(true);
    try {
      await productService.adjustStock(
        id,
        movementType,
        amount,
        remark.trim() || undefined,
      );
      setMovementType(null);
      setQuantity("");
      setRemark("");
      setRefreshing(true);
      await load(true);
      SnackBar.Success("Stock updated successfully.");
    } catch (error) {
      SnackBar.Error(
        error instanceof Error ? error.message : "Unable to update stock.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (permissionState !== 'authorized' || !product)
    return (
      <SafeAreaView style={styles.page}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.headerBar}>
          <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text style={styles.headerTitle}>Inventory</Text>
          <View style={styles.headerButton} />
        </View>
        {permissionState === 'denied' ? <UnauthorizedView /> : (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.loadingText}>
              {permissionState === 'checking' ? 'Checking permission...' : 'Loading stock...'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    );

  const otherImages = (product.medias ?? [])
    .map((media) => media.url)
    .filter((url): url is string =>
      Boolean(url && url !== product.coverImageUrl),
    );
  const unitSuffix = product.unit ? ` ${product.unit}` : "";
  const isLowStock = (product.currentStock ?? 0) < (product.minimumStock ?? 0);
  const modalTitle =
    movementType === "stock-in"
      ? "Stock In"
      : movementType === "stock-out"
        ? "Stock Out"
        : "Damage";

  const stockActions = [
    {
      label: "Stock In",
      icon: ArrowDownToLine,
      color: COLORS.green,
      iconWrapStyle: styles.iconWrapGreen,
      onPress: () => setMovementType("stock-in"),
    },
    {
      label: "Stock Out",
      icon: ArrowUpFromLine,
      color: COLORS.amber,
      iconWrapStyle: styles.iconWrapAmber,
      onPress: () => setMovementType("stock-out"),
    },
    {
      label: "Transfer",
      icon: ArrowLeftRight,
      color: COLORS.blue,
      iconWrapStyle: styles.iconWrapBlue,
      onPress: () =>
        router.push({
          pathname: "/products/transfer",
          params: { id },
        }),
    },
    {
      label: "Damage",
      icon: TriangleAlert,
      color: COLORS.red,
      iconWrapStyle: styles.iconWrapRed,
      onPress: () => setMovementType("damage"),
    },
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          Inventory
        </Text>
        <View style={styles.headerButton} />
      </View>

      <FlatList
        data={movements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
            tintColor={COLORS.green}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ItemSeparatorComponent={MovementSeparator}
        ListHeaderComponent={
          <>
            <View style={styles.headerSection}>
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
                        {product.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productMeta} numberOfLines={1}>
                      {product.category || "Uncategorized"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.kpiPanel}>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>Current Stock</Text>
                  <Text
                    style={[
                      styles.kpiValue,
                      isLowStock ? styles.kpiValueWarning : null,
                    ]}
                    numberOfLines={1}
                  >
                    {`${product.currentStock ?? 0}${unitSuffix}`}
                  </Text>
                </View>
                <View style={styles.kpiDivider} />
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>Minimum Stock</Text>
                  <Text style={styles.kpiValue} numberOfLines={1}>
                    {`${product.minimumStock ?? 0}${unitSuffix}`}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionHeading}>Description</Text>
              <View style={styles.panel}>
                <Text style={styles.descriptionText}>
                  {product.description || "No description provided."}
                </Text>
              </View>

              <View style={styles.actionPanel}>
                {stockActions.map((action, index) => (
                  <React.Fragment key={action.label}>
                    {index > 0 ? <View style={styles.actionDivider} /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={action.label}
                      style={styles.actionCell}
                      onPress={action.onPress}
                    >
                      <View style={action.iconWrapStyle}>
                        <action.icon size={18} color={action.color} />
                      </View>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </Pressable>
                  </React.Fragment>
                ))}
              </View>

              <Gallery images={otherImages} title="Product Images" />
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.headerInfo]}>
                Stock Movements
              </Text>
              <Text style={[styles.headerCell, styles.amountColumn]}>
                Quantity
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.movementRow}>
            <View style={styles.movementInfo}>
              <Text style={styles.movementType}>{item.type}</Text>
              <Text style={styles.movementRemark} numberOfLines={1}>
                {item.remark || "No remark"}
              </Text>
            </View>
            <View style={styles.amountColumn}>
              <Text
                style={[
                  styles.quantity,
                  item.quantity < 0 ? styles.quantityOut : null,
                ]}
              >
                {item.quantity > 0 ? "+" : ""}
                {item.quantity}
              </Text>
              <Text style={styles.movementDate}>
                {new Date(item.createdAtUtc).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreRow}>
              <ActivityIndicator size="small" color={COLORS.green} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No stock movements yet.</Text>
          </View>
        }
      />

      <Modal
        transparent
        visible={movementType !== null}
        animationType="slide"
        onRequestClose={() => setMovementType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Label className="text-foreground">Quantity</Label>
            <Input
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              placeholder="0"
              editable={!saving}
            />
            <Label className="text-foreground">Remark</Label>
            <Input
              value={remark}
              onChangeText={setRemark}
              placeholder="Optional remark"
              editable={!saving}
            />
            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={() => setMovementType(null)}
                disabled={saving}
              >
                <Text className="text-foreground">Cancel</Text>
              </Button>
              <Button onPress={saveMovement} disabled={saving}>
                <Text className="text-background">Save</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.muted,
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
    width: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  headerSection: {
    padding: 16,
    gap: 12,
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
  sectionHeading: {
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
  },
  descriptionText: {
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.ink,
  },
  actionPanel: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  actionCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  iconWrapGreen: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F2EC",
  },
  iconWrapAmber: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBF1DC",
  },
  iconWrapBlue: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6EFF8",
  },
  iconWrapRed: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDECEA",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
  },
  tableHeader: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F1F5F9",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerCell: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerInfo: {
    flex: 1,
  },
  movementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  movementInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  movementType: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.ink,
  },
  movementRemark: {
    fontSize: 12,
    color: COLORS.muted,
  },
  amountColumn: {
    width: 96,
    alignItems: "flex-end",
  },
  quantity: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.green,
  },
  quantityOut: {
    color: COLORS.red,
  },
  movementDate: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.muted,
  },
  loadMoreRow: {
    alignItems: "center",
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalSheet: {
    padding: 20,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});
