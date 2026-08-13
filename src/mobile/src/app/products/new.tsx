'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import DropdownModel, { DropdownModelItem } from '@/components/dropdownModel';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import LoadingOverlay from '@/components/loadingOverlay';
import { IProductService } from '@/services/productService';
import { BrandServiceClient } from '@/services/brandService';
import { CategoryServiceClient } from '@/services/categoryService';
import { UnitServiceClient } from '@/services/unitService';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);

export default function NewProductScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const [loading, setLoading] = React.useState(false);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [brands, setBrands] = React.useState<DropdownModelItem[]>([]);
  const [categories, setCategories] = React.useState<DropdownModelItem[]>([]);
  const [units, setUnits] = React.useState<DropdownModelItem[]>([]);

  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    brand: '',
    category: '',
    unit: '',
    purchasePrice: '',
    salePrice: '',
    currentStock: '',
    minimumStock: '',
  });
  const [coverImageUri, setCoverImageUri] = React.useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = React.useState<{ uri: string; name: string; type: string } | null>(null);
  const [productMediaFiles, setProductMediaFiles] = React.useState<{ uri: string; name: string; type: string }[]>([]);

  const brandService = React.useMemo(() => new BrandServiceClient(), []);
  const categoryService = React.useMemo(() => new CategoryServiceClient(), []);
  const unitService = React.useMemo(() => new UnitServiceClient(), []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const loadDropdownOptions = React.useCallback(async () => {
    try {
      setLoadingOptions(true);
      const [brandData, categoryData, unitData] = await Promise.all([
        brandService.getBrands(1, 100),
        categoryService.getCategories(1, 100),
        unitService.getUnits(1, 100),
      ]);

      setBrands(brandData.map((item) => ({ label: item.brand, value: item.brand })));
      setCategories(categoryData.map((item) => ({ label: item.category, value: item.category })));
      setUnits(unitData.map((item) => ({ label: item.unit, value: item.unit })));
    } catch (error) {
      SnackBar.Error('Unable to load selection options.');
    } finally {
      setLoadingOptions(false);
    }
  }, [brandService, categoryService, unitService]);

  React.useEffect(() => {
    void loadDropdownOptions();
  }, [loadDropdownOptions]);

  const pickCoverImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== ImagePicker.PermissionStatus.GRANTED) {
      SnackBar.Error('Permission to access photos is required.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets?.length) {
      return;
    }

    const asset = pickerResult.assets[0];
    if (!asset.uri) {
      return;
    }

    const uri = asset.uri;
    const name = asset.fileName ?? uri.split('/').pop() ?? `product-cover-${Date.now()}.jpg`;
    const type = asset.type ? `${asset.type}/${uri.split('.').pop() ?? 'jpeg'}` : 'image/jpeg';

    setCoverImageUri(uri);
    setCoverImageFile({ uri, name, type });
  };

  const removeCoverImage = () => {
    setCoverImageUri(null);
    setCoverImageFile(null);
  };

  const pickProductMedia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== ImagePicker.PermissionStatus.GRANTED) {
      SnackBar.Error('Permission to access photos is required.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (pickerResult.canceled || !pickerResult.assets?.length) {
      return;
    }

    const newFiles = pickerResult.assets.map((asset) => {
      const uri = asset.uri;
      const name = asset.fileName ?? uri.split('/').pop() ?? `product-media-${Date.now()}.jpg`;
      const type = asset.type ? `${asset.type}/${uri.split('.').pop() ?? 'jpeg'}` : 'image/jpeg';
      return { uri, name, type };
    });

    setProductMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const removeProductMedia = (index: number) => {
    setProductMediaFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      SnackBar.Error('Name is required');
      return;
    }

    try {
      setLoading(true);
      const createdProduct = await productService.createProduct({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        category: formData.category.trim() || undefined,
        unit: formData.unit.trim() || undefined,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        currentStock: formData.currentStock ? Number(formData.currentStock) : undefined,
        minimumStock: formData.minimumStock ? Number(formData.minimumStock) : undefined,
      });

      if (coverImageFile) {
        await productService.uploadProductCoverImage(createdProduct.id, coverImageFile);
      }

      if (productMediaFiles.length > 0) {
        for (const mediaFile of productMediaFiles) {
          await productService.uploadProductMedia(createdProduct.id, mediaFile);
        }
      }

      SnackBar.Success('Product created successfully');
      router.back();
    } catch (error) {
      if (error instanceof Error) {
        SnackBar.Error(`Failed to create product: ${error.message}`);
      } else {
        SnackBar.Error('Failed to create product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar className="bg-background" barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'} />
      <LoadingOverlay isLoading={loading} />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerBarTitle}>
          New Product
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 40 }}
        enableOnAndroid={true}
        extraScrollHeight={40}
        keyboardShouldPersistTaps="handled"
        className="bg-background">
        <View style={styles.field}>
          <Label className="text-foreground">Name *</Label>
          <Input placeholder="Enter product name" value={formData.name} onChangeText={(value) => handleInputChange('name', value)} className="mt-2" editable={!loading} />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Description *</Label>
          <Input placeholder="Enter description" value={formData.description} onChangeText={(value) => handleInputChange('description', value)} className="mt-2" editable={!loading} />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Brand *</Label>
          <DropdownModel
            items={brands}
            value={formData.brand}
            placeholder="Select brand"
            title="Select Brand"
            disabled={loading || loadingOptions || brands.length === 0}
            onSelect={(item) => handleInputChange('brand', item.value)}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Category *</Label>
          <DropdownModel
            items={categories}
            value={formData.category}
            placeholder="Select category"
            title="Select Category"
            disabled={loading || loadingOptions || categories.length === 0}
            onSelect={(item) => handleInputChange('category', item.value)}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Unit *</Label>
          <DropdownModel
            items={units}
            value={formData.unit}
            placeholder="Select unit"
            title="Select Unit"
            disabled={loading || loadingOptions || units.length === 0}
            onSelect={(item) => handleInputChange('unit', item.value)}
          />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Purchase Price *</Label>
          <Input placeholder="0" value={formData.purchasePrice} onChangeText={(value) => handleInputChange('purchasePrice', value)} className="mt-2" keyboardType="numeric" editable={!loading} />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Sale Price *</Label>
          <Input placeholder="0" value={formData.salePrice} onChangeText={(value) => handleInputChange('salePrice', value)} className="mt-2" keyboardType="numeric" editable={!loading} />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Current Stock *</Label>
          <Input placeholder="0" value={formData.currentStock} onChangeText={(value) => handleInputChange('currentStock', value)} className="mt-2" keyboardType="numeric" editable={!loading} />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Minimum Stock *</Label>
          <Input placeholder="0" value={formData.minimumStock} onChangeText={(value) => handleInputChange('minimumStock', value)} className="mt-2" keyboardType="numeric" editable={!loading} />
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Cover Image</Label>
          {coverImageUri ? (
            <View style={styles.coverImagePreviewContainer}>
              <Image source={{ uri: coverImageUri }} style={styles.coverImagePreview} />
              <Button variant="outline" onPress={removeCoverImage} disabled={loading}>
                <Text className="text-foreground">Remove image</Text>
              </Button>
            </View>
          ) : (
            <Button variant="outline" onPress={pickCoverImage} disabled={loading}>
              <Text className="text-foreground">Select cover image</Text>
            </Button>
          )}
        </View>

        <View style={styles.field}>
          <Label className="text-foreground">Product Images</Label>
          {productMediaFiles.length > 0 ? (
            productMediaFiles.map((file, index) => (
              <View key={`${file.uri}-${index}`} style={styles.coverImagePreviewContainer}>
                <Image source={{ uri: file.uri }} style={styles.coverImagePreview} />
                <Button variant="outline" onPress={() => removeProductMedia(index)} disabled={loading}>
                  <Text className="text-foreground">Remove</Text>
                </Button>
              </View>
            ))
          ) : null}
          <Button variant="outline" onPress={pickProductMedia} disabled={loading}>
            <Text className="text-foreground">Select product images</Text>
          </Button>
        </View>

        <View style={styles.actionsRow}>
          <Button variant="outline" style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
            <Text className="text-foreground">Cancel</Text>
          </Button>
          <Button style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-background font-semibold">Save</Text>}
          </Button>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  backButton: { minWidth: 40 },
  headerBarTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },
  content: { flexGrow: 1, padding: 16, gap: 12 },
  field: { gap: 6 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancelButton: { flex: 1, minWidth: 100 },
  submitButton: { flex: 1, minWidth: 140 },
  coverImagePreviewContainer: { gap: 8, marginTop: 10 },
  coverImagePreview: { width: '100%', height: 180, borderRadius: 8 },
});
