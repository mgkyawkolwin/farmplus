'use client';

import * as React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import UnauthorizedView from '@/components/unauthorized-view';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import ShopBanner from '@/components/shopBanner';
import { useSelectedShopName } from '@/lib/useSelectedShopName';
import { container, DI_TOKENS } from '@/di';
import { Sale } from '@/models/sale';
import { ISaleService } from '@/services/saleService';
import { usePagePermission } from '@/lib/usePagePermission';
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

type ThemeColors = typeof THEME.light;

function PreviewRow({ label, value, strong, theme }: { label: string; value: string; strong?: boolean; theme: ThemeColors }) {
  return (
    <View style={styles.previewRow}>
      <Text style={[styles.previewLabel, { color: theme.mutedForeground }, strong && styles.previewStrong]}>{label}</Text>
      <Text style={[styles.previewValue, { color: theme.foreground }, strong && styles.previewStrong]}>{value}</Text>
    </View>
  );
}

export default function SaleEditScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/sales/edit');
  const { shopName, shopLoaded } = useSelectedShopName();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const saleId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [sale, setSale] = React.useState<Sale | null>(null);
  const [taxRate, setTaxRate] = React.useState('0');
  const [discount, setDiscount] = React.useState('0');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
    let active = true;
    if (!saleId) {
      router.back();
      return undefined;
    }

    saleService.getSaleById(saleId).then((result) => {
      if (!active) return;
      if (result.status === 'Voided') {
        SnackBar.Error(t('sales.messages.voidedCannotEdit'));
        router.back();
        return;
      }
      setSale(result);
      setTaxRate(String(result.taxRate ?? 0));
      setDiscount(String(result.discount ?? 0));
    }).catch((error) => {
      if (!active) return;
      SnackBar.Error(error instanceof Error ? error.message : t('sales.messages.failedLoad'));
      router.back();
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [permissionState, saleId, router, t]);

  const numericTaxRate = Number(taxRate) || 0;
  const numericDiscount = Number(discount) || 0;
  const subTotal = sale?.subTotal ?? 0;
  const paidAmount = sale?.paidAmount ?? 0;
  const taxAmount = round2(subTotal * numericTaxRate / 100);
  const netTotal = round2(subTotal - numericDiscount + taxAmount);
  const balance = round2(netTotal - paidAmount);

  const save = async () => {
    if (permissionState !== 'authorized') return;
    if (!sale) return;
    if (numericTaxRate < 0 || numericTaxRate > 100) {
      SnackBar.Error(t('sales.messages.taxRateInvalid'));
      return;
    }
    if (numericDiscount < 0 || numericDiscount > subTotal) {
      SnackBar.Error(t('sales.messages.discountInvalid'));
      return;
    }
    if (netTotal < paidAmount) {
      SnackBar.Error(t('sales.messages.netTotalTooLow'));
      return;
    }

    setSaving(true);
    try {
      await saleService.updateSale(sale.id, numericTaxRate, numericDiscount);
      SnackBar.Success(t('sales.messages.saleUpdated'));
      router.back();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('sales.messages.failedUpdate'));
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
        <Text className="text-foreground" style={styles.headerTitle}>{t('sales.edit.title')}</Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('sales.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('sales.unauthorized.title')} message={t('sales.unauthorized.description')} />
      ) : loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
        </View>
      ) : sale ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ShopBanner
              label={t('sales.shop.title')}
              name={shopName}
              emptyText={shopLoaded ? t('sales.shop.noShopSelectedFirst') : undefined}
            />

            <Text style={[styles.hint, { color: theme.mutedForeground }]}>
              {t('sales.edit.readOnlyNotice', { id: sale.id.slice(0, 8).toUpperCase(), customer: sale.customerName })}
            </Text>

            <View style={styles.field}>
              <Label className="text-foreground">{t('sales.fields.taxPercent')}</Label>
              <Input
                value={taxRate}
                onChangeText={(value) => setTaxRate(value.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>

            <View style={styles.field}>
              <Label className="text-foreground">{t('sales.fields.discount')}</Label>
              <Input
                value={discount}
                onChangeText={(value) => setDiscount(value.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>

            <View style={[styles.preview, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <PreviewRow label={t('sales.fields.subtotal')} value={money(subTotal)} theme={theme} />
              <PreviewRow label={t('sales.fields.taxAmount')} value={money(taxAmount)} theme={theme} />
              <PreviewRow label={t('sales.fields.discount')} value={`- ${money(numericDiscount)}`} theme={theme} />
              <PreviewRow label={t('sales.fields.netTotal')} value={money(netTotal)} strong theme={theme} />
              <PreviewRow label={t('sales.fields.paid')} value={money(paidAmount)} theme={theme} />
              <PreviewRow label={t('sales.fields.balance')} value={money(balance)} strong theme={theme} />
            </View>

            <Button onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : <Text className="text-background font-semibold">{t('sales.actions.saveChanges')}</Text>}
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
  hint: { fontSize: 12 },
  field: { gap: 7 },
  preview: { borderWidth: 1, borderRadius: 10, padding: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  previewLabel: { fontSize: 12 },
  previewValue: { fontSize: 12, fontWeight: '600' },
  previewStrong: { fontSize: 14, fontWeight: '800' },
});
