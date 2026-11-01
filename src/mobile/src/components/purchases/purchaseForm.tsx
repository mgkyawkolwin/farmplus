'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, ChevronLeft, Package, Plus, Search, Store, Trash2, X } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UnauthorizedView from '@/components/unauthorized-view';
import SnackBar from '@/components/ui/snack-bar';
import LoadingOverlay from '@/components/loadingOverlay';
import { container, DI_TOKENS } from '@/di';
import { getSelectedShopId } from '@/lib/authStorage';
import { ProductItem } from '@/models/product';
import { PurchaseItemForm, PurchaseRequest } from '@/models/purchase';
import { Shop } from '@/models/shop';
import { Supplier } from '@/models/supplier';
import { IProductService } from '@/services/productService';
import { IPurchaseService } from '@/services/purchaseService';
import { ShopServiceClient } from '@/services/shopService';
import { SupplierServiceClient } from '@/services/supplierService';
import { usePagePermission } from '@/lib/usePagePermission';
import { useTranslation } from 'react-i18next';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);
const purchaseService = container.resolve<IPurchaseService>(DI_TOKENS.IPurchaseService);
const supplierService = new SupplierServiceClient();
const shopService = new ShopServiceClient();
const PRODUCT_PAGE_SIZE = 50;

function formatMoney(amount: number) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizeDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date
    ? null
    : parsed.toISOString();
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

export default function PurchaseFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const permissionState = usePagePermission(mode === 'create' ? '/purchases/new' : '/purchases/edit');
  const purchaseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [selectedShop, setSelectedShop] = React.useState<Shop | null>(null);
  const [purchaseShop, setPurchaseShop] = React.useState<{ id?: string; name?: string } | null>(null);
  const [supplierId, setSupplierId] = React.useState('');
  const [purchaseDate, setPurchaseDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = React.useState<PurchaseItemForm[]>([]);
  const [discount, setDiscount] = React.useState('0');
  const [tax, setTax] = React.useState('0');
  const [rowVersion, setRowVersion] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [productSearch, setProductSearch] = React.useState('');
  const [productPage, setProductPage] = React.useState(1);
  const [hasMoreProducts, setHasMoreProducts] = React.useState(true);
  const [loadingProducts, setLoadingProducts] = React.useState(false);

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
    let active = true;
    const loadForm = async () => {
      try {
        const [supplierData, productData, purchaseData, shopData, selectedShopId] = await Promise.all([
          supplierService.getSuppliers(1, 1000),
          productService.getProducts(1, PRODUCT_PAGE_SIZE),
          mode === 'edit' && purchaseId
            ? purchaseService.getPurchaseById(purchaseId)
            : Promise.resolve(null),
          shopService.getShops(1, 200),
          getSelectedShopId(),
        ]);
        if (!active) return;
        setSuppliers(supplierData);
        setProducts(productData);
        setHasMoreProducts(productData.length === PRODUCT_PAGE_SIZE);
        setProductPage(1);
        setSelectedShop(shopData.find((shop) => shop.id === selectedShopId) ?? null);
        if (purchaseData) {
          setPurchaseShop({ id: purchaseData.shopId, name: purchaseData.shopName });
          setSupplierId(purchaseData.supplierId);
          setPurchaseDate(purchaseData.purchaseDate.slice(0, 10));
          setDiscount(String(purchaseData.discount));
          setTax(String(purchaseData.tax));
          setRowVersion(purchaseData.rowVersion ?? '');
          setItems(purchaseData.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unit: item.unit,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          })));
        }
      } catch (error) {
        if (active) {
          SnackBar.Error(error instanceof Error ? error.message : t('purchases.messages.failedLoadForm'));
          if (mode === 'edit') router.back();
        }
      } finally {
        if (active) setPageLoading(false);
      }
    };

    if (mode === 'edit' && !purchaseId) {
      router.back();
      return () => { active = false; };
    }
    void loadForm();
    return () => { active = false; };
  }, [mode, permissionState, purchaseId, router, t]);

  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + quantity * price;
  }, 0);
  const discountAmount = Number(discount) || 0;
  const taxAmount = Number(tax) || 0;
  const netTotal = subtotal - discountAmount + taxAmount;

  // Purchases add stock to one shop. New purchases use the shop chosen in the top bar;
  // existing ones keep the shop they were recorded against.
  const shopMissing = mode === 'create' && !selectedShop;
  const shopLabel = mode === 'create' ? selectedShop?.name : purchaseShop?.name;
  const legacyPurchase = mode === 'edit' && !purchaseShop?.id;
  const stockShopMatches = mode === 'create' || !purchaseShop?.id || purchaseShop.id === selectedShop?.id;
  const showStock = !!selectedShop && stockShopMatches;
  const productById = React.useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const loadMoreProducts = async () => {
    if (permissionState !== 'authorized' || loadingProducts || !hasMoreProducts) return;
    setLoadingProducts(true);
    try {
      const nextPage = productPage + 1;
      const nextProducts = await productService.getProducts(nextPage, PRODUCT_PAGE_SIZE);
      setProducts((current) => [...current, ...nextProducts]);
      setProductPage(nextPage);
      setHasMoreProducts(nextProducts.length === PRODUCT_PAGE_SIZE);
    } catch {
      SnackBar.Error(t('purchases.messages.failedLoadMoreProducts'));
    } finally {
      setLoadingProducts(false);
    }
  };

  const addProduct = (product: ProductItem) => {
    if (items.some((item) => item.productId === product.id)) {
      SnackBar.Error(t('purchases.messages.productAlreadyAdded'));
      return;
    }
    setItems((current) => [...current, {
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      quantity: '1',
      unitPrice: '0',
    }]);
    setPickerVisible(false);
  };

  const updateItem = (productId: string, field: 'quantity' | 'unitPrice', value: string) => {
    setItems((current) => current.map((item) => item.productId === productId
      ? { ...item, [field]: value }
      : item));
  };

  const handleSubmit = async () => {
    if (permissionState !== 'authorized') return;
    const normalizedPurchaseDate = normalizeDate(purchaseDate);
    if (shopMissing) {
      SnackBar.Error(t('purchases.messages.selectShop'));
      return;
    }
    if (!supplierId) {
      SnackBar.Error(t('purchases.messages.supplierRequired'));
      return;
    }
    if (!normalizedPurchaseDate) {
      SnackBar.Error(t('purchases.messages.dateInvalid'));
      return;
    }
    if (items.length === 0) {
      SnackBar.Error(t('purchases.messages.productRequired'));
      return;
    }

    const requestItems = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));
    if (requestItems.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
      SnackBar.Error(t('purchases.messages.quantityPriceInvalid'));
      return;
    }
    if (!Number.isFinite(discountAmount) || discountAmount < 0 || discountAmount > subtotal) {
      SnackBar.Error(t('purchases.messages.discountInvalid'));
      return;
    }
    if (!Number.isFinite(taxAmount) || taxAmount < 0) {
      SnackBar.Error(t('purchases.messages.taxInvalid'));
      return;
    }

    const request: PurchaseRequest = {
      supplierId,
      purchaseDate: normalizedPurchaseDate,
      discount: discountAmount,
      tax: taxAmount,
      items: requestItems,
    };

    setLoading(true);
    try {
      if (mode === 'create') {
        await purchaseService.createPurchase(request);
        SnackBar.Success(t('purchases.messages.saved'));
      } else {
        if (!purchaseId) return;
        await purchaseService.updatePurchase(purchaseId, { ...request, rowVersion });
        SnackBar.Success(t('purchases.messages.updated'));
      }
      router.back();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('purchases.messages.failedSave'));
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.trim().toLowerCase()),
  );
  const selectedSupplier = suppliers.find((supplier) => supplier.id === supplierId);

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'} />
      <LoadingOverlay isLoading={loading} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{mode === 'create' ? t('purchases.form.newTitle') : t('purchases.form.updateTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.loadingText}>{t('purchases.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('purchases.unauthorized.title')} message={t('purchases.unauthorized.description')} />
      ) : pageLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.loadingText}>{t('purchases.form.loadingDetails')}</Text>
        </View>
      ) : (
        <>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.formContent}
            enableOnAndroid
            extraScrollHeight={40}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.shopBanner, shopMissing && styles.shopBannerWarn]}>
              <View style={[styles.shopIcon, shopMissing && styles.shopIconWarn]}>
                {shopMissing
                  ? <AlertTriangle size={14} color="#B45309" />
                  : <Store size={14} color="#16794B" />}
              </View>
              <View style={styles.shopInfo}>
                <Text style={styles.eyebrow}>{mode === 'create' ? t('purchases.shop.receivingStockInto') : t('purchases.shop.label')}</Text>
                {shopMissing ? (
                  <Text style={styles.shopWarnText}>{t('purchases.shop.noShopSelectedFirst')}</Text>
                ) : legacyPurchase ? (
                  <Text style={styles.shopName}>{t('purchases.shop.legacy')}</Text>
                ) : (
                  <Text style={styles.shopName} numberOfLines={1}>{shopLabel ?? '-'}</Text>
                )}
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('purchases.form.purchaseDetails')}</Text>
              <View style={styles.field}>
                <Label className="text-foreground">{t('purchases.fields.supplier')} <Text className="text-red-500">*</Text></Label>
                <Select
                  value={selectedSupplier ? { value: selectedSupplier.id, label: selectedSupplier.supplierName } : undefined}
                  onValueChange={(option) => setSupplierId(option?.value ?? '')}
                >
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder={t('purchases.picker.chooseSupplier')} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id} label={supplier.supplierName} />
                    ))}
                  </SelectContent>
                </Select>
                {suppliers.length === 0 ? <Text className="text-muted-foreground" style={styles.helperText}>{t('purchases.empty.noSuppliers')}</Text> : null}
              </View>

              <View style={styles.field}>
                <Label className="text-foreground">{t('purchases.fields.purchaseDate')} <Text className="text-red-500">*</Text></Label>
                <Input
                  placeholder={t('purchases.placeholders.date')}
                  value={purchaseDate}
                  onChangeText={setPurchaseDate}
                  autoCapitalize="none"
                  editable={!loading}
                  className="mt-2"
                />
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>{t('purchases.fields.products')}</Text>
                <Button variant="outline" onPress={() => setPickerVisible(true)} disabled={loading} style={styles.addProductButton}>
                  <Plus size={14} color="#16794B" />
                  <Text style={styles.addProductText}>{t('purchases.actions.addProduct')}</Text>
                </Button>
              </View>

              {items.length === 0 ? (
                <View style={styles.emptyProducts}>
                  <Text className="text-muted-foreground">{t('purchases.empty.noProductsAdded')}</Text>
                </View>
              ) : items.map((item) => {
                const product = productById.get(item.productId);
                return (
                  <View key={item.productId} style={styles.lineCard}>
                    <View style={styles.lineTop}>
                      {product?.coverImageUrl ? (
                        <Image source={{ uri: product.coverImageUrl }} style={styles.photo} />
                      ) : (
                        <View style={[styles.photo, styles.photoFallback]}>
                          <Package size={16} color="#64748B" />
                        </View>
                      )}
                      <View style={styles.lineInfo}>
                        <Text className="text-foreground" style={styles.productName} numberOfLines={2}>{item.productName}</Text>
                        <Text style={styles.productMeta} numberOfLines={1}>
                          {[
                            item.unit ? t('purchases.labels.unit', { unit: item.unit }) : null,
                            showStock && product ? t('purchases.labels.inShop', { count: (product.currentStock ?? 0).toLocaleString('en-US') }) : null,
                          ].filter(Boolean).join('  ·  ') || ' '}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('purchases.accessibility.removeProduct', { name: item.productName })}
                        onPress={() => setItems((current) => current.filter((line) => line.productId !== item.productId))}
                        style={styles.removeButton}
                      >
                        <Trash2 size={18} color="#B42318" />
                      </Pressable>
                    </View>
                    <View style={styles.lineFields}>
                      <View style={styles.lineField}>
                        <Label className="text-muted-foreground">{t('purchases.fields.quantity')}</Label>
                        <Input
                          value={item.quantity}
                          onChangeText={(value) => updateItem(item.productId, 'quantity', value.replace(/[^0-9]/g, ''))}
                          keyboardType="number-pad"
                          editable={!loading}
                          style={styles.numericInput}
                        />
                      </View>
                      <View style={styles.lineField}>
                        <Label className="text-muted-foreground">{t('purchases.fields.unitPrice')}</Label>
                        <Input
                          value={item.unitPrice}
                          onChangeText={(value) => updateItem(item.productId, 'unitPrice', value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                          keyboardType="decimal-pad"
                          editable={!loading}
                          style={styles.numericInput}
                        />
                      </View>
                      <View style={styles.lineTotalBlock}>
                        <Text style={styles.eyebrow}>{t('purchases.fields.lineTotal')}</Text>
                        <Text className="text-foreground" style={styles.lineTotal}>
                          {formatMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('purchases.fields.summary')}</Text>
              <SummaryRow label={t('purchases.fields.subtotal')} value={formatMoney(subtotal)} />
              <View style={styles.amountField}>
                <Label className="text-foreground">{t('purchases.fields.discount')}</Label>
                <Input
                  value={discount}
                  onChangeText={(value) => setDiscount(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  keyboardType="decimal-pad"
                  editable={!loading}
                  style={styles.amountInput}
                />
              </View>
              <View style={styles.amountField}>
                <Label className="text-foreground">{t('purchases.fields.tax')}</Label>
                <Input
                  value={tax}
                  onChangeText={(value) => setTax(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                  keyboardType="decimal-pad"
                  editable={!loading}
                  style={styles.amountInput}
                />
              </View>
              <View style={styles.divider} />
              <SummaryRow label={t('purchases.fields.netTotal')} value={formatMoney(netTotal)} strong />
            </View>
          </KeyboardAwareScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.eyebrow}>{t('purchases.labels.netTotalCurrency')}</Text>
              <Text className="text-foreground" style={styles.footerTotal}>{formatMoney(netTotal)}</Text>
            </View>
            <Button
              onPress={handleSubmit}
              disabled={loading || pageLoading || suppliers.length === 0 || shopMissing}
              style={styles.saveButton}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={styles.saveText}>{mode === 'create' ? t('purchases.actions.save') : t('purchases.actions.update')}</Text>
              )}
            </Button>
          </View>
        </>
      )}

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerVisible(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
            <View className="bg-background" style={styles.productSheet}>
              <View style={styles.sheetHeader}>
                <Text className="text-foreground" style={styles.sheetTitle}>{t('purchases.picker.chooseProduct')}</Text>
                <Pressable onPress={() => setPickerVisible(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('purchases.accessibility.closeProductPicker')}>
                  <X size={20} color="#475569" />
                </Pressable>
              </View>
              <View style={styles.searchBox}>
                <Icon className="text-muted-foreground" as={Search} size={16} />
                <TextInput
                  value={productSearch}
                  onChangeText={setProductSearch}
                  placeholder={t('purchases.picker.searchProducts')}
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <FlatList
                data={filteredProducts}
                keyExtractor={(product) => product.id}
                keyboardShouldPersistTaps="handled"
                onEndReached={loadMoreProducts}
                onEndReachedThreshold={0.35}
                ListEmptyComponent={
                  <View style={styles.emptyPicker}>
                    <Text className="text-muted-foreground">
                      {loadingProducts ? t('purchases.dashboard.loadingProducts') : t('purchases.empty.noProductsFound')}
                    </Text>
                  </View>
                }
                renderItem={({ item: product }) => {
                  const alreadyAdded = items.some((item) => item.productId === product.id);
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={product.name}
                      onPress={() => addProduct(product)}
                      disabled={alreadyAdded}
                    >
                      <View style={[styles.productOption, alreadyAdded && styles.productOptionDisabled]}>
                        {product.coverImageUrl ? (
                          <Image source={{ uri: product.coverImageUrl }} style={styles.optionPhoto} />
                        ) : (
                          <View style={[styles.optionPhoto, styles.photoFallback]}>
                            <Package size={16} color="#64748B" />
                          </View>
                        )}
                        <View style={styles.productOptionInfo}>
                          <Text className="text-foreground" style={styles.productName} numberOfLines={1}>{product.name}</Text>
                          <Text style={styles.productMeta} numberOfLines={1}>
                            {t('purchases.labels.purchasePrice')}{product.unit ? ` (${product.unit})` : ''}
                            {showStock ? `  ·  ${t('purchases.labels.inShop', { count: (product.currentStock ?? 0).toLocaleString('en-US') })}` : ''}
                          </Text>
                        </View>
                        {alreadyAdded ? <Text style={styles.addedText}>{t('purchases.labels.added')}</Text> : (
                          <Plus size={18} color="#16794B" />
                        )}
                      </View>
                    </Pressable>
                  );
                }}
                ListFooterComponent={loadingProducts ? <ActivityIndicator style={styles.listFooter} size="small" /> : null}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backButton: { minWidth: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },
  formContent: { flexGrow: 1, padding: 12, paddingBottom: 24, gap: 12 },
  eyebrow: { fontSize: 9, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#D5E9DC',
    borderRadius: 8,
    backgroundColor: '#F4FAF6',
  },
  shopBannerWarn: { borderColor: '#EFE2BF', backgroundColor: '#FFFAEE' },
  shopIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F4EC' },
  shopIconWarn: { backgroundColor: '#FFF1CC' },
  shopInfo: { flex: 1, minWidth: 0 },
  shopName: { fontSize: 13, fontWeight: '800', color: '#0F172A', lineHeight: 16 },
  shopWarnText: { fontSize: 11, fontWeight: '600', color: '#92400E', lineHeight: 14 },
  panel: { borderWidth: 1, borderColor: '#D9DEE5', borderRadius: 8, backgroundColor: '#FFFFFF', padding: 12, gap: 10 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 },
  field: { gap: 4 },
  helperText: { fontSize: 12 },
  addProductButton: { height: 32, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, borderRadius: 6, borderColor: '#16794B', backgroundColor: '#F4FAF6' },
  addProductText: { fontSize: 11, fontWeight: '700', color: '#16794B' },
  emptyProducts: { paddingVertical: 20, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1', borderRadius: 6 },
  lineCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, backgroundColor: '#F8FAFC', padding: 10, gap: 10 },
  lineTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  photo: { width: 40, height: 40, borderRadius: 6 },
  photoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  lineInfo: { flex: 1, minWidth: 0, gap: 2 },
  productName: { fontSize: 13, fontWeight: '700' },
  productMeta: { fontSize: 11, color: '#64748B' },
  removeButton: { padding: 6 },
  lineFields: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  lineField: { flex: 1, gap: 5 },
  numericInput: { paddingHorizontal: 8, fontSize: 14, backgroundColor: '#FFFFFF' },
  lineTotalBlock: { flex: 1.1, minWidth: 84, gap: 5, alignItems: 'flex-end', paddingBottom: 10 },
  lineTotal: { fontSize: 13, fontWeight: '800', textAlign: 'right' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#475569' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  summaryStrong: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  amountField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  amountInput: { width: 150, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#CBD5E1' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#D9DEE5',
    backgroundColor: '#FFFFFF',
  },
  footerTotal: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  saveButton: { minWidth: 150, height: 44, borderRadius: 6, backgroundColor: '#16794B' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.38)' },
  sheetWrap: { justifyContent: 'flex-end', maxHeight: '82%' },
  productSheet: {
    height: '82%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: { flex: 1, height: '100%', color: '#111827', fontSize: 14 },
  productOption: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 8,
  },
  productOptionDisabled: { opacity: 0.5 },
  optionPhoto: { width: 40, height: 40, borderRadius: 6 },
  productOptionInfo: { flex: 1, minWidth: 0, gap: 3 },
  addedText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  emptyPicker: { flex: 1, paddingVertical: 24, alignItems: 'center' },
  listFooter: { padding: 12 },
});
