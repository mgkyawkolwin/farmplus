'use client';

import * as React from 'react';
import { ActivityIndicator, Alert as RNAlert, Modal, Pressable, RefreshControl, StyleSheet, View, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Plus, Pencil, Trash2, X, ChevronLeft } from 'lucide-react-native';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { BrandServiceClient } from '@/services/brandService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon } from '@/components/ui/icon';
import { BrandItem } from '@/models/brand';
import SnackBar from '@/components/ui/snack-bar';

export default function BrandsScreen() {
  const router = useRouter();
  const service = React.useMemo(() => new BrandServiceClient(), []);

  const [brands, setBrands] = React.useState<BrandItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<BrandItem | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadBrands = React.useCallback(async (requestedPage = 1, append = false, isRefresh = false) => {
    try {
      if (requestedPage === 1 && !append) {
        setLoading(true);
      }
      if (requestedPage > 1) {
        setLoadingMore(true);
      }
      if (isRefresh) {
        setRefreshing(true);
      }
      setErrorMessage(null);

      const data = await service.getBrands(requestedPage, 20);
      setBrands((prev) => (requestedPage === 1 || !append ? data : [...prev, ...data]));
      setPage(requestedPage);
      setHasMore(data.length >= 20);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to load brands.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [service]);

  React.useEffect(() => {
    void loadBrands(1, false, false);
  }, [loadBrands]);

  const handleRefresh = React.useCallback(() => {
    void loadBrands(1, false, true);
  }, [loadBrands]);

  const handleLoadMore = React.useCallback(() => {
    if (loadingMore || !hasMore || loading || refreshing) {
      return;
    }

    void loadBrands(page + 1, true, false);
  }, [hasMore, loading, loadingMore, page, refreshing, loadBrands]);

  const handleScroll = React.useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 24) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  const openCreateModal = () => {
    setEditingBrand({ id: '', brand: '', isActive: true, rowVersion: '', createdAtUtc: '', updatedAtUtc: '' });
    setErrorMessage(null);
    setModalVisible(true);
  };

  const openEditModal = (brand: BrandItem) => {
    setEditingBrand(brand);
    setErrorMessage(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingBrand(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!editingBrand?.brand || editingBrand.brand.trim() === '') {
      setErrorMessage('Brand name is required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      if (editingBrand.id) {
        await service.updateBrand(editingBrand);
        SnackBar.Success(`Brand "${editingBrand.brand}" updated successfully.`);
      } else {
        await service.createBrand(editingBrand.brand, editingBrand.isActive);
        SnackBar.Success(`Brand "${editingBrand.brand}" created successfully.`);
      }
      await loadBrands(1, false, false);
      closeModal();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to save brand.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (brand: BrandItem) => {
    RNAlert.alert(
      'Delete brand',
      `Are you sure you want to delete "${brand.brand}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(brand) },
      ]
    );
  };

  const handleDelete = async (brand: BrandItem) => {
    try {
      await service.deleteBrand(brand.id);
      SnackBar.Success(`Brand "${brand.brand}" deleted successfully.`);
      await loadBrands(1, false, false);
    } catch (error: any) {
      SnackBar.Error(error?.message || `Unable to delete brand "${brand.brand}".`);
    }
  };

  return (
    <SafeAreaView className='bg-background' style={styles.page}>
      <View className='bg-background border-b border-border' style={styles.headerBar}>
        <Button variant='ghost' onPress={() => router.back()} style={styles.backButton}>
          <Icon as={ChevronLeft} size={22} className='text-foreground' />
        </Button>
        <Text className='text-foreground' style={styles.headerTitle}>Brand</Text>
        <Button variant='default' size='sm' onPress={openCreateModal} >
          <Icon as={Plus} size={14} className='text-primary-foreground' />
          <Text className='text-primary-foreground'>Add</Text>
        </Button>
      </View>

      <KeyboardAwareScrollView
        className='bg-background'
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {loading && !refreshing ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" />
            <Text className='text-muted-foreground' style={styles.emptyText}>Loading brands...</Text>
          </View>
        ) : brands.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className='text-muted-foreground' style={styles.emptyText}>No brands yet.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {brands.map((brand) => (
              <View className='bg-card border-border' key={brand.id} style={styles.card}>
                <View style={styles.categoryInfo}>
                  <Text className='text-foreground' style={styles.categoryName}>
                    {brand.brand}
                  </Text>
                  <Badge variant={brand.isActive ? 'active' : 'muted'}>
                    <Text>{brand.isActive ? 'Active' : 'Inactive'}</Text>
                  </Badge>
                </View>

                <View style={styles.actions}>
                  <Icon as={Pencil} size={18} className='text-primary' style={{ marginLeft: 8 }} onPress={() => openEditModal(brand)} />
                  <Icon as={Trash2} size={18} className='text-destructive' style={{ marginLeft: 8 }} onPress={() => confirmDelete(brand)} />
                </View>
              </View>
            ))}
          </View>
        )}
        {loadingMore ? (
          <View style={styles.loadMoreRow}>
            <ActivityIndicator size='small' />
            <Text className='text-muted-foreground'>Loading more...</Text>
          </View>
        ) : null}
        {errorMessage ? (
          <Alert variant='destructive' icon={X} className='mt-3'>
            <AlertTitle>Unable to continue</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
      </KeyboardAwareScrollView>

      <Modal visible={modalVisible} transparent animationType='slide' onRequestClose={closeModal}>
        <KeyboardAvoidingView className='bg-[hsla(0,0%,0%,0.5)]' style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className='bg-card border-border' style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text variant='h4' className='text-foreground'>{editingBrand ? 'Edit brand' : 'Add brand'}</Text>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Icon as={X} size={20} color="#4b5563" />
              </Pressable>
            </View>

            <Label className='text-foreground' style={styles.label}>Brand name</Label>
            <Input
              placeholder='Enter brand name'
              value={editingBrand?.brand}
              onChangeText={(text) => setEditingBrand((prev: BrandItem | null) => ({ ...prev, brand: text } as (BrandItem | null)))}
              autoCapitalize='words'
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text className='text-foreground' style={styles.switchLabel}>Is Active</Text>
              <Switch value={editingBrand?.isActive} onValueChange={(value) => setEditingBrand((prev: BrandItem | null) => ({ ...prev, isActive: value } as (BrandItem | null)))} />
            </View>

            {errorMessage ? (
              <Alert variant='destructive' icon={X} className='mt-3'>
                <AlertTitle>Unable to save</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <View style={styles.modalActions}>
              <Button variant='outline' size='sm' onPress={closeModal} style={styles.modalButton}>
                <Text className='text-foreground'>Cancel</Text>
              </Button>
              <Button variant='default' size='sm' onPress={handleSubmit} disabled={saving} style={styles.modalButton}>
                {saving ? <ActivityIndicator size='small' color="#fff" /> : <Text className='text-primary-foreground'>Save</Text>}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButton: {
    minWidth: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    gap: 4,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  listContainer: {
    gap: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  modalButton: {
    minWidth: 96,
  },
});
