'use client';

import * as React from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ban, ChevronLeft, Package, Pencil, Wallet } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import UnauthorizedView from '@/components/unauthorized-view';
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
type ThemeColors = typeof THEME.light;

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function AuditRow({ label, name, at, theme }: { label: string; name?: string; at?: string; theme: ThemeColors }) {
  return (
    <View style={[styles.auditRow, { borderBottomColor: theme.border }]}>
      <Text style={[styles.auditLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <Text style={[styles.auditValue, { color: theme.foreground }]}>{name || '-'}</Text>
      <Text style={[styles.auditDate, { color: theme.mutedForeground }]}>{formatDateTime(at)}</Text>
    </View>
  );
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

function SummaryRow({ label, value, strong, color, theme }: { label: string; value: string; strong?: boolean; color?: string; theme: ThemeColors }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: strong ? theme.foreground : theme.mutedForeground }, strong && styles.summaryLabelStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.foreground }, strong && styles.summaryValueStrong, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export default function SaleViewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/sales/view');
  const { shopName, shopLoaded } = useSelectedShopName();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const saleId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [sale, setSale] = React.useState<Sale | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [voidVisible, setVoidVisible] = React.useState(false);
  const [voidReason, setVoidReason] = React.useState('');
  const [paymentVisible, setPaymentVisible] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const loadSale = React.useCallback(async () => {
    if (!saleId) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      setSale(await saleService.getSaleById(saleId));
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('sales.messages.failedLoadDetails'));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [saleId, router, t]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      void loadSale();
      return undefined;
    }, [loadSale, permissionState]),
  );

  const items = sale?.items ?? [];
  const payments = sale?.payments ?? [];
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const isVoided = sale?.status === 'Voided';
  const isSettled = !!sale && sale.paidAmount > 0 && sale.balance <= 0;
  const badge = isVoided
    ? { label: t('sales.status.void'), color: theme.destructive }
    : isSettled
      ? { label: t('sales.status.paid'), color: theme.chart2 }
      : { label: t('sales.status.unpaid'), color: theme.chart4 };
  const wasEdited = !!sale?.createdAt && !!sale?.updatedAt
    && Math.abs(new Date(sale.updatedAt).getTime() - new Date(sale.createdAt).getTime()) > 1000;
  const amountToPay = Number(paymentAmount) || 0;
  const finalBalance = (sale?.balance ?? 0) - amountToPay;

  const closeVoidModal = () => {
    if (submitting) return;
    setVoidVisible(false);
    setVoidReason('');
  };

  const closePaymentModal = () => {
    if (submitting) return;
    setPaymentVisible(false);
    setPaymentAmount('');
  };

  const submitVoid = async () => {
    if (permissionState !== 'authorized') return;
    if (!sale) return;
    if (!voidReason.trim()) {
      SnackBar.Error(t('sales.messages.voidReasonRequired'));
      return;
    }
    setSubmitting(true);
    try {
      setSale(await saleService.voidSale(sale.id, voidReason.trim()));
      setVoidVisible(false);
      setVoidReason('');
      SnackBar.Success(t('sales.messages.saleVoided'));
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('sales.messages.failedVoid'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitPayment = async () => {
    if (permissionState !== 'authorized') return;
    if (!sale) return;
    if (amountToPay <= 0) {
      SnackBar.Error(t('sales.messages.amountMustBePositive'));
      return;
    }
    if (amountToPay > sale.balance) {
      SnackBar.Error(t('sales.messages.amountExceedsBalance'));
      return;
    }
    setSubmitting(true);
    try {
      setSale(await saleService.addPayment(sale.id, amountToPay));
      setPaymentVisible(false);
      setPaymentAmount('');
      SnackBar.Success(t('sales.messages.paymentRecorded'));
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('sales.messages.failedRecordPayment'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{t('sales.view.title')}</Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('sales.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('sales.unauthorized.title')} message={t('sales.unauthorized.description')} />
      ) : loading && !sale ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('sales.view.detailsLoading')}</Text>
        </View>
      ) : sale ? (
        <ScrollView contentContainerStyle={styles.content}>
          <ShopBanner
            label={t('sales.shop.title')}
            name={shopName}
            emptyText={shopLoaded ? t('sales.shop.noShopSelectedFirst') : undefined}
          />
          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.titleRow}>
              <View style={styles.titleInfo}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('sales.fields.invoice')}</Text>
                <Text style={[styles.invoiceNo, { color: theme.foreground }]}>#{sale.id.slice(0, 8).toUpperCase()}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('sales.fields.customer')}</Text>
                <Text style={[styles.infoValue, { color: theme.foreground }]} numberOfLines={2}>{sale.customerName}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('sales.fields.date')}</Text>
                <Text style={[styles.infoValue, { color: theme.foreground }]}>{new Date(sale.saleDate).toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('sales.fields.products')}</Text>
                <Text style={[styles.infoValue, { color: theme.foreground }]}>{items.length}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('sales.fields.saleQuantity')}</Text>
                <Text style={[styles.infoValue, { color: theme.foreground }]}>{totalQty}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{t('sales.fields.items')}</Text>
            <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.colPhoto} />
              <Text style={[styles.th, styles.colProduct, { color: theme.mutedForeground }]}>{t('sales.fields.product')}</Text>
              <Text style={[styles.th, styles.colQty, { color: theme.mutedForeground }]}>{t('sales.fields.quantity')}</Text>
              <Text style={[styles.th, styles.colPrice, { color: theme.mutedForeground }]}>{t('sales.fields.price')}</Text>
              <Text style={[styles.th, styles.colTotal, { color: theme.mutedForeground }]}>{t('sales.fields.amount')}</Text>
            </View>

            {items.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>{t('sales.empty.noItemDetails')}</Text>
            ) : items.map((item, index) => (
              <View key={`${item.productId}-${index}`} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
                <View style={styles.colPhoto}>
                  {item.productImageUrl ? (
                    <Image source={{ uri: item.productImageUrl }} style={styles.photo} />
                  ) : (
                    <View style={[styles.photo, styles.photoFallback, { backgroundColor: theme.secondary }]}>
                      <Icon className="text-muted-foreground" as={Package} size={18} />
                    </View>
                  )}
                </View>
                <View style={styles.colProduct}>
                  <Text className="text-foreground" style={styles.productName} numberOfLines={2}>{item.productName}</Text>
                  {item.unit || item.taxRate > 0 ? (
                    <Text style={[styles.productMeta, { color: theme.mutedForeground }]}>
                      {[item.unit, item.taxRate > 0 ? t('sales.labels.taxRate', { rate: item.taxRate }) : null].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.td, styles.colQty, { color: theme.foreground }]}>{item.quantity}</Text>
                <Text style={[styles.td, styles.colPrice, { color: theme.foreground }]}>{money(item.unitPrice)}</Text>
                <Text style={[styles.td, styles.colTotal, styles.tdStrong, { color: theme.foreground }]}>{money(item.lineTotal)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{t('sales.fields.summary')}</Text>
            <SummaryRow label={t('sales.fields.subtotal')} value={money(sale.subTotal)} theme={theme} />
            <SummaryRow label={t('sales.labels.taxRate', { rate: sale.taxRate })} value={money(sale.tax)} theme={theme} />
            <SummaryRow label={t('sales.fields.discount')} value={`- ${money(sale.discount)}`} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SummaryRow label={t('sales.fields.netTotal')} value={money(sale.netTotal)} strong theme={theme} />
            <SummaryRow label={t('sales.fields.paid')} value={money(sale.paidAmount)} color={theme.chart2} theme={theme} />
            <SummaryRow label={t('sales.fields.balance')} value={money(sale.balance)} strong color={isSettled ? theme.chart2 : theme.chart4} theme={theme} />
          </View>

          {payments.length > 0 ? (
            <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{t('sales.fields.payments')}</Text>
              {payments.map((payment) => (
                <View key={payment.id} style={[styles.paymentRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentAmount, { color: theme.chart2 }]}>{money(payment.amount)}</Text>
                    <Text style={[styles.paymentMeta, { color: theme.mutedForeground }]}>
                      {formatDateTime(payment.paidAt)}{payment.receivedByName ? ` · ${payment.receivedByName}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.paymentBalance, { color: theme.mutedForeground }]}>{t('sales.labels.balanceAfter', { amount: money(payment.balanceAfter) })}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {isVoided ? (
            <View style={[styles.panel, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.destructive }]}>{t('sales.view.voided')}</Text>
              <Text style={[styles.voidReason, { color: theme.foreground }]}>{sale.voidReason || '-'}</Text>
              <Text style={[styles.paymentMeta, { color: theme.mutedForeground }]}>
                {sale.voidedByName || '-'} · {formatDateTime(sale.voidedAt)}
              </Text>
            </View>
          ) : null}

          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{t('sales.audit.title')}</Text>
            <AuditRow label={t('sales.audit.createdBy')} name={sale.createdByName} at={sale.createdAt} theme={theme} />
            <AuditRow
              label={t('sales.audit.editedBy')}
              name={wasEdited ? sale.updatedByName : undefined}
              at={wasEdited ? sale.updatedAt : undefined}
              theme={theme}
            />
          </View>
        </ScrollView>
      ) : null}

      {sale ? (
        <View style={[styles.actionBar, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
          <ActionButton
            label={t('sales.actions.edit')}
            icon={Pencil}
            color={theme.primary}
            theme={theme}
            disabled={isVoided}
            onPress={() => router.push({ pathname: '/sales/edit', params: { id: sale.id } })}
          />
          <ActionButton
            label={t('sales.actions.void')}
            icon={Ban}
            color={theme.destructive}
            theme={theme}
            disabled={isVoided}
            onPress={() => setVoidVisible(true)}
          />
          <ActionButton
            label={t('sales.actions.payment')}
            icon={Wallet}
            color={theme.chart2}
            theme={theme}
            disabled={isVoided || sale.balance <= 0}
            onPress={() => setPaymentVisible(true)}
          />
        </View>
      ) : null}

      <Modal visible={voidVisible} transparent animationType="slide" onRequestClose={closeVoidModal}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeVoidModal} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="bg-background" style={styles.sheet}>
              <Text className="text-foreground" style={styles.sheetTitle}>{t('sales.view.voidTitle')}</Text>
              <Text style={[styles.sheetHint, { color: theme.mutedForeground }]}>{t('sales.view.voidConfirmationHint')}</Text>
              <Label className="text-foreground">{t('sales.fields.voidReason')}</Label>
              <Input
                value={voidReason}
                onChangeText={setVoidReason}
                placeholder={t('sales.placeholders.voidReason')}
                multiline
                maxLength={500}
                editable={!submitting}
                style={styles.reasonInput}
              />
              <View style={styles.sheetButtons}>
                <Button variant="outline" onPress={closeVoidModal} disabled={submitting} style={styles.sheetButton}>
                  <Text className="text-foreground">{t('sales.actions.cancel')}</Text>
                </Button>
                <Button variant="destructive" onPress={submitVoid} disabled={submitting} style={styles.sheetButton}>
                  {submitting ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : <Text>{t('sales.actions.voidSale')}</Text>}
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={paymentVisible} transparent animationType="slide" onRequestClose={closePaymentModal}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePaymentModal} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="bg-background" style={styles.sheet}>
              <Text className="text-foreground" style={styles.sheetTitle}>{t('sales.view.receivePayment')}</Text>

              <View style={styles.sheetRow}>
                <Text style={[styles.summaryLabel, { color: theme.mutedForeground }]}>{t('sales.fields.currentBalance')}</Text>
                <Text style={[styles.sheetValue, { color: theme.foreground }]}>{money(sale?.balance ?? 0)}</Text>
              </View>

              <Label className="text-foreground">{t('sales.fields.amountToPay')}</Label>
              <Input
                value={paymentAmount}
                onChangeText={(value) => setPaymentAmount(value.replace(/[^0-9.]/g, ''))}
                placeholder={t('sales.placeholders.paymentAmount')}
                keyboardType="decimal-pad"
                editable={!submitting}
              />

              <View style={[styles.sheetRow, styles.finalRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.summaryLabelStrong, { color: theme.foreground }]}>{t('sales.fields.finalBalance')}</Text>
                <Text style={[styles.sheetValue, { color: finalBalance < 0 ? theme.destructive : theme.chart2 }]}>
                  {money(finalBalance)}
                </Text>
              </View>

              <View style={styles.sheetButtons}>
                <Button variant="outline" onPress={closePaymentModal} disabled={submitting} style={styles.sheetButton}>
                  <Text className="text-foreground">{t('sales.actions.cancel')}</Text>
                </Button>
                <Button onPress={submitPayment} disabled={submitting || amountToPay <= 0 || finalBalance < 0} style={styles.sheetButton}>
                  {submitting ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : <Text>{t('sales.actions.pay')}</Text>}
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  auditRow: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  auditLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  auditValue: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  auditDate: { fontSize: 11, marginTop: 1 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1 },
  actionButton: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionButtonDisabled: { opacity: 0.35 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth },
  paymentInfo: { flex: 1 },
  paymentAmount: { fontSize: 14, fontWeight: '700' },
  paymentMeta: { fontSize: 10, marginTop: 2 },
  paymentBalance: { fontSize: 11, fontWeight: '600' },
  voidReason: { fontSize: 13, marginBottom: 4 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 28, gap: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  sheetHint: { fontSize: 12 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  sheetValue: { fontSize: 16, fontWeight: '700' },
  finalRow: { borderTopWidth: 1, paddingTop: 10 },
  reasonInput: { minHeight: 90, textAlignVertical: 'top' },
  sheetButtons: { flexDirection: 'row', gap: 10, marginTop: 6 },
  sheetButton: { flex: 1 },
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
  invoiceNo: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  infoCell: { flex: 1, minWidth: 0 },
  infoValue: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 6, borderBottomWidth: 1 },
  th: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  colPhoto: { width: 40 },
  photo: { width: 40, height: 40, borderRadius: 6 },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  colProduct: { flex: 1, minWidth: 0 },
  colQty: { width: 30, textAlign: 'right' },
  colPrice: { width: 66, textAlign: 'right' },
  colTotal: { width: 74, textAlign: 'right' },
  productName: { fontSize: 12, fontWeight: '600' },
  productMeta: { fontSize: 9, marginTop: 2 },
  td: { fontSize: 11 },
  tdStrong: { fontWeight: '700' },
  emptyText: { fontSize: 12, paddingVertical: 12, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 12 },
  summaryLabelStrong: { fontSize: 14, fontWeight: '800' },
  summaryValue: { fontSize: 12, fontWeight: '600' },
  summaryValueStrong: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, marginVertical: 6 },
});
