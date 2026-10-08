'use client';

import * as React from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ban, ChevronLeft, Package, Pencil, Wallet } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
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

function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function AuditRow({ label, name, at }: { label: string; name?: string; at?: string }) {
  return (
    <View style={styles.auditRow}>
      <Text style={styles.auditLabel}>{label}</Text>
      <Text style={styles.auditValue}>{name || '-'}</Text>
      <Text style={styles.auditDate}>{formatDateTime(at)}</Text>
    </View>
  );
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

function SummaryRow({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryLabelStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryValueStrong, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export default function SaleViewScreen() {
  const router = useRouter();
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
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to load sale details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [saleId, router]);

  useFocusEffect(
    React.useCallback(() => {
      void loadSale();
      return undefined;
    }, [loadSale]),
  );

  const items = sale?.items ?? [];
  const payments = sale?.payments ?? [];
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const isVoided = sale?.status === 'Voided';
  const isSettled = !!sale && sale.paidAmount > 0 && sale.balance <= 0;
  const badge = isVoided
    ? { label: 'VOID', pill: styles.statusVoid, text: styles.statusTextVoid }
    : isSettled
      ? { label: 'PAID', pill: styles.statusPaid, text: styles.statusTextPaid }
      : { label: 'UNPAID', pill: styles.statusDue, text: styles.statusTextDue };
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
    if (!sale) return;
    if (!voidReason.trim()) {
      SnackBar.Error('Enter a void reason');
      return;
    }
    setSubmitting(true);
    try {
      setSale(await saleService.voidSale(sale.id, voidReason.trim()));
      setVoidVisible(false);
      setVoidReason('');
      SnackBar.Success('Sale voided');
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to void sale');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPayment = async () => {
    if (!sale) return;
    if (amountToPay <= 0) {
      SnackBar.Error('Enter an amount greater than zero');
      return;
    }
    if (amountToPay > sale.balance) {
      SnackBar.Error('Amount cannot exceed the current balance');
      return;
    }
    setSubmitting(true);
    try {
      setSale(await saleService.addPayment(sale.id, amountToPay));
      setPaymentVisible(false);
      setPaymentAmount('');
      SnackBar.Success('Payment recorded');
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to record payment');
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
        <Text className="text-foreground" style={styles.headerTitle}>Sale Details</Text>
        <View style={styles.headerButton} />
      </View>

      {loading && !sale ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading sale...</Text>
        </View>
      ) : sale ? (
        <ScrollView contentContainerStyle={styles.content}>
          <ShopBanner
            label="Shop"
            name={shopName}
            emptyText={shopLoaded ? 'No shop selected. Choose one from the top bar first.' : undefined}
          />
          <View style={styles.panel}>
            <View style={styles.titleRow}>
              <View style={styles.titleInfo}>
                <Text style={styles.eyebrow}>Invoice</Text>
                <Text style={styles.invoiceNo}>#{sale.id.slice(0, 8).toUpperCase()}</Text>
              </View>
              <View style={[styles.statusPill, badge.pill]}>
                <Text style={[styles.statusText, badge.text]}>{badge.label}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.eyebrow}>Customer</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{sale.customerName}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.eyebrow}>Date</Text>
                <Text style={styles.infoValue}>{new Date(sale.saleDate).toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.eyebrow}>Products</Text>
                <Text style={styles.infoValue}>{items.length}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.eyebrow}>Total Qty</Text>
                <Text style={styles.infoValue}>{totalQty}</Text>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.tableHeader}>
              <View style={styles.colPhoto} />
              <Text style={[styles.th, styles.colProduct]}>Product</Text>
              <Text style={[styles.th, styles.colQty]}>Qty</Text>
              <Text style={[styles.th, styles.colPrice]}>Price</Text>
              <Text style={[styles.th, styles.colTotal]}>Amount</Text>
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>No item details available.</Text>
            ) : items.map((item, index) => (
              <View key={`${item.productId}-${index}`} style={styles.itemRow}>
                <View style={styles.colPhoto}>
                  {item.productImageUrl ? (
                    <Image source={{ uri: item.productImageUrl }} style={styles.photo} />
                  ) : (
                    <View style={[styles.photo, styles.photoFallback]}>
                      <Icon className="text-muted-foreground" as={Package} size={18} />
                    </View>
                  )}
                </View>
                <View style={styles.colProduct}>
                  <Text className="text-foreground" style={styles.productName} numberOfLines={2}>{item.productName}</Text>
                  {item.unit || item.taxRate > 0 ? (
                    <Text style={styles.productMeta}>
                      {[item.unit, item.taxRate > 0 ? `Tax ${item.taxRate}%` : null].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.td, styles.colPrice]}>{money(item.unitPrice)}</Text>
                <Text style={[styles.td, styles.colTotal, styles.tdStrong]}>{money(item.lineTotal)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <SummaryRow label="Subtotal" value={money(sale.subTotal)} />
            <SummaryRow label={`Tax (${sale.taxRate}%)`} value={money(sale.tax)} />
            <SummaryRow label="Discount" value={`- ${money(sale.discount)}`} />
            <View style={styles.divider} />
            <SummaryRow label="Net Total" value={money(sale.netTotal)} strong />
            <SummaryRow label="Paid" value={money(sale.paidAmount)} color="#047857" />
            <SummaryRow label="Balance" value={money(sale.balance)} strong color={isSettled ? '#047857' : '#B45309'} />
          </View>

          {payments.length > 0 ? (
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Payments</Text>
              {payments.map((payment) => (
                <View key={payment.id} style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentAmount}>{money(payment.amount)}</Text>
                    <Text style={styles.paymentMeta}>
                      {formatDateTime(payment.paidAt)}{payment.receivedByName ? ` · ${payment.receivedByName}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.paymentBalance}>Balance {money(payment.balanceAfter)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {isVoided ? (
            <View style={[styles.panel, styles.voidPanel]}>
              <Text style={[styles.sectionTitle, styles.voidTitle]}>Voided</Text>
              <Text style={styles.voidReason}>{sale.voidReason || '-'}</Text>
              <Text style={styles.paymentMeta}>
                {sale.voidedByName || '-'} · {formatDateTime(sale.voidedAt)}
              </Text>
            </View>
          ) : null}

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Audit</Text>
            <AuditRow label="Created by" name={sale.createdByName} at={sale.createdAt} />
            <AuditRow
              label="Edited by"
              name={wasEdited ? sale.updatedByName : undefined}
              at={wasEdited ? sale.updatedAt : undefined}
            />
          </View>
        </ScrollView>
      ) : null}

      {sale ? (
        <View style={styles.actionBar}>
          <ActionButton
            label="Edit"
            icon={Pencil}
            color="#2563EB"
            disabled={isVoided}
            onPress={() => router.push({ pathname: '/sales/edit', params: { id: sale.id } })}
          />
          <ActionButton
            label="Void"
            icon={Ban}
            color="#DC2626"
            disabled={isVoided}
            onPress={() => setVoidVisible(true)}
          />
          <ActionButton
            label="Payment"
            icon={Wallet}
            color="#047857"
            disabled={isVoided || sale.balance <= 0}
            onPress={() => setPaymentVisible(true)}
          />
        </View>
      ) : null}

      <Modal visible={voidVisible} transparent animationType="slide" onRequestClose={closeVoidModal}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeVoidModal} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="bg-background" style={styles.sheet}>
              <Text className="text-foreground" style={styles.sheetTitle}>Void Sale</Text>
              <Text style={styles.sheetHint}>Stock for this sale will be returned to inventory. This cannot be undone.</Text>
              <Label className="text-foreground">Void reason</Label>
              <Input
                value={voidReason}
                onChangeText={setVoidReason}
                placeholder="Why is this sale being voided?"
                multiline
                maxLength={500}
                editable={!submitting}
                style={styles.reasonInput}
              />
              <View style={styles.sheetButtons}>
                <Button variant="outline" onPress={closeVoidModal} disabled={submitting} style={styles.sheetButton}>
                  <Text className="text-foreground">Cancel</Text>
                </Button>
                <Button variant="destructive" onPress={submitVoid} disabled={submitting} style={styles.sheetButton}>
                  {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text>Void Sale</Text>}
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={paymentVisible} transparent animationType="slide" onRequestClose={closePaymentModal}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePaymentModal} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="bg-background" style={styles.sheet}>
              <Text className="text-foreground" style={styles.sheetTitle}>Receive Payment</Text>

              <View style={styles.sheetRow}>
                <Text style={styles.summaryLabel}>Current balance</Text>
                <Text style={styles.sheetValue}>{money(sale?.balance ?? 0)}</Text>
              </View>

              <Label className="text-foreground">Amount to pay</Label>
              <Input
                value={paymentAmount}
                onChangeText={(value) => setPaymentAmount(value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={!submitting}
              />

              <View style={[styles.sheetRow, styles.finalRow]}>
                <Text style={styles.summaryLabelStrong}>Final balance</Text>
                <Text style={[styles.sheetValue, finalBalance < 0 ? styles.negative : styles.positive]}>
                  {money(finalBalance)}
                </Text>
              </View>

              <View style={styles.sheetButtons}>
                <Button variant="outline" onPress={closePaymentModal} disabled={submitting} style={styles.sheetButton}>
                  <Text className="text-foreground">Cancel</Text>
                </Button>
                <Button onPress={submitPayment} disabled={submitting || amountToPay <= 0 || finalBalance < 0} style={styles.sheetButton}>
                  {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text>Pay</Text>}
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
  auditRow: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  auditLabel: { fontSize: 9, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  auditValue: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginTop: 2 },
  auditDate: { fontSize: 11, color: '#64748B', marginTop: 1 },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  actionButton: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionButtonDisabled: { opacity: 0.35 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  paymentInfo: { flex: 1 },
  paymentAmount: { fontSize: 14, fontWeight: '700', color: '#047857' },
  paymentMeta: { fontSize: 10, color: '#64748B', marginTop: 2 },
  paymentBalance: { fontSize: 11, color: '#475569', fontWeight: '600' },
  voidPanel: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  voidTitle: { color: '#B91C1C' },
  voidReason: { fontSize: 13, color: '#7F1D1D', marginBottom: 4 },
  statusVoid: { backgroundColor: '#FEE2E2' },
  statusTextVoid: { color: '#B91C1C' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.38)' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 28, gap: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  sheetHint: { fontSize: 12, color: '#64748B' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  sheetValue: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  finalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 },
  positive: { color: '#047857' },
  negative: { color: '#B91C1C' },
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
  panel: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleInfo: { flex: 1 },
  eyebrow: { fontSize: 9, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  invoiceNo: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusPaid: { backgroundColor: '#D1FAE5' },
  statusDue: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  statusTextPaid: { color: '#047857' },
  statusTextDue: { color: '#B45309' },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  infoCell: { flex: 1, minWidth: 0 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#CBD5E1' },
  th: { fontSize: 9, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  colPhoto: { width: 40 },
  photo: { width: 40, height: 40, borderRadius: 6 },
  photoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2E8F0' },
  colProduct: { flex: 1, minWidth: 0 },
  colQty: { width: 30, textAlign: 'right' },
  colPrice: { width: 66, textAlign: 'right' },
  colTotal: { width: 74, textAlign: 'right' },
  productName: { fontSize: 12, fontWeight: '600' },
  productMeta: { fontSize: 9, color: '#64748B', marginTop: 2 },
  td: { fontSize: 11, color: '#334155' },
  tdStrong: { fontWeight: '700', color: '#0F172A' },
  emptyText: { fontSize: 12, color: '#64748B', paddingVertical: 12, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 12, color: '#475569' },
  summaryLabelStrong: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  summaryValue: { fontSize: 12, fontWeight: '600', color: '#1E293B' },
  summaryValueStrong: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#CBD5E1', marginVertical: 6 },
});
