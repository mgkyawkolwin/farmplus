'use client';

import * as React from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Plus, Search, Trash2, X } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { CustomerItem } from '@/models/customer';
import { ProductItem } from '@/models/product';
import { ICustomerService } from '@/services/customerService';
import { IProductService } from '@/services/productService';
import { ISaleService } from '@/services/saleService';

const customerService = container.resolve<ICustomerService>(DI_TOKENS.ICustomerService);
const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);
const saleService = container.resolve<ISaleService>(DI_TOKENS.ISaleService);

type SelectedProduct = { product: ProductItem; quantity: string };
const WALK_IN = 'walk-in';

function money(value: number) {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} MMK`;
}

export default function NewSaleScreen() {
  const router = useRouter();
  const [customers, setCustomers] = React.useState<CustomerItem[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [customerId, setCustomerId] = React.useState(WALK_IN);
  const [selectedProducts, setSelectedProducts] = React.useState<SelectedProduct[]>([]);
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
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
  }, []);

  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const subtotal = selectedProducts.reduce((sum, line) =>
    sum + (Number(line.quantity) || 0) * (line.product.salePrice ?? 0), 0,
  );
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

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

    setSaving(true);
    try {
      await saleService.createSale({
        customerId: customerId === WALK_IN ? undefined : customerId,
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

      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading sale options...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Label className="text-foreground">Customer</Label>
            <Select
              value={selectedCustomer ? { value: selectedCustomer.id, label: selectedCustomer.name } : { value: WALK_IN, label: 'Walk-in Customer' }}
              onValueChange={(option) => setCustomerId(option?.value ?? WALK_IN)}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Walk-in Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WALK_IN} label="Walk-in Customer" />
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id} label={customer.name} />
                ))}
              </SelectContent>
            </Select>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text className="text-foreground" style={styles.sectionTitle}>Products</Text>
              <Text className="text-muted-foreground" style={styles.helperText}>Available stock is deducted after saving.</Text>
            </View>
            <Button variant="outline" onPress={() => setPickerVisible(true)} disabled={saving}>
              <Icon className="text-foreground" as={Plus} size={16} />
              <Text className="text-foreground">Add Product</Text>
            </Button>
          </View>

          {selectedProducts.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Text className="text-muted-foreground">No products added yet.</Text>
            </View>
          ) : selectedProducts.map(({ product, quantity }) => (
            <View key={product.id} style={styles.lineCard}>
              <View style={styles.lineHeader}>
                <View style={styles.productInfo}>
                  <Text className="text-foreground" style={styles.productName} numberOfLines={1}>{product.name}</Text>
                  <Text className="text-muted-foreground" style={styles.helperText}>
                    {money(product.salePrice ?? 0)} each · {product.currentStock ?? 0} available
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${product.name}`}
                  onPress={() => setSelectedProducts((current) => current.filter((line) => line.product.id !== product.id))}
                  style={styles.removeButton}
                >
                  <Icon className="text-destructive" as={Trash2} size={18} />
                </Pressable>
              </View>
              <View style={styles.quantityRow}>
                <Label className="text-muted-foreground">Quantity</Label>
                <Input
                  value={quantity}
                  onChangeText={(value) => updateQuantity(product.id, value)}
                  keyboardType="number-pad"
                  editable={!saving}
                  style={styles.quantityInput}
                />
                <Text className="text-foreground" style={styles.lineTotal}>
                  {money((Number(quantity) || 0) * (product.salePrice ?? 0))}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text className="text-foreground" style={styles.totalLabel}>Subtotal before tax</Text>
            <Text className="text-foreground" style={styles.totalAmount}>{money(subtotal)}</Text>
          </View>
          <Button onPress={submitSale} disabled={saving || selectedProducts.length === 0} style={styles.saveButton}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-background font-semibold">Complete Sale</Text>}
          </Button>
        </ScrollView>
      )}

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
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
                  value={search}
                  onChangeText={setSearch}
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
                ListEmptyComponent={<Text className="text-muted-foreground" style={styles.emptyPicker}>No products found.</Text>}
                renderItem={({ item: product }) => {
                  const stock = product.currentStock ?? 0;
                  const added = selectedProducts.some((line) => line.product.id === product.id);
                  return (
                    <Pressable
                      onPress={() => addProduct(product)}
                      disabled={stock <= 0 || added}
                      style={[styles.productOption, (stock <= 0 || added) && styles.productOptionDisabled]}
                    >
                      <View style={styles.productOptionIcon}>
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
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  field: { gap: 7 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  helperText: { fontSize: 11 },
  emptyProducts: { paddingVertical: 22, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8 },
  lineCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, gap: 10 },
  lineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 13, fontWeight: '600' },
  removeButton: { padding: 6 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quantityInput: { width: 76, textAlign: 'center' },
  lineTotal: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '600' },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB', paddingVertical: 14 },
  totalLabel: { fontWeight: '600' },
  totalAmount: { fontSize: 17, fontWeight: '700' },
  saveButton: { marginTop: 2 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { marginTop: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.38)' },
  sheetWrap: { justifyContent: 'flex-end', maxHeight: '82%' },
  productSheet: { height: '82%', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { minWidth: 40 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, marginBottom: 8 },
  searchInput: { flex: 1, height: '100%', color: '#111827', fontSize: 14 },
  productOption: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D1D5DB', paddingVertical: 9 },
  productOptionDisabled: { opacity: 0.5 },
  productOptionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F6F4' },
  productOptionInfo: { flex: 1, gap: 4 },
  emptyPicker: { paddingVertical: 24, textAlign: 'center' },
});