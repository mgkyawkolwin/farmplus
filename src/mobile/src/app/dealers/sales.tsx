'use client';

import * as React from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Plus, Search, Store, Trash2, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import UnauthorizedView from '@/components/unauthorized-view';
import LoadingOverlay from '@/components/loadingOverlay';
import ShopBanner from '@/components/shopBanner';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { getSelectedShopId } from '@/lib/authStorage';
import { useSelectedShopChanged } from '@/lib/selectedShop';
import { usePagePermission } from '@/lib/usePagePermission';
import { DealerItem } from '@/models/dealer';
import { ProductItem } from '@/models/product';
import { DealerServiceClient } from '@/services/dealerService';
import { IProductService } from '@/services/productService';
import { ISaleService } from '@/services/saleService';
import { ShopServiceClient } from '@/services/shopService';
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);
const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);
const dealerService = new DealerServiceClient();
const shopService = new ShopServiceClient();

type SelectedProduct = { product: ProductItem; quantity: string };
type ThemeColors = typeof THEME.light;

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SummaryRow({ label, value, strong, color, theme }: { label: string; value: string; strong?: boolean; color?: string; theme: ThemeColors }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.mutedForeground }, strong && [styles.summaryLabelStrong, { color: theme.foreground }]]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.foreground }, strong && styles.summaryValueStrong, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function InputRow({ label, children, theme }: { label: string; children: React.ReactNode; theme: ThemeColors }) {
  return (
    <View style={styles.inputRow}>
      <Text style={[styles.summaryLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <View style={styles.inputRowControl}>{children}</View>
    </View>
  );
}

export default function DealerSaleScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/dealers/sales');
  const params = useLocalSearchParams<{ dealerId?: string | string[] }>();
  const dealerId = Array.isArray(params.dealerId) ? params.dealerId[0] : params.dealerId;

  const [dealer, setDealer] = React.useState<DealerItem | null>(null);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [selectedProducts, setSelectedProducts] = React.useState<SelectedProduct[]>([]);
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [taxRate, setTaxRate] = React.useState('0');
  const [discount, setDiscount] = React.useState('0');
  const [paidAmount, setPaidAmount] = React.useState('0');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [shopName, setShopName] = React.useState<string | null>(null);
  const [shopLoaded, setShopLoaded] = React.useState(false);

  const loadShopName = React.useCallback(async () => {
    try {
      const [shopId, shops] = await Promise.all([getSelectedShopId(), shopService.getShops(1, 200)]);
      setShopName(shops.find((shop) => shop.id === shopId)?.name ?? null);
    } catch {
      setShopName(null);
    } finally {
      setShopLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
    void loadShopName();
  }, [loadShopName, permissionState]);

  useSelectedShopChanged(() => {
    if (permissionState === 'authorized') void loadShopName();
  });

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
    if (!dealerId) {
      router.back();
      return;
    }
    let active = true;
    Promise.all([
      dealerService.getDealerById(dealerId),
      productService.getProducts(1, 1000),
    ]).then(([dealerData, productData]) => {
      if (!active) return;
      setDealer(dealerData);
      setProducts(productData);
    }).catch((error) => {
      if (active) SnackBar.Error(error instanceof Error ? error.message : t('dealers.messages.unableLoadSaleOptions'));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [dealerId, permissionState, router, t]);

  const subtotal = selectedProducts.reduce((sum, line) =>
    sum + (Number(line.quantity) || 0) * (line.product.salePrice ?? 0), 0,
  );
  const numericTaxRate = Number(taxRate) || 0;
  const numericDiscount = Number(discount) || 0;
  const numericPaidAmount = Number(paidAmount) || 0;
  const taxAmount = subtotal > 0 ? (subtotal - numericDiscount) * (numericTaxRate / 100) : 0;
  const netTotal = subtotal - numericDiscount + taxAmount;
  const balance = netTotal - numericPaidAmount;
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const addProduct = (product: ProductItem) => {
    if ((product.currentStock ?? 0) <= 0) {
      SnackBar.Error(t('dealers.messages.saleOutOfStock'));
      return;
    }
    if (selectedProducts.some((line) => line.product.id === product.id)) {
      SnackBar.Error(t('dealers.messages.saleAlreadyHasProduct'));
      return;
    }
    setSelectedProducts((current) => [...current, { product, quantity: '1' }]);
    setPickerVisible(false);
  };

  const updateQuantity = (productId: string, quantity: string) => {
    setSelectedProducts((current) => current.map((line) => line.product.id === productId
      ? { ...line, quantity: quantity.replace(/[^0-9]/g, '') }
      : line));
  };

  const submitSale = async () => {
    if (permissionState !== 'authorized') return;
    if (!dealerId) return;
    if (selectedProducts.length === 0) {
      SnackBar.Error(t('dealers.messages.saleNoProducts'));
      return;
    }
    if (selectedProducts.some((line) => {
      const quantity = Number(line.quantity);
      return !Number.isInteger(quantity) || quantity <= 0 || quantity > (line.product.currentStock ?? 0);
    })) {
      SnackBar.Error(t('dealers.messages.saleQuantityInvalid'));
      return;
    }
    if (numericDiscount > subtotal) {
      SnackBar.Error(t('dealers.messages.saleDiscountExceedsSubtotal'));
      return;
    }

    setSaving(true);
    try {
      await saleService.createSale({
        dealerId,
        taxRate: numericTaxRate,
        discount: numericDiscount,
        paidAmount: numericPaidAmount,
        items: selectedProducts.map((line) => ({
          productId: line.product.id,
          quantity: Number(line.quantity),
        })),
      });
      SnackBar.Success(t('dealers.messages.saleRecorded'));
      router.back();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('dealers.messages.saleFailed'));
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
        <Text className="text-foreground" style={styles.headerTitle}>{t('dealers.sale.saleToDealer')}</Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('dealers.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('dealers.unauthorized.title')} message={t('dealers.unauthorized.description')} />
      ) : loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('dealers.sale.loading')}</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ShopBanner
              label={t('dealers.labels.sellingFrom')}
              name={shopName}
              emptyText={shopLoaded ? t('dealers.sale.noShopSelected') : undefined}
            />

            <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.sectionTitle}>{t('dealers.sale.dealer')}</Text>
              <View style={[styles.dealerRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.dealerIcon, { backgroundColor: theme.secondary }]}>
                  <Icon className="text-muted-foreground" as={Store} size={14} />
                </View>
                <Text className="text-foreground" style={styles.dealerText} numberOfLines={1}>
                  {dealer?.dealerName ?? '-'}
                </Text>
              </View>
            </View>

            <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderInfo}>
                  <Text style={styles.sectionTitle}>{t('dealers.sale.items', { count: selectedProducts.length })}</Text>
                  <Text style={styles.helperText}>{t('dealers.labels.stockDeducted')}</Text>
                </View>
                <Pressable
                  onPress={() => setPickerVisible(true)}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel={t('dealers.accessibility.addProduct')}
                  style={[styles.addButton, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                >
                  <Icon as={Plus} size={14} color={theme.primary} />
                  <Text style={[styles.addButtonText, { color: theme.primary }]}>{t('dealers.sale.add')}</Text>
                </Pressable>
              </View>

              {selectedProducts.length === 0 ? (
                <View style={styles.emptyProducts}>
                  <Text style={styles.helperText}>{t('dealers.empty.noProducts')}</Text>
                </View>
              ) : selectedProducts.map(({ product, quantity }) => (
                <View key={product.id} style={[styles.lineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.lineHeader}>
                    <View style={[styles.lineIcon, { backgroundColor: theme.secondary }]}>
                      <Icon className="text-muted-foreground" as={Package} size={16} />
                    </View>
                    <View style={styles.productInfo}>
                      <Text className="text-foreground" style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.helperText} numberOfLines={1}>
                        {money(product.salePrice ?? 0)} {t('dealers.labels.each')} · {t('dealers.labels.available', { count: product.currentStock ?? 0 })}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('dealers.accessibility.removeProduct', { name: product.name })}
                      onPress={() => setSelectedProducts((current) => current.filter((line) => line.product.id !== product.id))}
                      style={styles.removeButton}
                    >
                      <Icon className="text-destructive" as={Trash2} size={16} />
                    </Pressable>
                  </View>
                  <View style={[styles.quantityRow, { borderTopColor: theme.border }]}>
                    <Text style={styles.qtyLabel}>{t('dealers.fields.quantity')}</Text>
                    <Input
                      value={quantity}
                      onChangeText={(value) => updateQuantity(product.id, value)}
                      keyboardType="number-pad"
                      editable={!saving}
                      style={styles.quantityInput}
                    />
                      <Text style={[styles.lineTotal, { color: theme.foreground }]}>
                      {money((Number(quantity) || 0) * (product.salePrice ?? 0))}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={styles.sectionTitle}>{t('dealers.fields.summary')}</Text>
              <SummaryRow label={t('dealers.fields.subtotal')} value={money(subtotal)} theme={theme} />
              <InputRow label={t('dealers.fields.discount')} theme={theme}>
                <Input
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="decimal-pad"
                  editable={!saving}
                  style={styles.compactInput}
                />
              </InputRow>
              <InputRow label={t('dealers.fields.taxPercent')} theme={theme}>
                <Input
                  value={taxRate}
                  onChangeText={setTaxRate}
                  keyboardType="decimal-pad"
                  editable={!saving}
                  style={styles.compactInput}
                />
              </InputRow>
              <SummaryRow label={t('dealers.fields.taxAmount')} value={money(taxAmount)} theme={theme} />
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <SummaryRow label={t('dealers.fields.netTotal')} value={money(netTotal)} strong theme={theme} />
              <SummaryRow label={t('dealers.fields.netTotal')} value={money(netTotal)} strong theme={theme} />
              <InputRow label={t('dealers.fields.paid')} theme={theme}>
                <Input
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  keyboardType="decimal-pad"
                  editable={!saving}
                  style={styles.compactInput}
                />
              </InputRow>
              <SummaryRow label={t('dealers.fields.balance')} value={money(balance)} strong color={balance > 0 ? theme.chart4 : theme.chart2} theme={theme} />
            </View>
          </ScrollView>

          <View style={[styles.actionBar, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
            <View style={styles.actionTotal}>
              <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>{t('dealers.fields.netTotal')}</Text>
              <Text style={[styles.actionTotalValue, { color: theme.foreground }]} numberOfLines={1}>{money(netTotal)}</Text>
            </View>
            <Button onPress={submitSale} disabled={saving || selectedProducts.length === 0} style={[styles.saveButton, { backgroundColor: theme.primary }]}>
              {saving ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : <Text className="font-semibold" style={{ color: theme.primaryForeground }}>{t('dealers.actions.completeSale')}</Text>}
            </Button>
          </View>
        </>
      )}

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerVisible(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
            <View style={[styles.productSheet, { backgroundColor: theme.card }]}>
              <View style={styles.sheetHeader}>
                <Text className="text-foreground" style={styles.sheetTitle}>{t('dealers.sale.chooseProduct')}</Text>
                <Button variant="ghost" onPress={() => setPickerVisible(false)} style={styles.closeButton}>
                  <Icon className="text-foreground" as={X} size={20} />
                </Button>
              </View>
              <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <Icon className="text-muted-foreground" as={Search} size={16} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('dealers.placeholders.products')}
                  placeholderTextColor={theme.mutedForeground}
                  style={[styles.searchInput, { color: theme.foreground }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <FlatList
                data={filteredProducts}
                keyExtractor={(product) => product.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={<Text className="text-muted-foreground" style={styles.emptyPicker}>{t('dealers.empty.noProductsFound')}</Text>}
                renderItem={({ item: product }) => {
                  const stock = product.currentStock ?? 0;
                  const added = selectedProducts.some((line) => line.product.id === product.id);
                  return (
                    <Pressable
                      onPress={() => addProduct(product)}
                      disabled={stock <= 0 || added}
                      style={[styles.productOption, { borderBottomColor: theme.border }, (stock <= 0 || added) && styles.productOptionDisabled]}
                    >
                      <View style={[styles.productOptionIcon, { backgroundColor: theme.secondary }]}>
                        <Icon className="text-muted-foreground" as={Package} size={18} />
                      </View>
                      <View style={styles.productOptionInfo}>
                        <Text className="text-foreground" style={styles.productName} numberOfLines={1}>{product.name}</Text>
                        <Text className="text-muted-foreground" style={styles.helperText}>
                          {money(product.salePrice ?? 0)} · {t('dealers.labels.inStock', { count: stock })}
                        </Text>
                      </View>
                      {added ? <Text className="text-muted-foreground" style={styles.helperText}>{t('dealers.labels.added')}</Text> : null}
                    </Pressable>
                  );
                }}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  headerButton: { minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  content: { padding: 12, paddingBottom: 24, gap: 12 },
  panel: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  eyebrow: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionHeaderInfo: { flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  helperText: { fontSize: 11 },
  dealerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  dealerIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dealerText: { flex: 1, fontSize: 14, fontWeight: '600' },
  addButton: { height: 32, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, borderWidth: 1, borderRadius: 6 },
  addButtonText: { fontSize: 12, fontWeight: '700' },
  emptyProducts: { paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 8 },
  lineCard: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, gap: 8 },
  lineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineIcon: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, minWidth: 0, gap: 1 },
  productName: { fontSize: 13, fontWeight: '600' },
  removeButton: { padding: 6 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  qtyLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  quantityInput: { width: 64, height: 34, textAlign: 'center', paddingVertical: 0 },
  lineTotal: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  summaryLabel: { fontSize: 12 },
  summaryLabelStrong: { fontSize: 14, fontWeight: '800' },
  summaryValue: { fontSize: 12, fontWeight: '600' },
  summaryValueStrong: { fontSize: 15, fontWeight: '800' },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputRowControl: { width: 120 },
  compactInput: { height: 34, textAlign: 'right', paddingVertical: 0 },
  divider: { height: 1, marginVertical: 4 },
  actionBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1 },
  actionTotal: { flex: 1, minWidth: 0 },
  actionTotalValue: { fontSize: 18, fontWeight: '800' },
  saveButton: { minWidth: 150 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheetWrap: { justifyContent: 'flex-end', maxHeight: '90%' },
  productSheet: { height: '82%', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { minWidth: 40 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 14 },
  productOption: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 9 },
  productOptionDisabled: { opacity: 0.5 },
  productOptionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  productOptionInfo: { flex: 1, gap: 4 },
  emptyPicker: { paddingVertical: 24, textAlign: 'center' },
});
