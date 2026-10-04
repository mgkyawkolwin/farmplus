'use client';

import * as React from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Package, Search, X } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { ProductItem } from '@/models/product';
import { IProductService } from '@/services/productService';
import { getInventoryProducts } from '@/services/inventoryService';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);
type AdjustmentMode = 'set' | 'add' | 'remove';

export default function InventoryAdjustmentScreen() {
  const router = useRouter();
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<ProductItem | null>(null);
  const [mode, setMode] = React.useState<AdjustmentMode>('add');
  const [quantity, setQuantity] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    getInventoryProducts().then((result) => {
      if (active) setProducts(result);
    }).catch((error) => {
      if (active) SnackBar.Error(error instanceof Error ? error.message : 'Unable to load products');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const currentStock = selectedProduct?.currentStock ?? 0;
  const amount = Number(quantity);
  const projectedStock = mode === 'set'
    ? amount
    : mode === 'add'
      ? currentStock + amount
      : currentStock - amount;
  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.category ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const saveAdjustment = async () => {
    if (!selectedProduct) {
      SnackBar.Error('Choose a product first');
      return;
    }
    if (!Number.isInteger(amount) || amount < 0 || (mode !== 'set' && amount === 0)) {
      SnackBar.Error(mode === 'set' ? 'Enter a valid stock quantity' : 'Enter a positive whole adjustment quantity');
      return;
    }
    if (projectedStock < 0) {
      SnackBar.Error('Stock cannot be less than zero');
      return;
    }
    if (!selectedProduct.rowVersion) {
      SnackBar.Error('Product version is missing. Reload and try again.');
      return;
    }

    setSaving(true);
    try {
      await productService.updateProduct({
        id: selectedProduct.id,
        currentStock: projectedStock,
        rowVersion: selectedProduct.rowVersion,
      });
      SnackBar.Success(`Stock updated: ${selectedProduct.name}`);
      router.back();
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : 'Failed to adjust stock');
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
        <Text className="text-foreground" style={styles.headerTitle}>Stock Adjustment</Text>
        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading products...</Text>
        </View>
      ) : (
        <View style={styles.formContent}>
          <View style={styles.field}>
            <Label className="text-foreground">Product <Text className="text-red-500">*</Text></Label>
            <Button variant="outline" style={styles.productSelect} onPress={() => setPickerVisible(true)}>
              <Icon className="text-muted-foreground" as={Package} size={18} />
              <Text className={selectedProduct ? 'text-foreground' : 'text-muted-foreground'} style={styles.productSelectText} numberOfLines={1}>
                {selectedProduct?.name ?? 'Choose a product'}
              </Text>
            </Button>
            {selectedProduct ? (
              <Text className="text-muted-foreground" style={styles.stockHint}>
                Current stock: {currentStock.toLocaleString('en-US')} {selectedProduct.unit ?? ''}
              </Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Adjustment Type</Label>
            <View style={styles.segmentRow}>
              {[
                { key: 'add', label: 'Add' },
                { key: 'remove', label: 'Remove' },
                { key: 'set', label: 'Set Stock' },
              ].map((option) => {
                const selected = mode === option.key;
                return (
                  <Button
                    key={option.key}
                    variant={selected ? 'default' : 'outline'}
                    style={[styles.segmentButton, selected && styles.segmentSelected]}
                    onPress={() => setMode(option.key as AdjustmentMode)}
                  >
                    <Text className={selected ? 'text-background' : 'text-foreground'} style={styles.segmentText}>{option.label}</Text>
                  </Button>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{mode === 'set' ? 'New Stock Quantity' : 'Quantity'}</Label>
            <Input
              value={quantity}
              onChangeText={(value) => setQuantity(value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="Enter whole quantity"
              editable={!saving}
              className="mt-2"
            />
          </View>

          {selectedProduct && quantity ? (
            <View style={styles.preview}>
              <Text className="text-muted-foreground">New on-hand quantity</Text>
              <Text className="text-foreground" style={styles.previewValue}>
                {Number.isFinite(projectedStock) ? Math.max(0, projectedStock).toLocaleString('en-US') : '0'} {selectedProduct.unit ?? ''}
              </Text>
            </View>
          ) : null}

          <Button onPress={saveAdjustment} disabled={saving || !selectedProduct} style={styles.saveButton}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-background font-semibold">Save Adjustment</Text>}
          </Button>
        </View>
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
                renderItem={({ item: product }) => (
                  <Pressable
                    onPress={() => {
                      setSelectedProduct(product);
                      setQuantity('');
                      setPickerVisible(false);
                    }}
                    style={styles.productOption}
                  >
                    <View style={styles.productOptionInfo}>
                      <Text className="text-foreground" style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      <Text className="text-muted-foreground" style={styles.stockHint}>
                        {product.category || 'Uncategorized'} · {(product.currentStock ?? 0).toLocaleString('en-US')} {product.unit ?? ''}
                      </Text>
                    </View>
                  </Pressable>
                )}
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
  formContent: { padding: 20, gap: 22 },
  field: { gap: 8 },
  productSelect: { justifyContent: 'flex-start', minHeight: 46, marginTop: 2 },
  productSelectText: { flex: 1, textAlign: 'left' },
  stockHint: { fontSize: 12 },
  segmentRow: { flexDirection: 'row', gap: 7 },
  segmentButton: { flex: 1, minHeight: 40, paddingHorizontal: 5, borderRadius: 8 },
  segmentSelected: { backgroundColor: '#16794B' },
  segmentText: { fontSize: 12, fontWeight: '600' },
  preview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E5E7EB', paddingVertical: 14 },
  previewValue: { fontSize: 17, fontWeight: '700' },
  saveButton: { marginTop: 6 },
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
  productOption: { minHeight: 58, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D1D5DB', paddingVertical: 9 },
  productOptionInfo: { gap: 4 },
  productName: { fontSize: 14, fontWeight: '600' },
  emptyPicker: { paddingVertical: 24, textAlign: 'center' },
});