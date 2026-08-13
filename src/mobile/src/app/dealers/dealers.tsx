'use client';

import * as React from 'react';
import { ActivityIndicator, Alert as RNAlert, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Plus, Pencil, Trash2, X, ChevronLeft, Image as ImageIcon } from 'lucide-react-native';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { DealerServiceClient } from '@/services/dealerService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon } from '@/components/ui/icon';
import { DealerItem } from '@/models/dealer';
import SnackBar from '@/components/ui/snack-bar';

export default function DealersScreen() {
  const router = useRouter();
  const service = React.useMemo(() => new DealerServiceClient(), []);

  const [dealers, setDealers] = React.useState<DealerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingDealer, setEditingDealer] = React.useState<DealerItem | null>(null);
  const [logoImage, setLogoImage] = React.useState<string | null>(null);
  const [logoFile, setLogoFile] = React.useState<{ uri: string; name: string; type: string } | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadDealers = React.useCallback(async (requestedPage = 1, append = false, isRefresh = false) => {
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

      const data = await service.getDealers(requestedPage, 20);
      setDealers((prev) => (requestedPage === 1 || !append ? data : [...prev, ...data]));
      setPage(requestedPage);
      setHasMore(data.length >= 20);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to load dealers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [service]);

  React.useEffect(() => {
    void loadDealers(1, false, false);
  }, [loadDealers]);

  const handleRefresh = React.useCallback(() => {
    void loadDealers(1, false, true);
  }, [loadDealers]);

  const handleLoadMore = React.useCallback(() => {
    if (loadingMore || !hasMore || loading || refreshing) {
      return;
    }
    void loadDealers(page + 1, true, false);
  }, [hasMore, loading, loadingMore, page, refreshing, loadDealers]);

  const handleScroll = React.useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 24) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  const openCreateModal = () => {
    setEditingDealer({
      id: '',
      dealerName: '',
      isActive: false,
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
    setLogoImage(null);
    setLogoFile(null);
    setErrorMessage(null);
    setModalVisible(true);
  };

  const openEditModal = (dealer: DealerItem) => {
    setEditingDealer(dealer);
    setLogoImage(dealer.logoUrl ?? null);
    setLogoFile(null);
    setErrorMessage(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingDealer(null);
    setLogoImage(null);
    setLogoFile(null);
    setErrorMessage(null);
  };

  const pickLogo = async () => {
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
    const name = asset.fileName ?? uri.split('/').pop() ?? `dealer-logo-${Date.now()}.jpg`;
    const type = asset.type ? `${asset.type}/${uri.split('.').pop() ?? 'jpeg'}` : 'image/jpeg';

    setLogoImage(uri);
    setLogoFile({ uri, name, type });
  };

  const removeLogo = () => {
    setLogoImage(null);
    setLogoFile(null);
    setEditingDealer((prev: DealerItem | null) => prev ? ({ ...prev, logoUrl: null } as DealerItem) : prev);
  };

  const handleSubmit = async () => {
    if (!editingDealer?.dealerName || editingDealer.dealerName.trim() === '') {
      SnackBar.Error('Dealer name is required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      let dealerId = editingDealer.id;
      const dealerPayload = { ...editingDealer } as any;

      if (dealerPayload.logoUrl === undefined) {
        delete dealerPayload.logoUrl;
      }

      if (dealerPayload.logoUrl === null) {
        dealerPayload.clearLogoUrl = true;
        delete dealerPayload.logoUrl;
      }

      if (dealerId) {
        await service.updateDealer(dealerPayload as DealerItem);
      } else {
        const createdDealer = await service.createDealer(dealerPayload);
        dealerId = createdDealer.id;
      }

      if (logoFile && dealerId) {
        await service.uploadDealerLogo(dealerId, logoFile);
      }

      SnackBar.Success(`Dealer "${editingDealer.dealerName}" ${editingDealer.id ? 'updated' : 'created'} successfully.`);
      await loadDealers(1, false, false);
      closeModal();
    } catch (error: any) {
      SnackBar.Error(error?.message || 'Unable to save dealer.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (dealer: DealerItem) => {
    RNAlert.alert(
      'Delete dealer',
      `Are you sure you want to delete "${dealer.dealerName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(dealer) },
      ]
    );
  };

  const handleDelete = async (dealer: DealerItem) => {
    try {
      await service.deleteDealer(dealer.id);
      SnackBar.Success(`Dealer "${dealer.dealerName}" deleted successfully.`);
      await loadDealers(1, false, false);
    } catch (error: any) {
      SnackBar.Error(error?.message || `Unable to delete dealer "${dealer.dealerName}".`);
    }
  };

  return (
    <SafeAreaView className='bg-background' style={styles.page}>
      <View className='bg-background border-b border-border' style={styles.headerBar}>
        <Button variant='ghost' onPress={() => router.back()} style={styles.backButton}>
          <Icon as={ChevronLeft} size={22} className='text-foreground' />
        </Button>
        <Text className='text-foreground' style={styles.headerTitle}>Dealers</Text>
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
            <Text className='text-muted-foreground' style={styles.emptyText}>Loading dealers...</Text>
          </View>
        ) : dealers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className='text-muted-foreground' style={styles.emptyText}>No dealers yet.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {dealers.map((dealer) => (
              <View className='bg-card border-border' key={dealer.id} style={styles.card}>
                <View style={styles.categoryInfo}>
                  <View style={styles.logoWrapper}>
                    {dealer.logoUrl ? (
                      <Image source={{ uri: dealer.logoUrl }} style={styles.dealerLogo} resizeMode='cover' />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <Icon as={ImageIcon} size={18} className='text-muted-foreground' />
                      </View>
                    )}
                  </View>
                  <View style={styles.dealerInfo}>
                    <Text className='text-foreground' style={styles.categoryName}>{dealer.dealerName}</Text>
                    <Badge style={{ maxWidth: 70 }} variant={dealer.isActive ? 'active' : 'muted'}>
                      <Text>{dealer.isActive ? 'Active' : 'Inactive'}</Text>
                    </Badge>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Icon as={Pencil} size={18} className='text-primary' style={{ marginLeft: 8 }} onPress={() => openEditModal(dealer)} />
                  <Icon as={Trash2} size={18} className='text-destructive' style={{ marginLeft: 8 }} onPress={() => confirmDelete(dealer)} />
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
      </KeyboardAwareScrollView>

      <Modal visible={modalVisible} transparent animationType='slide' onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            className='bg-card border-border'
            style={styles.modalSheet}
          >
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps='handled'
              automaticallyAdjustKeyboardInsets={true}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.modalHeader}>
                <Text variant='h4' className='text-foreground'>
                  {editingDealer?.id ? 'Edit Dealer' : 'Add Dealer'}
                </Text>
                <Pressable onPress={closeModal} style={styles.closeButton}>
                  <Icon as={X} size={20} color='#4b5563' />
                </Pressable>
              </View>

              <Label className='text-foreground' style={styles.label}>Dealer Name</Label>
              <Input
                placeholder='Enter dealer name'
                value={editingDealer?.dealerName}
                onChangeText={(text) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, dealerName: text } as DealerItem))}
                autoCapitalize='words'
                style={styles.input}
              />

              <Label className='text-foreground' style={styles.label}>Email</Label>
              <Input
                placeholder='Enter email'
                value={editingDealer?.email}
                onChangeText={(text) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, email: text } as DealerItem))}
                keyboardType='email-address'
                style={styles.input}
              />

              <Label className='text-foreground' style={styles.label}>Phone</Label>
              <Input
                placeholder='Enter phone number'
                value={editingDealer?.phoneNumber}
                onChangeText={(text) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, phoneNumber: text } as DealerItem))}
                keyboardType='phone-pad'
                style={styles.input}
              />

              <Label className='text-foreground' style={styles.label}>Address</Label>
              <Input
                placeholder='Enter address'
                value={editingDealer?.address}
                onChangeText={(text) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, address: text } as DealerItem))}
                style={styles.input}
              />

              <Label className='text-foreground' style={styles.label}>State / Division</Label>
              <Input
                placeholder='Enter state or division'
                value={editingDealer?.stateDivision}
                onChangeText={(text) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, stateDivision: text } as DealerItem))}
                style={styles.input}
              />

              <Label className='text-foreground' style={styles.label}>City</Label>
              <Input
                placeholder='Enter city'
                value={editingDealer?.city}
                onChangeText={(text) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, city: text } as DealerItem))}
                style={styles.input}
              />

              <Label className='text-foreground' style={styles.label}>Country</Label>
              <Input
                placeholder='Enter country'
                value={editingDealer?.country}
                onChangeText={(text) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, country: text } as DealerItem))}
                style={styles.input}
              />

              <Label className='text-foreground' style={styles.label}>Dealer Logo</Label>
              {logoImage ? (
                <View style={styles.logoPreviewContainer}>
                  <Image source={{ uri: logoImage }} style={styles.logoPreview} resizeMode='cover' />
                  <Button variant='ghost' size='sm' onPress={removeLogo} style={styles.removeLogoButton}>
                    <Text className='text-destructive'>Remove</Text>
                  </Button>
                </View>
              ) : null}
              <Button variant='outline' size='sm' onPress={pickLogo} style={styles.pickerButton}>
                <Text className='text-foreground'>{logoImage ? 'Change logo' : 'Choose logo'}</Text>
              </Button>

              <View style={styles.switchRow}>
                <Text className='text-foreground' style={styles.switchLabel}>Is Active</Text>
                <Switch
                  value={editingDealer?.isActive}
                  onValueChange={(value) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, isActive: value } as DealerItem))}
                />
              </View>

              <View style={styles.modalActions}>
                <Button variant='outline' size='sm' onPress={closeModal} style={styles.modalButton}>
                  <Text className='text-foreground'>Cancel</Text>
                </Button>
                <Button variant='default' size='sm' onPress={handleSubmit} disabled={saving} style={styles.modalButton}>
                  {saving ? <ActivityIndicator size='small' color='#fff' /> : <Text className='text-primary-foreground'>Save</Text>}
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
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
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  logoWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dealerLogo: {
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
  dealerInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingTop: 60, // Preserves status bar gap
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%', // Prevents sheet from expanding off-screen
    overflow: 'hidden',
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32, // Ensures bottom buttons are fully visible above keyboard
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
  logoPreviewContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  logoPreview: {
    width: '100%',
    height: 140,
  },
  removeLogoButton: {
    marginTop: 8,
  },
  pickerButton: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 96,
  },
});