import * as React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import { ChevronLeft, Mail, MapPin, Pencil, Phone } from "lucide-react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from 'nativewind';

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import { Supplier } from "@/models/supplier";
import { SupplierServiceClient } from "@/services/supplierService";
import SnackBar from "@/components/ui/snack-bar";
import { usePagePermission } from "@/lib/usePagePermission";
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

function money(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} MMK`;
}

export default function SupplierViewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const permissionState = usePagePermission('/suppliers/view');
  const service = React.useMemo(() => new SupplierServiceClient(), []);
  const [supplier, setSupplier] = React.useState<Supplier>();
  const [loading, setLoading] = React.useState(true);

  const loadSupplier = React.useCallback(async () => {
    if (!id) return router.back();
    try {
      setLoading(true);
      setSupplier(await service.getSupplierById(id));
    } catch {
      SnackBar.Error(t('suppliers.messages.detailsFailed'));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router, service, t]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      void loadSupplier();
      return undefined;
    }, [loadSupplier, permissionState]),
  );

  if (permissionState !== 'authorized' || loading || !supplier) {
    return (
      <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
        <View style={[styles.headerBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>{t('suppliers.fields.supplier')}</Text>
          <View style={styles.headerButton} />
        </View>
        {permissionState === 'denied' ? <UnauthorizedView title={t('suppliers.unauthorized.title')} message={t('suppliers.unauthorized.description')} /> : (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground">
            {permissionState === 'checking' ? t('suppliers.dashboard.checkingPermission') : t('suppliers.dashboard.loading')}
          </Text>
        </View>
        )}
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
    { icon: Phone, label: t('suppliers.fields.phone'), value: supplier.phoneNumber || "-" },
    { icon: Mail, label: t('suppliers.fields.email'), value: supplier.email || "-" },
    { icon: MapPin, label: t('suppliers.fields.address'), value: location || "-" },
  ];
  const initial = supplier.supplierName?.charAt(0).toUpperCase() || "S";
  const subtitle =
    [supplier.city, supplier.country].filter(Boolean).join(", ") || t('suppliers.fields.supplier');
  const purchases = supplier.recentPurchases ?? [];

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
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>{t('suppliers.fields.supplier')}</Text>
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
        <View style={[styles.profilePanel, { backgroundColor: theme.card, borderColor: theme.border, borderTopColor: theme.primary }]}>
          <View style={[styles.logoWrap, { backgroundColor: theme.secondary }]}>
            {supplier.logoUrl ? (
              <Image
                source={{ uri: supplier.logoUrl }}
                style={styles.logoImage}
              />
            ) : (
              <Text style={[styles.logoInitial, { color: theme.primary }]}>{initial}</Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.supplierName, { color: theme.foreground }]} numberOfLines={1}>
              {supplier.supplierName}
            </Text>
            <Text style={[styles.supplierMeta, { color: theme.mutedForeground }]} numberOfLines={1}>
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
                  { color: supplier.isActive ? theme.chart2 : theme.destructive },
                ]}
              >
                {supplier.isActive ? t('suppliers.status.active') : t('suppliers.status.inactive')}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>{t('suppliers.sections.contactLocation')}</Text>
        <View style={[styles.panel, { borderColor: theme.border, backgroundColor: theme.card }]}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                index < detailRows.length - 1 ? [styles.rowDivider, { borderBottomColor: theme.border }] : null,
              ]}
            >
              <View style={[styles.detailIconWrap, { backgroundColor: theme.muted }]}>
                <Icon
                  className="text-muted-foreground"
                  as={row.icon}
                  size={16}
                />
              </View>
              <View style={styles.detailText}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.fieldValue, { color: theme.foreground }]} numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>{t('suppliers.sections.recentPurchases')}</Text>
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
            <Text style={[styles.viewAll, { color: theme.primary }]}>{t('suppliers.actions.viewAll')}</Text>
          </Pressable>
        </View>
        <View style={[styles.panel, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderBottomColor: theme.border }]}>
            <Text style={[styles.headerCell, styles.colDate]}>{t('suppliers.fields.date')}</Text>
            <Text style={[styles.headerCell, styles.colNumber]}>{t('suppliers.fields.items')}</Text>
            <Text style={[styles.headerCell, styles.colAmount]}>{t('suppliers.fields.total')}</Text>
          </View>
          {purchases.map((purchase, index) => (
            <Pressable
              key={purchase.id}
              style={[
                styles.tableRow,
                { borderBottomColor: theme.border },
                index < purchases.length - 1 ? styles.rowDivider : null,
              ]}
              onPress={() =>
                router.push({
                  pathname: "/purchases/view",
                  params: { id: purchase.id },
                })
              }
            >
              <Text style={[styles.cellText, styles.colDate, { color: theme.foreground }]}>
                {new Date(purchase.purchaseDate).toLocaleDateString()}
              </Text>
              <Text style={[styles.cellText, styles.colNumber, { color: theme.foreground }]}>
                {purchase.totalProducts}
              </Text>
              <Text style={[styles.cellText, styles.colAmount, { color: theme.foreground }]}>
                {money(purchase.netTotal)}
              </Text>
            </Pressable>
          ))}
          {purchases.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>{t('suppliers.empty.noPurchasesRecorded')}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
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
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  profilePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderTopWidth: 3,
    borderRadius: 6,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: { width: "100%", height: "100%" },
  logoInitial: { fontSize: 22, fontWeight: "800" },
  profileInfo: { flex: 1, minWidth: 0, gap: 3 },
  supplierName: { fontSize: 18, fontWeight: "800" },
  supplierMeta: { fontSize: 12 },
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
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewAll: { fontSize: 12, fontWeight: "700" },
  panel: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: "hidden",
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  },
  detailText: { flex: 1, minWidth: 0, gap: 2 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fieldValue: { fontSize: 14, fontWeight: "600" },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerCell: {
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
  cellText: { fontSize: 13, fontWeight: "600" },
  colDate: { flex: 1.2 },
  colNumber: { flex: 0.8, textAlign: "right" },
  colAmount: { flex: 1.2, textAlign: "right" },
  emptyText: {
    padding: 16,
    textAlign: "center",
    fontSize: 13,
  },
});
