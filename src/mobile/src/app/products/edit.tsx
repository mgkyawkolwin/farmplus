"use client";

import * as React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import * as ImagePicker from "expo-image-picker";
import { ChevronLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";
import { Checkbox } from "@/components/ui/checkbox";
import UnauthorizedView from "@/components/unauthorized-view";
import DropdownModel, { DropdownModelItem } from "@/components/dropdownModel";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import SnackBar from "@/components/ui/snack-bar";
import { container, DI_TOKENS } from "@/di";
import LoadingOverlay from "@/components/loadingOverlay";
import { IProductService } from "@/services/productService";
import { BrandServiceClient } from "@/services/brandService";
import { CategoryServiceClient } from "@/services/categoryService";
import { UnitServiceClient } from "@/services/unitService";
import { ProductMediaItem } from "@/models/product";
import { normalizeMediaFile } from "@/lib/mediaFile";
import { useColorScheme } from "nativewind";
import { usePagePermission } from "@/lib/usePagePermission";
import { THEME } from "@/lib/theme";
import { useTranslation } from 'react-i18next';

const productService = container.resolve<IProductService>(
  DI_TOKENS.IProductService,
);

type ProductFormState = {
  name: string;
  description: string;
  brand: string;
  category: string;
  unit: string;
  salePrice: string;
  currentStock: string;
  minimumStock: string;
  rowVersion: string;
};

const emptyFormState: ProductFormState = {
  name: "",
  description: "",
  brand: "",
  category: "",
  unit: "",
  salePrice: "",
  currentStock: "",
  minimumStock: "",
  rowVersion: "",
};

export default function EditProductScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { colorScheme } = useColorScheme() ?? { colorScheme: "light" };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/products/edit');
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = React.useState(false);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [brands, setBrands] = React.useState<DropdownModelItem[]>([]);
  const [categories, setCategories] = React.useState<DropdownModelItem[]>([]);
  const [units, setUnits] = React.useState<DropdownModelItem[]>([]);
  const [isActive, setIsActive] = React.useState(true);
  const [formData, setFormData] =
    React.useState<ProductFormState>(emptyFormState);
  const [coverImageUri, setCoverImageUri] = React.useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = React.useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [existingMedia, setExistingMedia] = React.useState<ProductMediaItem[]>(
    [],
  );
  const [newMediaFiles, setNewMediaFiles] = React.useState<
    { uri: string; name: string; type: string }[]
  >([]);

  const brandService = React.useMemo(() => new BrandServiceClient(), []);
  const categoryService = React.useMemo(() => new CategoryServiceClient(), []);
  const unitService = React.useMemo(() => new UnitServiceClient(), []);

  const loadDropdownOptions = React.useCallback(async () => {
    try {
      setLoadingOptions(true);
      const [brandData, categoryData, unitData] = await Promise.all([
        brandService.getBrands(1, 100),
        categoryService.getCategories(1, 100),
        unitService.getUnits(1, 100),
      ]);

      setBrands(
        brandData.map((item) => ({ label: item.brand, value: item.brand })),
      );
      setCategories(
        categoryData.map((item) => ({
          label: item.category,
          value: item.category,
        })),
      );
      setUnits(
        unitData.map((item) => ({ label: item.unit, value: item.unit })),
      );
    } catch (error) {
      SnackBar.Error(t('products.messages.selectionOptionsFailed'));
    } finally {
      setLoadingOptions(false);
    }
  }, [brandService, categoryService, unitService, t]);

  React.useEffect(() => {
    if (permissionState === 'authorized') void loadDropdownOptions();
  }, [loadDropdownOptions, permissionState]);

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
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
          name: product.name ?? "",
          description: product.description ?? "",
          brand: product.brand ?? "",
          category: product.category ?? "",
          unit: product.unit ?? "",
          salePrice: product.salePrice != null ? String(product.salePrice) : "",
          currentStock:
            product.currentStock != null ? String(product.currentStock) : "",
          minimumStock:
            product.minimumStock != null ? String(product.minimumStock) : "",
          rowVersion: product.rowVersion ?? "",
        });
        setIsActive(product.isActive ?? true);
        setCoverImageUri(product.coverImageUrl ?? null);
        setExistingMedia(product.medias ?? []);
        setNewMediaFiles([]);
      } catch (error) {
        if (isActive) {
          SnackBar.Error(t('products.messages.detailsFailed'));
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
  }, [permissionState, productId, router, t]);

  const handleInputChange = (field: keyof ProductFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickCoverImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== ImagePicker.PermissionStatus.GRANTED) {
      SnackBar.Error(t('products.messages.photosPermission'));
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
    const normalizedFile = normalizeMediaFile({
      uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      assetType: asset.type,
      fallbackName: "product-cover",
    });

    setCoverImageUri(uri);
    setCoverImageFile(normalizedFile);
  };

  const removeCoverImage = () => {
    setCoverImageUri(null);
    setCoverImageFile(null);
  };

  const pickProductMedia = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== ImagePicker.PermissionStatus.GRANTED) {
      SnackBar.Error(t('products.messages.photosPermission'));
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
      return normalizeMediaFile({
        uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        assetType: asset.type,
        fallbackName: "product-media",
      });
    });

    setNewMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const removeExistingMedia = async (mediaId: string) => {
    if (!productId) return;

    try {
      setLoading(true);
      const updatedProduct = await productService.deleteProductMedia(
        productId,
        mediaId,
      );
      setExistingMedia(updatedProduct.medias ?? []);
      SnackBar.Success(t('products.messages.mediaRemoved'));
    } catch (error) {
      if (error instanceof Error) {
        SnackBar.Error(t('products.messages.mediaDeleteFailed', { message: error.message }));
      } else {
        SnackBar.Error(t('products.messages.mediaDeleteFailedFallback'));
      }
    } finally {
      setLoading(false);
    }
  };

  const removeNewMediaFile = (index: number) => {
    setNewMediaFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (permissionState !== 'authorized') return;
    if (!productId) return;
    if (!formData.name.trim()) {
      SnackBar.Error(t('products.messages.nameRequired'));
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
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        minimumStock: formData.minimumStock
          ? Number(formData.minimumStock)
          : undefined,
        isActive,
        rowVersion: formData.rowVersion,
      });

      if (coverImageFile) {
        await productService.uploadProductCoverImage(productId, coverImageFile);
      }

      if (newMediaFiles.length > 0) {
        for (const mediaFile of newMediaFiles) {
          await productService.uploadProductMedia(productId, mediaFile);
        }
      }

      setCoverImageFile(null);
      setNewMediaFiles([]);

      SnackBar.Success(t('products.messages.updated'));
      router.replace("/products/list");
    } catch (error) {
      if (error instanceof Error) {
        SnackBar.Error(t('products.messages.updateFailed', { message: error.message }));
      } else {
        SnackBar.Error(t('products.messages.updateFailedFallback'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar />
      <LoadingOverlay isLoading={loading || (permissionState === 'authorized' && pageLoading)} />

      <View
        className="bg-background border-b border-border"
        style={styles.headerBar}
      >
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerBarTitle}>
          {t('products.actions.edit')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('products.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('products.unauthorized.title')} message={t('products.unauthorized.description')} />
      ) : pageLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>
            {t('products.messages.loadingDetails')}
          </Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={styles.content}
          className="bg-background"
        >
          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.name')}</Label>
            <Input
              placeholder={t('products.placeholders.name')}
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              className="mt-2"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.description')}</Label>
            <Textarea
              placeholder={t('products.placeholders.description')}
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.brand')}</Label>
            <DropdownModel
              items={brands}
              value={formData.brand}
              placeholder={t('products.placeholders.brand')}
              title={t('products.placeholders.brand')}
              disabled={loading || loadingOptions || brands.length === 0}
              onSelect={(item) => handleInputChange("brand", item.value)}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.category')}</Label>
            <DropdownModel
              items={categories}
              value={formData.category}
              placeholder={t('products.placeholders.category')}
              title={t('products.placeholders.category')}
              disabled={loading || loadingOptions || categories.length === 0}
              onSelect={(item) => handleInputChange("category", item.value)}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.unit')}</Label>
            <DropdownModel
              items={units}
              value={formData.unit}
              placeholder={t('products.placeholders.unit')}
              title={t('products.placeholders.unit')}
              disabled={loading || loadingOptions || units.length === 0}
              onSelect={(item) => handleInputChange("unit", item.value)}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.coverImage')}</Label>
            {coverImageUri ? (
              <View style={styles.coverImagePreviewContainer}>
                <Image
                  source={{ uri: coverImageUri }}
                  style={styles.coverImagePreview}
                />
                <Button
                  variant="outline"
                  onPress={removeCoverImage}
                  disabled={loading}
                >
                  <Text className="text-foreground">{t('products.actions.removeImage')}</Text>
                </Button>
              </View>
            ) : (
              <Button
                variant="outline"
                onPress={pickCoverImage}
                disabled={loading}
              >
                <Text className="text-foreground">{t('products.actions.selectCoverImage')}</Text>
              </Button>
            )}
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.additionalImages')}</Label>
            {existingMedia.length > 0 && (
              <View style={styles.imageList}>
                {existingMedia.map((media) => (
                  <View
                    key={media.objectName}
                    style={styles.coverImagePreviewContainer}
                  >
                    <Image
                      source={{ uri: media.url ?? undefined }}
                      style={styles.coverImagePreview}
                    />
                    {media.id && (
                      <Button
                        variant="outline"
                        onPress={() => removeExistingMedia(media.id!)}
                        disabled={loading}
                      >
                        <Text className="text-foreground">{t('products.actions.remove')}</Text>
                      </Button>
                    )}
                  </View>
                ))}
              </View>
            )}
            {newMediaFiles.length > 0 && (
              <View style={styles.imageList}>
                {newMediaFiles.map((file, index) => (
                  <View
                    key={`${file.uri}-${index}`}
                    style={styles.coverImagePreviewContainer}
                  >
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.coverImagePreview}
                    />
                    <Button
                      variant="outline"
                      onPress={() => removeNewMediaFile(index)}
                      disabled={loading}
                    >
                      <Text className="text-foreground">{t('products.actions.remove')}</Text>
                    </Button>
                  </View>
                ))}
              </View>
            )}
            <Button
              variant="outline"
              onPress={pickProductMedia}
              disabled={loading}
            >
              <Text className="text-foreground">{t('products.actions.selectAdditionalImages')}</Text>
            </Button>
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.salePrice')}</Label>
            <Input
              placeholder="0"
              value={formData.salePrice}
              onChangeText={(value) => handleInputChange("salePrice", value)}
              className="mt-2"
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.currentStock')}</Label>
            <Text className="text-muted-foreground">
              {formData.currentStock || "0"}
            </Text>
          </View>

          <View style={styles.field}>
            <Label className="text-foreground">{t('products.fields.minimumStock')}</Label>
            <Input
              placeholder="0"
              value={formData.minimumStock}
              onChangeText={(value) => handleInputChange("minimumStock", value)}
              className="mt-2"
              keyboardType="numeric"
              editable={!loading}
            />
          </View>

          <View style={styles.checkboxField}>
            <Checkbox
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={loading}
            />
            <Text className="text-foreground ml-2">{t('products.fields.activeProduct')}</Text>
          </View>

          <View style={styles.actionsRow}>
            <Button
              variant="outline"
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text className="text-foreground">{t('products.actions.cancel')}</Text>
            </Button>
            <Button
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.primaryForeground} size="small" />
              ) : (
                <Text className="font-semibold" style={{ color: theme.primaryForeground }}>
                  {t('products.actions.saveChanges')}
                </Text>
              )}
            </Button>
          </View>
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButton: { minWidth: 40 },
  headerBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: { width: 40 },
  content: { padding: 16, gap: 12 },
  field: { gap: 6 },
  checkboxField: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  stateText: { textAlign: "center" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  cancelButton: { minWidth: 100 },
  submitButton: { minWidth: 140 },
  coverImagePreviewContainer: { gap: 8, marginTop: 10 },
  coverImagePreview: { width: "100%", height: 180, borderRadius: 8 },
  imageList: { marginTop: 8 },
  mediaPreview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    backgroundColor: THEME.light.muted,
  },
});
