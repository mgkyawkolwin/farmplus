'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Search, Trash2, X } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SnackBar from '@/components/ui/snack-bar';
import LoadingOverlay from '@/components/loadingOverlay';
import { container, DI_TOKENS } from '@/di';
import { ProductItem } from '@/models/product';
import { Purchase, PurchaseItemForm, PurchaseRequest } from '@/models/purchase';
import { Supplier } from '@/models/supplier';
import { IProductService } from '@/services/productService';
import { IPurchaseService } from '@/services/purchaseService';
import { SupplierServiceClient } from '@/services/supplierService';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);
const purchaseService = container.resolve<IPurchaseService>(DI_TOKENS.IPurchaseService);
const supplierService = new SupplierServiceClient();
const PRODUCT_PAGE_SIZE = 50;

function formatMoney(amount: number) {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MMK`;
}

function normalizeDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date
    ? null
    : parsed.toISOString();
}

export default function PurchaseFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const purchaseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
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
    let active = true;
    const loadForm = async () => {
      try {
        const [supplierData, productData, purchaseData] = await Promise.all([
          supplierService.getSuppliers(1, 1000),
          productService.getProducts(1, PRODUCT_PAGE_SIZE),
          mode === 'edit' && purchaseId
            ? purchaseService.getPurchaseById(purchaseId)
            : Promise.resolve(null),
        ]);
        if (!active) return;
        setSuppliers(supplierData);
        setProducts(productData);
        setHasMoreProducts(productData.length === PRODUCT_PAGE_SIZE);
        setProductPage(1);
        if (purchaseData) {
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
          SnackBar.Error(error instanceof Error ? error.message : 'Failed to load purchase form');
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
  }, [mode, purchaseId, router]);

  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + quantity * price;
  }, 0);
  const discountAmount = Number(discount) || 0;
  const taxAmount = Number(tax) || 0;
  const netTotal = subtotal - discountAmount + taxAmount;

  const loadMoreProducts = async () => {
    if (loadingProducts || !hasMoreProducts) return;
    setLoadingProducts(true);
    try {
      const nextPage = productPage + 1;
      const nextProducts = await productService.getProducts(nextPage, PRODUCT_PAGE_SIZE);
      setProducts((current) => [...current, ...nextProducts]);
      setProductPage(nextPage);
      setHasMoreProducts(nextProducts.length === PRODUCT_PAGE_SIZE);
    } catch {
      SnackBar.Error('Failed to load more products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const addProduct = (product: ProductItem) => {
    if (items.some((item) => item.productId === product.id)) {
      SnackBar.Error('This product is already in the purchase');
      return;
    }
    setItems((current) => [...current, {
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      quantity: '1',
      unitPrice: String(product.purchasePrice ?? 0),
    }]);
    setPickerVisible(false);
  };

  const updateItem = (productId: string, field: 'quantity' | 'unitPrice', value: string) => {
    setItems((current) => current.map((item) => item.productId === productId
      ? { ...item, [field]: value }
      : item));
  };

  const handleSubmit = async () => {
    const normalizedPurchaseDate = normalizeDate(purchaseDate);
    if (!supplierId) {
      SnackBar.Error('Supplier is required');
      return;
    }
    if (!normalizedPurchaseDate) {
      SnackBar.Error('Enter a valid purchase date in YYYY-MM-DD format');
      return;
    }
    if (items.length === 0) {
      SnackBar.Error('Add at least one product');
      return;
    }

    const requestItems = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));
    if (requestItems.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
      SnackBar.Error('Enter a positive whole quantity and a valid non-negative price for each product');
      return;
    }
    if (!Number.isFinite(discountAmount) || discountAmount < 0 || discountAmount > subtotal) {
      SnackBar.Error('Discount must be between zero and the subtotal');
      return;
    }
    if (!Number.isFinite(taxAmount) || taxAmount < 0) {
      SnackBar.Error('Tax must be a non-negative amount');
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
        SnackBar.Success('Purchase saved successfully');
      } else {
        if (!purchaseId) return;
        await purchaseService.updatePurchase(purchaseId, { ...request, rowVersion });
        SnackBar.Success('Purchase updated successfully');
      }
      router.back();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to save purchase');
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
        <Text className="text-foreground" style={styles.headerTitle}>{mode === 'create' ? 'New Purchase' : 'Edit Purchase'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {pageLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted-foreground" style={styles.loadingText}>Loading purchase details...</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.formContent}
          enableOnAndroid
          extraScrollHeight={40}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Label className="text-foreground">Supplier <Text className="text-red-500">*</Text></Label>
            <Select
              value={selectedSupplier ? { value: selectedSupplier.id, label: selectedSupplier.supplierName } : undefined}
              onValueChange={(option) => setSupplierId(option?.value ?? '')}
            >
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="Choose a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id} label={supplier.supplierName} />
                ))}
              </SelectContent>
            </Select>
            {suppliers.length === 0 ? <Text className="text-muted-foreground" style={styles.helperText}>No suppliers available.</Text> : null}
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Purchase Date <Text className="text-red-500">*</Text></Label>
            <Input
              placeholder="YYYY-MM-DD"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              autoCapitalize="none"
              editable={!loading}
              className="mt-2"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text className="text-foreground" style={styles.sectionTitle}>Products</Text>
            <Button variant="outline" onPress={() => setPickerVisible(true)} disabled={loading}>
              <Icon className="text-foreground" as={Plus} size={16} />
              <Text className="text-foreground">Add Product</Text>
            </Button>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Text className="text-muted-foreground">No products added yet.</Text>
            </View>
          ) : items.map((item) => (
            <View key={item.productId} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productNameBlock}>
                  <Text className="text-foreground" style={styles.productName} numberOfLines={2}>{item.productName}</Text>
                  {item.unit ? <Text className="text-muted-foreground" style={styles.helperText}>Unit: {item.unit}</Text> : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.productName}`}
                  onPress={() => setItems((current) => current.filter((line) => line.productId !== item.productId))}
                  style={styles.removeButton}
                >
                  <Icon className="text-destructive" as={Trash2} size={18} />
                </Pressable>
              </View>
              <View style={styles.lineFields}>
                <View style={styles.lineField}>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <Input
                    value={item.quantity}
                    onChangeText={(value) => updateItem(item.productId, 'quantity', value.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    editable={!loading}
                    style={styles.numericInput}
                  />
                </View>
                <View style={styles.lineField}>
                  <Label className="text-muted-foreground">Price (MMK)</Label>
                  <Input
                    value={item.unitPrice}
                    onChangeText={(value) => updateItem(item.productId, 'unitPrice', value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                    keyboardType="decimal-pad"
                    editable={!loading}
                    style={styles.numericInput}
                  />
                </View>
                <View style={styles.lineTotalBlock}>
                  <Text className="text-muted-foreground" style={styles.helperText}>Line total</Text>
                  <Text className="text-foreground" style={styles.lineTotal}>
                    {formatMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text className="text-muted-foreground">Total</Text>
              <Text className="text-foreground" style={styles.totalValue}>{formatMoney(subtotal)}</Text>
            </View>
            <View style={styles.amountField}>
              <Label className="text-foreground">Discount (MMK)</Label>
              <Input
                value={discount}
                onChangeText={(value) => setDiscount(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                keyboardType="decimal-pad"
                editable={!loading}
                style={styles.amountInput}
              />
            </View>
            <View style={styles.amountField}>
              <Label className="text-foreground">Tax (MMK)</Label>
              <Input
                value={tax}
                onChangeText={(value) => setTax(value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                keyboardType="decimal-pad"
                editable={!loading}
                style={styles.amountInput}
              />
            </View>
            <View style={[styles.totalRow, styles.netTotalRow]}>
              <Text className="text-foreground" style={styles.netLabel}>Net Total</Text>
              <Text className="text-foreground" style={styles.netValue}>{formatMoney(netTotal)}</Text>
            </View>
          </View>

          <Button onPress={handleSubmit} disabled={loading || pageLoading || suppliers.length === 0} style={styles.saveButton}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <Text className="text-background font-semibold">Save Purchase</Text>
            )}
          </Button>
        </KeyboardAwareScrollView>
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
                <Text className="text-foreground" style={styles.sheetTitle}>Choose Product</Text>
                <Button variant="ghost" onPress={() => setPickerVisible(false)} style={styles.closeButton}>
                  <Icon className="text-foreground" as={X} size={20} />
                </Button>
              </View>
              <View style={styles.searchBox}>
                <Icon className="text-muted-foreground" as={Search} size={16} />
                <TextInput
                  value={productSearch}
                  onChangeText={setProductSearch}
                  placeholder="Search products"
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
                      {loadingProducts ? 'Loading products...' : 'No products found.'}
                    </Text>
                  </View>
                }
                renderItem={({ item: product }) => {
                  const alreadyAdded = items.some((item) => item.productId === product.id);
                  return (
                    <Pressable
                      onPress={() => addProduct(product)}
                      disabled={alreadyAdded}
                      style={[styles.productOption, alreadyAdded && styles.productOptionDisabled]}
                    >
                      <View style={styles.productOptionInfo}>
                        <Text className="text-foreground" style={styles.productName} numberOfLines={1}>{product.name}</Text>
                        <Text className="text-muted-foreground" style={styles.helperText}>
                          {formatMoney(product.purchasePrice ?? 0)}{product.unit ? ` / ${product.unit}` : ''}
                        </Text>
                      </View>
                      {alreadyAdded ? <Text className="text-muted-foreground" style={styles.helperText}>Added</Text> : (
                        <Icon className="text-foreground" as={Plus} size={18} />
                      )}
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
  headerTitle: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },
  formContent: { flexGrow: 1, padding: 16, paddingBottom: 36 },
  field: { marginBottom: 18, gap: 4 },
  helperText: { fontSize: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  emptyProducts: { paddingVertical: 22, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8 },
  productCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 10, gap: 12 },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productNameBlock: { flex: 1, gap: 3 },
  productName: { fontSize: 14, fontWeight: '600' },
  removeButton: { padding: 6 },
  lineFields: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  lineField: { flex: 1, gap: 5 },
  numericInput: { paddingHorizontal: 8, fontSize: 14 },
  lineTotalBlock: { flex: 1.1, minWidth: 84, gap: 5, alignItems: 'flex-end', paddingBottom: 8 },
  lineTotal: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  totals: { borderTopWidth: 1, borderColor: '#E5E7EB', marginTop: 8, paddingTop: 14, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { fontWeight: '600' },
  amountField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  amountInput: { width: 150, textAlign: 'right' },
  netTotalRow: { borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 12, marginTop: 2 },
  netLabel: { fontSize: 16, fontWeight: '700' },
  netValue: { fontSize: 17, fontWeight: '700' },
  saveButton: { marginTop: 20 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.38)' },
  sheetWrap: { justifyContent: 'flex-end', maxHeight: '82%' },
  productSheet: {
    height: '82%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { minWidth: 40 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: { flex: 1, height: '100%', color: '#111827', fontSize: 14 },
  productOption: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 10,
  },
  productOptionDisabled: { opacity: 0.55 },
  productOptionInfo: { flex: 1, gap: 4 },
  emptyPicker: { flex: 1, paddingVertical: 24, alignItems: 'center' },
  listFooter: { padding: 12 },
});