import * as React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { ChevronLeft, Mail, MapPin, Pencil, Phone } from "lucide-react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Supplier } from "@/models/supplier";
import { SupplierServiceClient } from "@/services/supplierService";
import SnackBar from "@/components/ui/snack-bar";

const COLORS = {
  ink: "#0F172A",
  muted: "#64748B",
  border: "#D9DEE5",
  rowBorder: "#CBD5E1",
  green: "#16794B",
  greenTint: "#F4FAF6",
};

function money(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} MMK`;
}

export default function SupplierViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const service = React.useMemo(() => new SupplierServiceClient(), []);
  const [supplier, setSupplier] = React.useState<Supplier>();
  const [loading, setLoading] = React.useState(true);

  const loadSupplier = React.useCallback(async () => {
    if (!id) return router.back();
    try {
      setLoading(true);
      setSupplier(await service.getSupplierById(id));
    } catch {
      SnackBar.Error("Failed to load supplier details.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router, service]);

  useFocusEffect(
    React.useCallback(() => {
      void loadSupplier();
      return undefined;
    }, [loadSupplier]),
  );

  if (loading || !supplier) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.green} />
        </View>
      </SafeAreaView>
    );
  }

  const location = [
    supplier.address,
    supplier.city,
    supplier.stateDivision,
    supplier.country,
  ]
    .filter(Boolean)
    .join(", ");
  const detailRows = [
    { icon: Phone, label: "Phone", value: supplier.phoneNumber || "-" },
    { icon: Mail, label: "Email", value: supplier.email || "-" },
    { icon: MapPin, label: "Address", value: location || "-" },
  ];
  const initial = supplier.supplierName?.charAt(0).toUpperCase() || "S";
  const subtitle =
    [supplier.city, supplier.country].filter(Boolean).join(", ") || "Supplier";
  const purchases = supplier.recentPurchases ?? [];

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
        <Text style={styles.headerTitle}>Supplier</Text>
        <Button
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: "/suppliers/edit",
              params: { id: supplier.id },
            })
          }
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Pencil} size={18} />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profilePanel}>
          <View style={styles.logoWrap}>
            {supplier.logoUrl ? (
              <Image
                source={{ uri: supplier.logoUrl }}
                style={styles.logoImage}
              />
            ) : (
              <Text style={styles.logoInitial}>{initial}</Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.supplierName} numberOfLines={1}>
              {supplier.supplierName}
            </Text>
            <Text style={styles.supplierMeta} numberOfLines={1}>
              {subtitle}
            </Text>
            <View
              style={[
                styles.statusPill,
                supplier.isActive
                  ? styles.statusPillActive
                  : styles.statusPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  supplier.isActive
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {supplier.isActive ? "ACTIVE" : "INACTIVE"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Contact & Location</Text>
        <View style={styles.panel}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                index < detailRows.length - 1 ? styles.rowDivider : null,
              ]}
            >
              <View style={styles.detailIconWrap}>
                <Icon
                  className="text-muted-foreground"
                  as={row.icon}
                  size={16}
                />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.fieldLabel}>{row.label}</Text>
                <Text style={styles.fieldValue} numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionHeading}>Recent Purchases</Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() =>
              router.push({
                pathname: "/suppliers/purchases",
                params: { supplierId: supplier.id },
              })
            }
          >
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.panel}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colDate]}>Date</Text>
            <Text style={[styles.headerCell, styles.colNumber]}>Items</Text>
            <Text style={[styles.headerCell, styles.colAmount]}>Total</Text>
          </View>
          {purchases.map((purchase, index) => (
            <Pressable
              key={purchase.id}
              style={[
                styles.tableRow,
                index < purchases.length - 1 ? styles.rowDivider : null,
              ]}
              onPress={() =>
                router.push({
                  pathname: "/purchases/view",
                  params: { id: purchase.id },
                })
              }
            >
              <Text style={[styles.cellText, styles.colDate]}>
                {new Date(purchase.purchaseDate).toLocaleDateString()}
              </Text>
              <Text style={[styles.cellText, styles.colNumber]}>
                {purchase.totalProducts}
              </Text>
              <Text style={[styles.cellText, styles.colAmount]}>
                {money(purchase.netTotal)}
              </Text>
            </Pressable>
          ))}
          {purchases.length === 0 ? (
            <Text style={styles.emptyText}>No purchases recorded.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: { minWidth: 40 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.ink,
  },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  profilePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: COLORS.border,
    borderTopColor: COLORS.green,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greenTint,
  },
  logoImage: { width: "100%", height: "100%" },
  logoInitial: { fontSize: 22, fontWeight: "800", color: COLORS.green },
  profileInfo: { flex: 1, minWidth: 0, gap: 3 },
  supplierName: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  supplierMeta: { fontSize: 12, color: COLORS.muted },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillActive: { backgroundColor: "#D1FAE5" },
  statusPillInactive: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  statusTextActive: { color: "#047857" },
  statusTextInactive: { color: "#B91C1C" },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAll: { fontSize: 12, fontWeight: "700", color: COLORS.green },
  panel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.rowBorder,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  detailText: { flex: 1, minWidth: 0, gap: 2 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  fieldValue: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cellText: { fontSize: 13, fontWeight: "600", color: COLORS.ink },
  colDate: { flex: 1.2 },
  colNumber: { flex: 0.8, textAlign: "right" },
  colAmount: { flex: 1.2, textAlign: "right" },
  emptyText: {
    padding: 16,
    textAlign: "center",
    fontSize: 13,
    color: COLORS.muted,
  },
});
