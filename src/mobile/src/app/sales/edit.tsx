'use client';

import * as React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import ShopBanner from '@/components/shopBanner';
import { useSelectedShopName } from '@/lib/useSelectedShopName';
import { container, DI_TOKENS } from '@/di';
import { Sale } from '@/models/sale';
import { ISaleService } from '@/services/saleService';

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function PreviewRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.previewRow}>
      <Text style={[styles.previewLabel, strong && styles.previewStrong]}>{label}</Text>
      <Text style={[styles.previewValue, strong && styles.previewStrong]}>{value}</Text>
    </View>
  );
}

export default function SaleEditScreen() {
  const router = useRouter();
  const { shopName, shopLoaded } = useSelectedShopName();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const saleId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [sale, setSale] = React.useState<Sale | null>(null);
  const [taxRate, setTaxRate] = React.useState('0');
  const [discount, setDiscount] = React.useState('0');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (!saleId) {
      router.back();
      return undefined;
    }

    saleService.getSaleById(saleId).then((result) => {
      if (!active) return;
      if (result.status === 'Voided') {
        SnackBar.Error('A voided sale cannot be edited');
        router.back();
        return;
      }
      setSale(result);
      setTaxRate(String(result.taxRate ?? 0));
      setDiscount(String(result.discount ?? 0));
    }).catch((error) => {
      if (!active) return;
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to load sale');
      router.back();
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [saleId, router]);

  const numericTaxRate = Number(taxRate) || 0;
  const numericDiscount = Number(discount) || 0;
  const subTotal = sale?.subTotal ?? 0;
  const paidAmount = sale?.paidAmount ?? 0;
  const taxAmount = round2(subTotal * numericTaxRate / 100);
  const netTotal = round2(subTotal - numericDiscount + taxAmount);
  const balance = round2(netTotal - paidAmount);

  const save = async () => {
    if (!sale) return;
    if (numericTaxRate < 0 || numericTaxRate > 100) {
      SnackBar.Error('Tax rate must be between 0 and 100');
      return;
    }
    if (numericDiscount < 0 || numericDiscount > subTotal) {
      SnackBar.Error('Discount cannot be negative or exceed the subtotal');
      return;
    }
    if (netTotal < paidAmount) {
      SnackBar.Error('Net total cannot be less than the amount already paid');
      return;
    }

    setSaving(true);
    try {
      await saleService.updateSale(sale.id, numericTaxRate, numericDiscount);
      SnackBar.Success('Sale updated');
      router.back();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to update sale');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={saving} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Edit Sale</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
        </View>
      ) : sale ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ShopBanner
              label="Shop"
              name={shopName}
              emptyText={shopLoaded ? 'No shop selected. Choose one from the top bar first.' : undefined}
            />

            <Text style={styles.hint}>
              Sale #{sale.id.slice(0, 8).toUpperCase()} · {sale.customerName}. Products and quantities cannot be changed; void the sale and create a new one instead.
            </Text>

            <View style={styles.field}>
              <Label className="text-foreground">Tax %</Label>
              <Input
                value={taxRate}
                onChangeText={(value) => setTaxRate(value.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>

            <View style={styles.field}>
              <Label className="text-foreground">Discount</Label>
              <Input
                value={discount}
                onChangeText={(value) => setDiscount(value.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>

            <View style={styles.preview}>
              <PreviewRow label="Subtotal" value={money(subTotal)} />
              <PreviewRow label="Tax amount" value={money(taxAmount)} />
              <PreviewRow label="Discount" value={`- ${money(numericDiscount)}`} />
              <PreviewRow label="Net total" value={money(netTotal)} strong />
              <PreviewRow label="Paid" value={money(paidAmount)} />
              <PreviewRow label="Balance" value={money(balance)} strong />
            </View>

            <Button onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-background font-semibold">Save Changes</Text>}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  flex: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  headerButton: { minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  hint: { fontSize: 12, color: '#64748B' },
  field: { gap: 7 },
  preview: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  previewLabel: { fontSize: 12, color: '#475569' },
  previewValue: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  previewStrong: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
});
