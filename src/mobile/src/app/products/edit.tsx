'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import LoadingOverlay from '@/components/loadingOverlay';
import { IProductService } from '@/services/productService';
import { useColorScheme } from 'nativewind';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);

type ProductFormState = {
  name: string;
  description: string;
  brand: string;
  category: string;
  unit: string;
  purchasePrice: string;
  salePrice: string;
  currentStock: string;
  minimumStock: string;
  rowVersion: string;
};

const emptyFormState: ProductFormState = {
  name: '',
  description: '',
  brand: '',
  category: '',
  unit: '',
  purchasePrice: '',
  salePrice: '',
  currentStock: '',
  minimumStock: '',
  rowVersion: '',
};

export default function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [formData, setFormData] = React.useState<ProductFormState>(emptyFormState);

  React.useEffect(() => {
    if (!productId) {
      router.back();
      return;
    }

    let isActive = true;

    const loadProduct = async () => {
      setPageLoading(true);
      try {
        const product = await productService.getProductById(productId);
        if (!isActive) return;
        setFormData({
          name: product.name ?? '',
          description: product.description ?? '',
          brand: product.brand ?? '',
          category: product.category ?? '',
          unit: product.unit ?? '',
          purchasePrice: product.purchasePrice != null ? String(product.purchasePrice) : '',
          salePrice: product.salePrice != null ? String(product.salePrice) : '',
          currentStock: product.currentStock != null ? String(product.currentStock) : '',
          minimumStock: product.minimumStock != null ? String(product.minimumStock) : '',
          rowVersion: product.rowVersion ?? '',
        });
      } catch (error) {
        if (isActive) {
          SnackBar.Error('Failed to load product details');
          router.back();
        }
      } finally {
        if (isActive) {
          setPageLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [productId, router]);

  const handleInputChange = (field: keyof ProductFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!productId) return;
    if (!formData.name.trim()) {
      SnackBar.Error('Name is required');
      return;
    }

    try {
      setLoading(true);
      await productService.updateProduct({
        id: productId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        category: formData.category.trim() || undefined,
        unit: formData.unit.trim() || undefined,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        currentStock: formData.currentStock ? Number(formData.currentStock) : undefined,
        minimumStock: formData.minimumStock ? Number(formData.minimumStock) : undefined,
        rowVersion: formData.rowVersion,
      });
      SnackBar.Success('Product updated successfully');
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        SnackBar.Error(`Failed to update product: ${error.message}`);
      } else {
        SnackBar.Error('Failed to update product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar className="bg-background" barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'} />
      <LoadingOverlay isLoading={loading || pageLoading} />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerBarTitle}>
          Edit Product
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {pageLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading product details...</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView contentContainerStyle={styles.content} className="bg-background">
          <View style={styles.field}>
            <Label className="text-foreground">Name</Label>
            <Input placeholder="Enter product name" value={formData.name} onChangeText={(value) => handleInputChange('name', value)} className="mt-2" editable={!loading} />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Description</Label>
            <Input placeholder="Enter description" value={formData.description} onChangeText={(value) => handleInputChange('description', value)} className="mt-2" editable={!loading} />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Brand</Label>
            <Input placeholder="Enter brand" value={formData.brand} onChangeText={(value) => handleInputChange('brand', value)} className="mt-2" editable={!loading} />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Category</Label>
            <Input placeholder="Enter category" value={formData.category} onChangeText={(value) => handleInputChange('category', value)} className="mt-2" editable={!loading} />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Unit</Label>
            <Input placeholder="Enter unit" value={formData.unit} onChangeText={(value) => handleInputChange('unit', value)} className="mt-2" editable={!loading} />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Purchase Price</Label>
            <Input placeholder="0" value={formData.purchasePrice} onChangeText={(value) => handleInputChange('purchasePrice', value)} className="mt-2" keyboardType="numeric" editable={!loading} />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Sale Price</Label>
            <Input placeholder="0" value={formData.salePrice} onChangeText={(value) => handleInputChange('salePrice', value)} className="mt-2" keyboardType="numeric" editable={!loading} />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Current Stock</Label>
            <Input placeholder="0" value={formData.currentStock} onChangeText={(value) => handleInputChange('currentStock', value)} className="mt-2" keyboardType="numeric" editable={!loading} />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">Minimum Stock</Label>
            <Input placeholder="0" value={formData.minimumStock} onChangeText={(value) => handleInputChange('minimumStock', value)} className="mt-2" keyboardType="numeric" editable={!loading} />
          </View>

          <View style={styles.actionsRow}>
            <Button variant="outline" style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
              <Text className="text-foreground">Cancel</Text>
            </Button>
            <Button style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-background font-semibold">Save Changes</Text>}
            </Button>
          </View>
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  backButton: { minWidth: 40 },
  headerBarTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },
  content: { padding: 16, gap: 12 },
  field: { gap: 6 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  stateText: { textAlign: 'center' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancelButton: { minWidth: 100 },
  submitButton: { minWidth: 140 },
});
