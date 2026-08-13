'use client';

import * as React from 'react';
import { ActivityIndicator, Alert as RNAlert, Image, Modal, Pressable, RefreshControl, StyleSheet, View, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Plus, Pencil, Trash2, X, ChevronLeft, Image as ImageIcon } from 'lucide-react-native';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { SupplierServiceClient } from '@/services/supplierService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon } from '@/components/ui/icon';
import { SupplierItem } from '@/models/supplier';
import SnackBar from '@/components/ui/snack-bar';

export default function SuppliersScreen() {
  const router = useRouter();
  const service = React.useMemo(() => new SupplierServiceClient(), []);

  const [suppliers, setSuppliers] = React.useState<SupplierItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<SupplierItem | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadSuppliers = React.useCallback(async (requestedPage = 1, append = false, isRefresh = false) => {
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

      const data = await service.getSuppliers(requestedPage, 20);
      setSuppliers((prev) => (requestedPage === 1 || !append ? data : [...prev, ...data]));
      setPage(requestedPage);
      setHasMore(data.length >= 20);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to load suppliers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [service]);

  React.useEffect(() => {
    void loadSuppliers(1, false, false);
  }, [loadSuppliers]);

  const handleRefresh = React.useCallback(() => {
    void loadSuppliers(1, false, true);
  }, [loadSuppliers]);

  const handleLoadMore = React.useCallback(() => {
    if (loadingMore || !hasMore || loading || refreshing) {
      return;
    }
    void loadSuppliers(page + 1, true, false);
  }, [hasMore, loading, loadingMore, page, refreshing, loadSuppliers]);

  const handleScroll = React.useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 24) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  const openCreateModal = () => {
    setEditingSupplier({
      id: '',
      supplierName: '',
      isRequired: false,
      email: undefined,
      phoneNumber: undefined,
      address: undefined,
      stateDivision: undefined,
      city: undefined,
      country: undefined,
      logoUrl: undefined,
      rowVersion: '',
      createdAtUtc: '',
      updatedAtUtc: ''
    });
    setErrorMessage(null);
    setModalVisible(true);
  };

  const openEditModal = (supplier: SupplierItem) => {
    setEditingSupplier(supplier);
    setErrorMessage(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingSupplier(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!editingSupplier?.supplierName || editingSupplier.supplierName.trim() === '') {
      setErrorMessage('Supplier name is required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      if (editingSupplier.id) {
        await service.updateSupplier(editingSupplier);
        SnackBar.Success(`Supplier "${editingSupplier.supplierName}" updated successfully.`);
      } else {
        await service.createSupplier(editingSupplier);
        SnackBar.Success(`Supplier "${editingSupplier.supplierName}" created successfully.`);
      }
      await loadSuppliers(1, false, false);
      closeModal();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to save supplier.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (supplier: SupplierItem) => {
    RNAlert.alert(
      'Delete supplier',
      `Are you sure you want to delete "${supplier.supplierName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(supplier) },
      ]
    );
  };

  const handleDelete = async (supplier: SupplierItem) => {
    try {
      await service.deleteSupplier(supplier.id);
      SnackBar.Success(`Supplier "${supplier.supplierName}" deleted successfully.`);
      await loadSuppliers(1, false, false);
    } catch (error: any) {
      SnackBar.Error(error?.message || `Unable to delete supplier "${supplier.supplierName}".`);
    }
  };

  return (
    <SafeAreaView className='bg-background' style={styles.page}>
      <View className='bg-background border-b border-border' style={styles.headerBar}>
        <Button variant='ghost' onPress={() => router.back()} style={styles.backButton}>
          <Icon as={ChevronLeft} size={22} className='text-foreground' />
        </Button>
        <Text className='text-foreground' style={styles.headerTitle}>Suppliers</Text>
        <Button variant='default' size='sm' onPress={openCreateModal}>
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
            <ActivityIndicator size='large' />
            <Text className='text-muted-foreground' style={styles.emptyText}>Loading suppliers...</Text>
          </View>
        ) : suppliers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className='text-muted-foreground' style={styles.emptyText}>No suppliers yet.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {suppliers.map((supplier) => (
              <View className='bg-card border-border' key={supplier.id} style={styles.card}>
                <View style={styles.categoryInfo}>
                  <View style={styles.logoWrapper}>
                    {supplier.logoUrl ? (
                      <Image source={{ uri: supplier.logoUrl }} style={styles.supplierLogo} resizeMode='cover' />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <Icon as={ImageIcon} size={18} className='text-muted-foreground' />
                      </View>
                    )}
                  </View>
                  <View style={styles.supplierInfo}>
                    <Text className='text-foreground' style={styles.categoryName}>{supplier.supplierName}</Text>
                    <Badge variant={supplier.isRequired ? 'active' : 'muted'}>
                      <Text>{supplier.isRequired ? 'Required' : 'Optional'}</Text>
                    </Badge>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Icon as={Pencil} size={18} className='text-primary' style={{ marginLeft: 8 }} onPress={() => openEditModal(supplier)} />
                  <Icon as={Trash2} size={18} className='text-destructive' style={{ marginLeft: 8 }} onPress={() => confirmDelete(supplier)} />
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
              <Text variant='h4' className='text-foreground'>{editingSupplier ? 'Edit supplier' : 'Add supplier'}</Text>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Icon as={X} size={20} color='#4b5563' />
              </Pressable>
            </View>

            <Label className='text-foreground' style={styles.label}>Supplier Name</Label>
            <Input
              placeholder='Enter supplier name'
              value={editingSupplier?.supplierName}
              onChangeText={(text) => setEditingSupplier((prev: SupplierItem | null) => ({ ...prev, supplierName: text } as SupplierItem))}
              autoCapitalize='words'
              style={styles.input}
            />

            <Label className='text-foreground' style={styles.label}>Email</Label>
            <Input
              placeholder='Enter email'
              value={editingSupplier?.email}
              onChangeText={(text) => setEditingSupplier((prev: SupplierItem | null) => ({ ...prev, email: text } as SupplierItem))}
              keyboardType='email-address'
              style={styles.input}
            />

            <Label className='text-foreground' style={styles.label}>Phone</Label>
            <Input
              placeholder='Enter phone number'
              value={editingSupplier?.phoneNumber}
              onChangeText={(text) => setEditingSupplier((prev: SupplierItem | null) => ({ ...prev, phoneNumber: text } as SupplierItem))}
              keyboardType='phone-pad'
              style={styles.input}
            />

            <Label className='text-foreground' style={styles.label}>Address</Label>
            <Input
              placeholder='Enter address'
              value={editingSupplier?.address}
              onChangeText={(text) => setEditingSupplier((prev: SupplierItem | null) => ({ ...prev, address: text } as SupplierItem))}
              style={styles.input}
            />

            <Label className='text-foreground' style={styles.label}>State / Division</Label>
            <Input
              placeholder='Enter state or division'
              value={editingSupplier?.stateDivision}
              onChangeText={(text) => setEditingSupplier((prev: SupplierItem | null) => ({ ...prev, stateDivision: text } as SupplierItem))}
              style={styles.input}
            />

            <Label className='text-foreground' style={styles.label}>City</Label>
            <Input
              placeholder='Enter city'
              value={editingSupplier?.city}
              onChangeText={(text) => setEditingSupplier((prev: SupplierItem | null) => ({ ...prev, city: text } as SupplierItem))}
              style={styles.input}
            />

            <Label className='text-foreground' style={styles.label}>Country</Label>
            <Input
              placeholder='Enter country'
              value={editingSupplier?.country}
              onChangeText={(text) => setEditingSupplier((prev: SupplierItem | null) => ({ ...prev, country: text } as SupplierItem))}
              style={styles.input}
            />

            <Label className='text-foreground' style={styles.label}>Logo URL</Label>
            <Input
              placeholder='Enter logo url'
              value={editingSupplier?.logoUrl}
              onChangeText={(text) => setEditingSupplier((prev: SupplierItem | null) => ({ ...prev, logoUrl: text } as SupplierItem))}
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text className='text-foreground' style={styles.switchLabel}>Is Required</Text>
              <Switch value={editingSupplier?.isRequired} onValueChange={(value) => setEditingSupplier((prev: SupplierItem | null) => ({ ...prev, isRequired: value } as SupplierItem))} />
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
                {saving ? <ActivityIndicator size='small' color='#fff' /> : <Text className='text-primary-foreground'>Save</Text>}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButton: { minWidth: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  listContainer: { gap: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
  },
  categoryName: { fontSize: 16, fontWeight: '600' },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 },
  logoWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  supplierLogo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  supplierInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyState: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  closeButton: { padding: 4 },
  label: { marginBottom: 8 },
  input: { marginBottom: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingVertical: 4 },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  loadMoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  modalButton: { minWidth: 96 },
});
