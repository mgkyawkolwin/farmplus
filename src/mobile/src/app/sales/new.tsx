'use client';

import * as React from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronLeft, Package, Plus, Search, Trash2, User, X } from 'lucide-react-native';

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
import { THEME } from '@/lib/theme';
import { CustomerItem } from '@/models/customer';
import { ProductItem } from '@/models/product';
import { ICustomerService } from '@/services/customerService';
import { IProductService } from '@/services/productService';
import { ISaleService } from '@/services/saleService';
import { ShopServiceClient } from '@/services/shopService';

const customerService = container.resolve<ICustomerService>(DI_TOKENS.ICustomerService);
const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);
const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);
const shopService = new ShopServiceClient();

type SelectedProduct = { product: ProductItem; quantity: string };
const WALK_IN = 'walk-in';

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type ThemeColors = typeof THEME.light;

function SummaryRow({ label, value, strong, color, theme }: { label: string; value: string; strong?: boolean; color?: string; theme: ThemeColors }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: strong ? theme.foreground : theme.mutedForeground }, strong && styles.summaryLabelStrong]}>{label}</Text>
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

export default function NewSaleScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/sales/new');
  const [customers, setCustomers] = React.useState<CustomerItem[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [customerId, setCustomerId] = React.useState(WALK_IN);
  const [selectedProducts, setSelectedProducts] = React.useState<SelectedProduct[]>([]);
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [customerPickerVisible, setCustomerPickerVisible] = React.useState(false);
  const [customerPickerStage, setCustomerPickerStage] = React.useState<'choice' | 'list'>('choice');
  const [search, setSearch] = React.useState('');
  const [customerSearch, setCustomerSearch] = React.useState('');
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
    if (permissionState === 'authorized') void loadShopName();
  }, [loadShopName, permissionState]);

  useSelectedShopChanged(() => {
    if (permissionState === 'authorized') void loadShopName();
  });

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
    let active = true;
    Promise.all([
      customerService.getCustomers(1, 1000, undefined, true),
      productService.getProducts(1, 1000),
    ]).then(([customerData, productData]) => {
      if (!active) return;
      setCustomers(customerData);
      setProducts(productData);
    }).catch((error) => {
      if (active) SnackBar.Error(error instanceof Error ? error.message : 'Unable to load sale options');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [permissionState]);

  const selectedCustomer = customers.find((customer) => customer.id === customerId);
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
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearch.trim().toLowerCase()),
  );

  const closeCustomerPicker = () => {
    setCustomerPickerVisible(false);
    setCustomerPickerStage('choice');
    setCustomerSearch('');
  };

  const addProduct = (product: ProductItem) => {
    if ((product.currentStock ?? 0) <= 0) {
      SnackBar.Error('This product is out of stock');
      return;
    }
    if (selectedProducts.some((line) => line.product.id === product.id)) {
      SnackBar.Error('This product is already in the sale');
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
    if (selectedProducts.length === 0) {
      SnackBar.Error('Add at least one product');
      return;
    }
    if (selectedProducts.some((line) => {
      const quantity = Number(line.quantity);
      return !Number.isInteger(quantity) || quantity <= 0 || quantity > (line.product.currentStock ?? 0);
    })) {
      SnackBar.Error('Enter valid quantities within available stock');
      return;
    }
    if (numericDiscount > subtotal) {
      SnackBar.Error('Discount cannot be greater than the subtotal.');
      return;
    }

    setSaving(true);
    try {
      await saleService.createSale({
        customerId: customerId === WALK_IN ? undefined : customerId,
        taxRate: numericTaxRate,
        discount: numericDiscount,
        paidAmount: numericPaidAmount,
        items: selectedProducts.map((line) => ({
          productId: line.product.id,
          quantity: Number(line.quantity),
        })),
      });
      SnackBar.Success('Sale recorded successfully');
      router.back();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to record sale');
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
        <Text className="text-foreground" style={styles.headerTitle}>New Sale</Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.chart2} />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading sale options...</Text>
        </View>
      ) : (
        <>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ShopBanner
            label="Selling from"
            name={shopName}
            emptyText={shopLoaded ? 'No shop selected. Choose one from the top bar first.' : undefined}
          />

          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Customer</Text>
            <Pressable
              onPress={() => setCustomerPickerVisible(true)}
              style={[styles.customerSelector, { backgroundColor: theme.card, borderColor: theme.border }]}
              accessibilityRole="button"
              accessibilityLabel="Choose customer"
            >
              <View style={[styles.customerSelectorIcon, { backgroundColor: theme.secondary }]}>
                <Icon className="text-muted-foreground" as={User} size={14} />
              </View>
              <Text className="text-foreground" style={styles.customerSelectorText} numberOfLines={1}>
                {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
              </Text>
              <Icon className="text-muted-foreground" as={ChevronDown} size={16} />
            </Pressable>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderInfo}>
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Items ({selectedProducts.length})</Text>
                <Text style={[styles.helperText, { color: theme.mutedForeground }]}>Stock is deducted after saving.</Text>
              </View>
              <Pressable
                onPress={() => setPickerVisible(true)}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Add product"
                style={[styles.addButton, { borderColor: theme.chart2, backgroundColor: theme.secondary }]}
              >
                <Icon as={Plus} size={14} color={theme.chart2} />
                <Text style={[styles.addButtonText, { color: theme.chart2 }]}>Add</Text>
              </Pressable>
            </View>

            {selectedProducts.length === 0 ? (
              <View style={[styles.emptyProducts, { borderColor: theme.border }]}>
                <Text style={[styles.helperText, { color: theme.mutedForeground }]}>No products added yet.</Text>
              </View>
            ) : selectedProducts.map(({ product, quantity }) => (
              <View key={product.id} style={[styles.lineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.lineHeader}>
                  <View style={[styles.lineIcon, { backgroundColor: theme.secondary }]}>
                    <Icon className="text-muted-foreground" as={Package} size={16} />
                  </View>
                  <View style={styles.productInfo}>
                    <Text className="text-foreground" style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    <Text style={[styles.helperText, { color: theme.mutedForeground }]} numberOfLines={1}>
                      {money(product.salePrice ?? 0)} each · {product.currentStock ?? 0} available
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${product.name}`}
                    onPress={() => setSelectedProducts((current) => current.filter((line) => line.product.id !== product.id))}
                    style={styles.removeButton}
                  >
                    <Icon className="text-destructive" as={Trash2} size={16} />
                  </Pressable>
                </View>
                <View style={[styles.quantityRow, { borderTopColor: theme.border }]}>
                  <Text style={[styles.qtyLabel, { color: theme.mutedForeground }]}>Qty</Text>
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
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Summary</Text>
            <SummaryRow label="Subtotal" value={money(subtotal)} theme={theme} />
            <InputRow label="Discount" theme={theme}>
              <Input
                value={discount}
                onChangeText={setDiscount}
                keyboardType="decimal-pad"
                editable={!saving}
                style={styles.compactInput}
              />
            </InputRow>
            <InputRow label="Tax %" theme={theme}>
              <Input
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="decimal-pad"
                editable={!saving}
                style={styles.compactInput}
              />
            </InputRow>
            <SummaryRow label="Tax Amount" value={money(taxAmount)} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SummaryRow label="Net Total" value={money(netTotal)} strong theme={theme} />
            <InputRow label="Paid" theme={theme}>
              <Input
                value={paidAmount}
                onChangeText={setPaidAmount}
                keyboardType="decimal-pad"
                editable={!saving}
                style={styles.compactInput}
              />
            </InputRow>
            <SummaryRow label="Balance" value={money(balance)} strong color={balance > 0 ? theme.chart4 : theme.chart2} theme={theme} />
          </View>
        </ScrollView>

        <View style={[styles.actionBar, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
          <View style={styles.actionTotal}>
            <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>Net Total</Text>
            <Text style={[styles.actionTotalValue, { color: theme.foreground }]} numberOfLines={1}>{money(netTotal)}</Text>
          </View>
          <Button onPress={submitSale} disabled={saving || selectedProducts.length === 0} style={styles.saveButton}>
            {saving ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : <Text className="text-background font-semibold">Complete Sale</Text>}
          </Button>
        </View>
        </>
      )}

      <Modal visible={customerPickerVisible} transparent animationType="slide" onRequestClose={closeCustomerPicker}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCustomerPicker} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
            <View className="bg-background" style={styles.customerSheet}>
              {customerPickerStage === 'choice' ? (
                <>
                  <View style={styles.sheetHeader}>
                    <Text className="text-foreground" style={styles.sheetTitle}>Customer</Text>
                    <Button variant="ghost" onPress={closeCustomerPicker} style={styles.closeButton}>
                      <Icon className="text-foreground" as={X} size={20} />
                    </Button>
                  </View>

                  <Pressable
                    onPress={() => {
                      setCustomerId(WALK_IN);
                      closeCustomerPicker();
                    }}
                    style={[styles.customerChoiceRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Text className="text-foreground" style={styles.customerChoiceText}>Walk-in Customer</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setCustomerPickerStage('list')}
                    style={[styles.customerChoiceRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Text className="text-foreground" style={styles.customerChoiceText}>Choose Customer</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.sheetHeader}>
                    <Button variant="ghost" onPress={() => setCustomerPickerStage('choice')} style={styles.closeButton}>
                      <Icon className="text-foreground" as={ChevronLeft} size={20} />
                    </Button>
                    <Text className="text-foreground" style={styles.sheetTitle}>Choose Customer</Text>
                    <Button variant="ghost" onPress={closeCustomerPicker} style={styles.closeButton}>
                      <Icon className="text-foreground" as={X} size={20} />
                    </Button>
                  </View>

                  <View style={[styles.searchBox, { borderColor: theme.border }]}>
                    <Icon className="text-muted-foreground" as={Search} size={16} />
                    <TextInput
                      value={customerSearch}
                      onChangeText={setCustomerSearch}
                      placeholder="Search customers"
                      placeholderTextColor={theme.mutedForeground}
                      style={[styles.searchInput, { color: theme.foreground }]}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <FlatList
                    data={filteredCustomers}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={<Text className="text-muted-foreground" style={styles.emptyPicker}>No customers found.</Text>}
                    renderItem={({ item: customer }) => (
                      <Pressable
                        onPress={() => {
                          setCustomerId(customer.id);
                          closeCustomerPicker();
                        }}
                        style={[styles.customerOption, { borderBottomColor: theme.border }]}
                      >
                        <View style={styles.customerAvatarWrap}>
                          {customer.profilePictureUrl ? (
                            <Image source={{ uri: customer.profilePictureUrl }} style={styles.customerAvatarImage} />
                          ) : (
                            <View style={[styles.customerAvatarFallback, { backgroundColor: theme.secondary }]}>
                              <Icon className="text-muted-foreground" as={User} size={18} />
                            </View>
                          )}
                        </View>

                        <View style={styles.customerOptionInfo}>
                          <Text className="text-foreground" style={styles.customerNameText} numberOfLines={1}>{customer.name}</Text>
                          <Text className="text-muted-foreground" style={styles.helperText}>
                            {customer.phone || 'No phone'}
                          </Text>
                        </View>
                      </Pressable>
                    )}
                  />
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerVisible(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
            <View className="bg-background" style={styles.productSheet}>
              <View style={styles.sheetHeader}>
                <Text className="text-foreground" style={styles.sheetTitle}>Choose Product</Text>
                <Button variant="ghost" onPress={() => setPickerVisible(false)} style={styles.closeButton}>
                  <Icon className="text-foreground" as={X} size={20} />
                </Button>
              </View>
              <View style={[styles.searchBox, { borderColor: theme.border }]}>
                <Icon className="text-muted-foreground" as={Search} size={16} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search products"
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
                ListEmptyComponent={<Text className="text-muted-foreground" style={styles.emptyPicker}>No products found.</Text>}
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
                          {money(product.salePrice ?? 0)} · {stock} in stock
                        </Text>
                      </View>
                      {added ? <Text className="text-muted-foreground" style={styles.helperText}>Added</Text> : null}
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
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  customerSelectorIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customerSelectorText: { flex: 1, fontSize: 14, fontWeight: '600' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheetWrap: { justifyContent: 'flex-end', maxHeight: '90%' },
  customerSheet: { height: '90%', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  productSheet: { height: '82%', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { minWidth: 40 },
  customerChoiceRow: {
    minHeight: 56,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  customerChoiceText: { fontSize: 16, fontWeight: '600' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 14 },
  customerOption: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  customerAvatarWrap: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  customerAvatarImage: { width: '100%', height: '100%' },
  customerAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerOptionInfo: { flex: 1, gap: 3 },
  customerNameText: { fontSize: 15, fontWeight: '600' },
  productOption: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 9 },
  productOptionDisabled: { opacity: 0.5 },
  productOptionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  productOptionInfo: { flex: 1, gap: 4 },
  emptyPicker: { paddingVertical: 24, textAlign: 'center' },
});