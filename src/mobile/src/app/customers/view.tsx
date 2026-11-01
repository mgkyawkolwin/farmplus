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
import { ChevronLeft, Mail, MapPin, Pencil, Phone } from "lucide-react-native";
import { useColorScheme } from 'nativewind';
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import UnauthorizedView from "@/components/unauthorized-view";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { container, DI_TOKENS } from "@/di";
import { CustomerItem } from "@/models/customer";
import { ICustomerService } from "@/services/customerService";
import SnackBar from "@/components/ui/snack-bar";
import { usePagePermission } from "@/lib/usePagePermission";
import { THEME } from '@/lib/theme';

const customerService = container.resolve<ICustomerService>(
  DI_TOKENS.ICustomerService,
);

export default function CustomerViewScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const permissionState = usePagePermission('/customers/view');
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
      if (permissionState !== 'authorized') return undefined;
      void loadCustomer();
      return undefined;
    }, [loadCustomer]),
  );

  if (permissionState !== 'authorized' || !customer) {
    return (
      <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
        <StatusBar />
        <View style={[styles.headerBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>Customer</Text>
          <View style={styles.headerButton} />
        </View>
        {permissionState === 'denied' ? (
          <UnauthorizedView />
        ) : (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text className="text-muted-foreground" style={styles.stateText}>
              {permissionState === 'checking' ? 'Checking permission...' : 'Loading customer...'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
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
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>Customer</Text>
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
        <View style={[styles.profilePanel, { backgroundColor: theme.card, borderColor: theme.border, borderTopColor: theme.primary }]}>
          <View style={[styles.avatarWrap, { backgroundColor: theme.secondary }]}>
            {customer.profilePictureUrl ? (
              <Image
                source={{ uri: customer.profilePictureUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={[styles.avatarInitial, { color: theme.primary }]}>{initial}</Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.customerName, { color: theme.foreground }]} numberOfLines={1}>
              {customer.name}
            </Text>
            <Text style={[styles.customerSince, { color: theme.mutedForeground }]}>
              Customer since {createdAtText}
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
                  { color: customer.isActive ? theme.chart2 : theme.destructive },
                ]}
              >
                {customer.isActive ? "ACTIVE" : "INACTIVE"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Contact</Text>
        <View style={[styles.panel, { borderColor: theme.border, backgroundColor: theme.card }]}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.contactRow,
                index < detailRows.length - 1 ? [styles.rowDivider, { borderBottomColor: theme.border }] : null,
              ]}
            >
              <View style={[styles.contactIconWrap, { backgroundColor: theme.muted }]}>
                <Icon
                  className="text-muted-foreground"
                  as={row.icon}
                  size={16}
                />
              </View>
              <View style={styles.contactText}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.fieldValue, { color: theme.foreground }]} numberOfLines={1}>
                  {row.value}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={row.label}
                onPress={row.action}
                style={[styles.actionButton, { borderColor: theme.border, backgroundColor: theme.card }]}
              >
                <Icon className="text-foreground" as={row.icon} size={14} />
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Summary</Text>
        <View style={styles.kpiGrid}>
          <KpiTile
            label="Total Sales"
            value={formatMoney(customer.totalSales)}
            accent={{ borderTopColor: theme.chart1, backgroundColor: theme.secondary }}
            theme={theme}
          />
          <KpiTile
            label="Total Orders"
            value={(customer.totalOrders ?? 0).toLocaleString("en-US")}
            accent={{ borderTopColor: theme.mutedForeground, backgroundColor: theme.secondary }}
            theme={theme}
          />
          <KpiTile
            label="Total Paid"
            value={formatMoney(customer.totalPaid)}
            accent={{ borderTopColor: theme.chart2, backgroundColor: theme.secondary }}
            theme={theme}
          />
          <KpiTile
            label="Outstanding"
            value={formatMoney(customer.totalOutstanding)}
            accent={{ borderTopColor: owesBalance ? theme.chart4 : theme.chart2, backgroundColor: theme.secondary }}
            valueStyle={owesBalance ? { color: theme.chart4 } : undefined}
            theme={theme}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Recent Sales</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/customers/sales",
                params: { customerId: customer.id },
              })
            }
          >
            <Text style={[styles.viewAllText, { color: theme.primary }]}>View all</Text>
          </Pressable>
        </View>
        <View style={[styles.table, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderBottomColor: theme.border }]}>
            <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>Total</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>Balance</Text>
          </View>
          {recentSales.map((sale) => (
            <Pressable
              key={sale.id}
              accessibilityRole="button"
              style={[styles.tableRow, { borderBottomColor: theme.border }]}
              onPress={() =>
                router.push({
                  pathname: "/sales/view",
                  params: { id: sale.id },
                })
              }
            >
              <Text style={[styles.cell, styles.dateCol, { color: theme.foreground }]}>
                {new Date(sale.saleDate).toLocaleDateString()}
              </Text>
              <Text style={[styles.cell, styles.amountCol, { color: theme.foreground }]}>
                {formatMoney(sale.netTotal)}
              </Text>
              <Text style={[styles.cell, styles.amountCol, { color: sale.balance > 0 ? theme.chart4 : theme.foreground }]}>
                {formatMoney(sale.balance)}
              </Text>
            </Pressable>
          ))}
          {recentSales.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>No sales recorded.</Text>
          ) : null}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Recent Payments</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/customers/payments",
                params: { customerId: customer.id },
              })
            }
          >
            <Text style={[styles.viewAllText, { color: theme.primary }]}>View all</Text>
          </Pressable>
        </View>
        <View style={[styles.table, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderBottomColor: theme.border }]}>
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
              style={[styles.tableRow, { borderBottomColor: theme.border }]}
              onPress={() =>
                router.push({
                  pathname: "/sales/view",
                  params: { id: payment.saleId },
                })
              }
            >
              <Text style={[styles.cell, styles.dateCol, { color: theme.foreground }]}>
                {new Date(payment.paidAt).toLocaleDateString()}
              </Text>
              <Text style={[styles.cell, styles.amountCol, { color: theme.foreground }]}>
                {formatMoney(payment.amount)}
              </Text>
              <Text style={[styles.cell, styles.amountCol, { color: theme.foreground }]}>
                {formatMoney(payment.balanceAfter)}
              </Text>
            </Pressable>
          ))}
          {recentPayments.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>No payments recorded.</Text>
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
  theme: typeof THEME.light;
  valueStyle?: StyleProp<TextStyle>;
};

function KpiTile({ label, value, accent, theme, valueStyle }: KpiTileProps) {
  return (
    <View style={[styles.kpiTile, accent]}>
      <Text style={[styles.kpiLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: theme.foreground }, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  stateText: { marginTop: 8, textAlign: "center" },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  headerButton: { minWidth: 40 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  profilePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderTopWidth: 3,
    borderRadius: 6,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: { fontSize: 22, fontWeight: "800" },
  profileInfo: { flex: 1, minWidth: 0, gap: 3 },
  customerName: { fontSize: 18, fontWeight: "800" },
  customerSince: { fontSize: 12 },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAllText: { fontSize: 12, fontWeight: "700" },
  panel: {
    borderWidth: 1,
    borderRadius: 6,
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
  },
  contactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: { flex: 1, minWidth: 0, gap: 2 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fieldValue: { fontSize: 14, fontWeight: "600" },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  kpiLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  kpiValue: { fontSize: 15, fontWeight: "800" },
  table: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: { fontSize: 12 },
  cellAmber: { fontWeight: "700" },
  dateCol: { flex: 1.2 },
  amountCol: { flex: 1, textAlign: "right" },
  emptyText: {
    padding: 14,
    textAlign: "center",
    fontSize: 12,
  },
});
