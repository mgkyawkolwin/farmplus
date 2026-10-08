'use client';

import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Pencil, Trash2 } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import ShopBanner from '@/components/shopBanner';
import { container, DI_TOKENS } from '@/di';
import { Purchase } from '@/models/purchase';
import { IPurchaseService } from '@/services/purchaseService';

const purchaseService = container.resolve<IPurchaseService>(DI_TOKENS.IPurchaseService);

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function ActionButton({ label, icon, onPress, disabled, color }: {
  label: string;
  icon: React.ComponentProps<typeof Icon>['as'];
  onPress: () => void;
  disabled?: boolean;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}1A` }]}>
        <Icon as={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryLabelStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryValueStrong]}>{value}</Text>
    </View>
  );
}

export default function PurchaseViewScreen() {
  const router = useRouter();
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
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to load purchase details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [purchaseId, router]);

  useFocusEffect(
    React.useCallback(() => {
      void loadPurchase();
      return undefined;
    }, [loadPurchase]),
  );

  const items = purchase?.items ?? [];
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const confirmDelete = () => {
    if (!purchase) return;
    Alert.alert('Delete purchase', `Delete the purchase from ${purchase.supplierName}? Stock will be adjusted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await purchaseService.deletePurchase(purchase.id);
            SnackBar.Success('Purchase deleted successfully');
            router.back();
          } catch (error) {
            SnackBar.Error(error instanceof Error ? error.message : 'Failed to delete purchase');
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
        <Text className="text-foreground" style={styles.headerTitle}>Purchase Details</Text>
        <View style={styles.headerButton} />
      </View>

      {loading && !purchase ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading purchase...</Text>
        </View>
      ) : purchase ? (
        <ScrollView contentContainerStyle={styles.content}>
          <ShopBanner name={purchase.shopName} emptyText="Recorded before shops existed" />

          <View style={styles.panel}>
            <View style={styles.titleRow}>
              <View style={styles.titleInfo}>
                <Text style={styles.eyebrow}>Purchase Order</Text>
                <Text style={styles.docNo}>#{purchase.id.slice(0, 8).toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.eyebrow}>Supplier</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{purchase.supplierName}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.eyebrow}>Date</Text>
                <Text style={styles.infoValue}>{formatDateTime(purchase.purchaseDate)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.eyebrow}>Products</Text>
                <Text style={styles.infoValue}>{items.length || purchase.totalProducts}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.eyebrow}>Total Qty</Text>
                <Text style={styles.infoValue}>{totalQty}</Text>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Items ({items.length})</Text>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>No item details available.</Text>
            ) : items.map((item, index) => (
              <View key={item.id ?? `${item.productId}-${index}`} style={styles.itemCard}>
                <View style={styles.itemIcon}>
                  <Icon className="text-muted-foreground" as={Package} size={16} />
                </View>
                <View style={styles.itemBody}>
                  <View style={styles.itemTop}>
                    <Text className="text-foreground" style={styles.productName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.itemTotal}>{money(item.lineTotal)}</Text>
                  </View>
                  <Text style={styles.productMeta} numberOfLines={1}>
                    {item.quantity}{item.unit ? ` ${item.unit}` : ''} × {money(item.unitPrice)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <SummaryRow label="Subtotal" value={money(purchase.subTotal)} />
            <SummaryRow label="Tax" value={money(purchase.tax)} />
            <SummaryRow label="Discount" value={`- ${money(purchase.discount)}`} />
            <View style={styles.divider} />
            <SummaryRow label="Net Total" value={money(purchase.netTotal)} strong />
          </View>
        </ScrollView>
      ) : null}

      {purchase ? (
        <View style={styles.actionBar}>
          <ActionButton
            label="Edit"
            icon={Pencil}
            color="#2563EB"
            disabled={deleting}
            onPress={() => router.push(`/purchases/edit?id=${encodeURIComponent(purchase.id)}` as Parameters<typeof router.push>[0])}
          />
          <ActionButton
            label="Delete"
            icon={Trash2}
            color="#DC2626"
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
  panel: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleInfo: { flex: 1 },
  eyebrow: { fontSize: 9, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  docNo: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  infoCell: { flex: 1, minWidth: 0 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  itemIcon: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0' },
  itemBody: { flex: 1, minWidth: 0 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTotal: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  productName: { flex: 1, fontSize: 12, fontWeight: '600' },
  productMeta: { fontSize: 10, color: '#64748B', marginTop: 1 },
  emptyText: { fontSize: 12, color: '#64748B', paddingVertical: 12, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 12, color: '#475569' },
  summaryLabelStrong: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  summaryValueStrong: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#CBD5E1', marginVertical: 6 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  actionButton: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionButtonDisabled: { opacity: 0.35 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700' },
});
