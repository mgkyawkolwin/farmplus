"use client";

import * as React from "react";
import {
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
import { ChevronLeft, Mail, MapPin, Pencil, Phone } from "lucide-react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { container, DI_TOKENS } from "@/di";
import { CustomerItem } from "@/models/customer";
import { ICustomerService } from "@/services/customerService";
import SnackBar from "@/components/ui/snack-bar";

const customerService = container.resolve<ICustomerService>(
  DI_TOKENS.ICustomerService,
);

export default function CustomerViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [customer, setCustomer] = React.useState<CustomerItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadCustomer = React.useCallback(async () => {
    if (!customerId) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      const result = await customerService.getCustomerById(customerId);
      setCustomer(result);
    } catch (error) {
      SnackBar.Error("Failed to load customer details");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [customerId, router]);

  useFocusEffect(
    React.useCallback(() => {
      void loadCustomer();
      return undefined;
    }, [loadCustomer]),
  );

  if (!customer) {
    return null;
  }

  const createdAt = customer.createdAtUtc
    ? new Date(customer.createdAtUtc)
    : null;
  const createdAtText =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toISOString()
      : "Unknown";
  const formatMoney = (amount: number | undefined) =>
    `${(amount ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} MMK`;

  const detailRows = [
    {
      icon: Phone,
      label: "Phone",
      value: customer.phone || "-",
      action: () => {
        if (customer.phone) {
          SnackBar.Success("Phone action placeholder");
        }
      },
    },
    {
      icon: Mail,
      label: "Email",
      value: customer.email || "-",
      action: () => {
        if (customer.email) {
          SnackBar.Success("Email action placeholder");
        }
      },
    },
    {
      icon: MapPin,
      label: "Address",
      value: customer.address || "-",
      action: () => {
        if (customer.address) {
          SnackBar.Success("Address action placeholder");
        }
      },
    },
  ];

  const initial = customer.name?.charAt(0).toUpperCase() || "C";
  const owesBalance = (customer.totalOutstanding ?? 0) > 0;
  const recentSales = customer.recentSales ?? [];
  const recentPayments = customer.recentPayments ?? [];

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
        <Text style={styles.headerTitle}>Customer</Text>
        <Button
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: "/customers/edit",
              params: { id: customer.id },
            })
          }
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Pencil} size={18} />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profilePanel}>
          <View style={styles.avatarWrap}>
            {customer.profilePictureUrl ? (
              <Image
                source={{ uri: customer.profilePictureUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {customer.name}
            </Text>
            <Text style={styles.customerSince}>
              Customer since {createdAtText}
            </Text>
            <View
              style={[
                styles.statusPill,
                customer.isActive
                  ? styles.statusPillActive
                  : styles.statusPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  customer.isActive
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {customer.isActive ? "ACTIVE" : "INACTIVE"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Contact</Text>
        <View style={styles.panel}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.contactRow,
                index < detailRows.length - 1 ? styles.rowDivider : null,
              ]}
            >
              <View style={styles.contactIconWrap}>
                <Icon
                  className="text-muted-foreground"
                  as={row.icon}
                  size={16}
                />
              </View>
              <View style={styles.contactText}>
                <Text style={styles.fieldLabel}>{row.label}</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>
                  {row.value}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={row.label}
                onPress={row.action}
                style={styles.actionButton}
              >
                <Icon className="text-foreground" as={row.icon} size={14} />
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.sectionHeading}>Summary</Text>
        <View style={styles.kpiGrid}>
          <KpiTile
            label="Total Sales"
            value={formatMoney(customer.totalSales)}
            accent={styles.accentBlue}
          />
          <KpiTile
            label="Total Orders"
            value={(customer.totalOrders ?? 0).toLocaleString("en-US")}
            accent={styles.accentSlate}
          />
          <KpiTile
            label="Total Paid"
            value={formatMoney(customer.totalPaid)}
            accent={styles.accentGreen}
          />
          <KpiTile
            label="Outstanding"
            value={formatMoney(customer.totalOutstanding)}
            accent={owesBalance ? styles.accentAmber : styles.accentGreen}
            valueStyle={owesBalance ? styles.valueAmber : null}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Sales</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/customers/sales",
                params: { customerId: customer.id },
              })
            }
          >
            <Text style={styles.viewAllText}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>Total</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>Balance</Text>
          </View>
          {recentSales.map((sale) => (
            <Pressable
              key={sale.id}
              accessibilityRole="button"
              style={styles.tableRow}
              onPress={() =>
                router.push({
                  pathname: "/sales/view",
                  params: { id: sale.id },
                })
              }
            >
              <Text style={[styles.cell, styles.dateCol]}>
                {new Date(sale.saleDate).toLocaleDateString()}
              </Text>
              <Text style={[styles.cell, styles.amountCol]}>
                {formatMoney(sale.netTotal)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.amountCol,
                  sale.balance > 0 ? styles.cellAmber : null,
                ]}
              >
                {formatMoney(sale.balance)}
              </Text>
            </Pressable>
          ))}
          {recentSales.length === 0 ? (
            <Text style={styles.emptyText}>No sales recorded.</Text>
          ) : null}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Payments</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/customers/payments",
                params: { customerId: customer.id },
              })
            }
          >
            <Text style={styles.viewAllText}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>Amount</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>
              Balance After
            </Text>
          </View>
          {recentPayments.map((payment) => (
            <Pressable
              key={payment.id}
              accessibilityRole="button"
              style={styles.tableRow}
              onPress={() =>
                router.push({
                  pathname: "/sales/view",
                  params: { id: payment.saleId },
                })
              }
            >
              <Text style={[styles.cell, styles.dateCol]}>
                {new Date(payment.paidAt).toLocaleDateString()}
              </Text>
              <Text style={[styles.cell, styles.amountCol]}>
                {formatMoney(payment.amount)}
              </Text>
              <Text style={[styles.cell, styles.amountCol]}>
                {formatMoney(payment.balanceAfter)}
              </Text>
            </Pressable>
          ))}
          {recentPayments.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type KpiTileProps = {
  label: string;
  value: string;
  accent: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
};

function KpiTile({ label, value, accent, valueStyle }: KpiTileProps) {
  return (
    <View style={[styles.kpiTile, accent]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const COLORS = {
  ink: "#0F172A",
  muted: "#64748B",
  border: "#D9DEE5",
  rowBorder: "#CBD5E1",
  green: "#16794B",
  greenTint: "#F4FAF6",
  blue: "#2367A8",
  amber: "#9A6700",
};

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
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greenTint,
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: { fontSize: 22, fontWeight: "800", color: COLORS.green },
  profileInfo: { flex: 1, minWidth: 0, gap: 3 },
  customerName: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  customerSince: { fontSize: 12, color: COLORS.muted },
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAllText: { fontSize: 12, fontWeight: "700", color: COLORS.green },
  panel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.rowBorder,
  },
  contactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  contactText: { flex: 1, minWidth: 0, gap: 2 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  fieldValue: { fontSize: 14, fontWeight: "600", color: COLORS.ink },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
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
  accentBlue: { borderTopColor: COLORS.blue, backgroundColor: "#F5F9FF" },
  accentGreen: {
    borderTopColor: COLORS.green,
    backgroundColor: COLORS.greenTint,
  },
  accentAmber: { borderTopColor: COLORS.amber, backgroundColor: "#FFFBEB" },
  accentSlate: { borderTopColor: COLORS.muted, backgroundColor: "#F8FAFC" },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  kpiValue: { fontSize: 15, fontWeight: "800", color: COLORS.ink },
  valueAmber: { color: COLORS.amber },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
    paddingHorizontal: 12,
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.rowBorder,
  },
  cell: { fontSize: 12, color: COLORS.ink },
  cellAmber: { color: COLORS.amber, fontWeight: "700" },
  dateCol: { flex: 1.2 },
  amountCol: { flex: 1, textAlign: "right" },
  emptyText: {
    padding: 14,
    textAlign: "center",
    fontSize: 12,
    color: COLORS.muted,
  },
});
