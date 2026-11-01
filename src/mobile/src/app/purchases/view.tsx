'use client';

import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Pencil, Trash2 } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import UnauthorizedView from '@/components/unauthorized-view';
import SnackBar from '@/components/ui/snack-bar';
import ShopBanner from '@/components/shopBanner';
import { container, DI_TOKENS } from '@/di';
import { Purchase } from '@/models/purchase';
import { IPurchaseService } from '@/services/purchaseService';
import { usePagePermission } from '@/lib/usePagePermission';
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

const purchaseService = container.resolve<IPurchaseService>(DI_TOKENS.IPurchaseService);
type ThemeColors = typeof THEME.light;

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function ActionButton({ label, icon, onPress, disabled, color, theme }: {
  label: string;
  icon: React.ComponentProps<typeof Icon>['as'];
  onPress: () => void;
  disabled?: boolean;
  color: string;
  theme: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
    >
      <View style={[styles.actionIcon, { backgroundColor: theme.secondary }]}>
        <Icon as={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function SummaryRow({ label, value, strong, theme }: { label: string; value: string; strong?: boolean; theme: ThemeColors }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: strong ? theme.foreground : theme.mutedForeground }, strong && styles.summaryLabelStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.foreground }, strong && styles.summaryValueStrong]}>{value}</Text>
    </View>
  );
}

export default function PurchaseViewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/purchases/view');
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const purchaseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [purchase, setPurchase] = React.useState<Purchase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);

  const loadPurchase = React.useCallback(async () => {
    if (!purchaseId) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      setPurchase(await purchaseService.getPurchaseById(purchaseId));
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('purchases.messages.failedLoadDetails'));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [purchaseId, router, t]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      void loadPurchase();
      return undefined;
    }, [loadPurchase, permissionState]),
  );

  const items = purchase?.items ?? [];
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const confirmDelete = () => {
    if (permissionState !== 'authorized') return;
    if (!purchase) return;
    Alert.alert(t('purchases.view.deleteTitle'), t('purchases.messages.deleteConfirm', { supplier: purchase.supplierName }), [
      { text: t('purchases.actions.cancel'), style: 'cancel' },
      {
        text: t('purchases.actions.delete'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await purchaseService.deletePurchase(purchase.id);
            SnackBar.Success(t('purchases.messages.deleted'));
            router.back();
          } catch (error) {
            SnackBar.Error(error instanceof Error ? error.message : t('purchases.messages.deleteFailed'));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{t('purchases.view.title')}</Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('purchases.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('purchases.unauthorized.title')} message={t('purchases.unauthorized.description')} />
      ) : loading && !purchase ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('purchases.view.loading')}</Text>
        </View>
      ) : purchase ? (
        <ScrollView contentContainerStyle={styles.content}>
          <ShopBanner label={t('purchases.shop.label')} name={purchase.shopName} emptyText={t('purchases.shop.legacy')} />

          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.titleRow}>
              <View style={styles.titleInfo}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('purchases.view.purchaseOrder')}</Text>
                <Text style={[styles.docNo, { color: theme.foreground }]}>#{purchase.id.slice(0, 8).toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('purchases.fields.supplier')}</Text>
                <Text style={[styles.infoValue, { color: theme.foreground }]} numberOfLines={2}>{purchase.supplierName}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('purchases.fields.date')}</Text>
                <Text style={[styles.infoValue, { color: theme.foreground }]}>{formatDateTime(purchase.purchaseDate)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('purchases.fields.products')}</Text>
                <Text style={[styles.infoValue, { color: theme.foreground }]}>{items.length || purchase.totalProducts}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('purchases.fields.totalQty')}</Text>
                <Text style={[styles.infoValue, { color: theme.foreground }]}>{totalQty}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{t('purchases.fields.items')} ({items.length})</Text>

            {items.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>{t('purchases.empty.noItemDetails')}</Text>
            ) : items.map((item, index) => (
              <View key={item.id ?? `${item.productId}-${index}`} style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.itemIcon, { backgroundColor: theme.secondary }]}>
                  <Icon className="text-muted-foreground" as={Package} size={16} />
                </View>
                <View style={styles.itemBody}>
                  <View style={styles.itemTop}>
                    <Text className="text-foreground" style={styles.productName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={[styles.itemTotal, { color: theme.foreground }]}>{money(item.lineTotal)}</Text>
                  </View>
                  <Text style={[styles.productMeta, { color: theme.mutedForeground }]} numberOfLines={1}>
                    {item.quantity}{item.unit ? ` ${item.unit}` : ''} × {money(item.unitPrice)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{t('purchases.fields.summary')}</Text>
            <SummaryRow label={t('purchases.fields.subtotal')} value={money(purchase.subTotal)} theme={theme} />
            <SummaryRow label={t('purchases.fields.tax')} value={money(purchase.tax)} theme={theme} />
            <SummaryRow label={t('purchases.fields.discount')} value={`- ${money(purchase.discount)}`} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SummaryRow label={t('purchases.fields.netTotal')} value={money(purchase.netTotal)} strong theme={theme} />
          </View>
        </ScrollView>
      ) : null}

      {purchase ? (
        <View style={[styles.actionBar, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
          <ActionButton
            label={t('purchases.actions.edit')}
            icon={Pencil}
            color={theme.primary}
            theme={theme}
            disabled={deleting}
            onPress={() => router.push(`/purchases/edit?id=${encodeURIComponent(purchase.id)}` as Parameters<typeof router.push>[0])}
          />
          <ActionButton
            label={t('purchases.actions.delete')}
            icon={Trash2}
            color={theme.destructive}
            theme={theme}
            disabled={deleting}
            onPress={confirmDelete}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  headerButton: { minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { marginTop: 8 },
  content: { padding: 12, paddingBottom: 28, gap: 12 },
  panel: { borderWidth: 1, borderRadius: 10, padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleInfo: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  docNo: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  infoCell: { flex: 1, minWidth: 0 },
  infoValue: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  itemIcon: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, minWidth: 0 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTotal: { fontSize: 12, fontWeight: '800' },
  productName: { flex: 1, fontSize: 12, fontWeight: '600' },
  productMeta: { fontSize: 10, marginTop: 1 },
  emptyText: { fontSize: 12, paddingVertical: 12, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 12 },
  summaryLabelStrong: { fontSize: 14, fontWeight: '800' },
  summaryValue: { fontSize: 12, fontWeight: '600' },
  summaryValueStrong: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, marginVertical: 6 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1 },
  actionButton: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionButtonDisabled: { opacity: 0.35 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700' },
});
