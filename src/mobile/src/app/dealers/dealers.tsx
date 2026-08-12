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

  const openEditModal = (dealer: DealerItem) => {
    setEditingDealer(dealer);
    setErrorMessage(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingDealer(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!editingDealer?.dealerName || editingDealer.dealerName.trim() === '') {
      setErrorMessage('Dealer name is required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      if (editingDealer.id) {
        await service.updateDealer(editingDealer);
        SnackBar.Success(`Dealer "${editingDealer.dealerName}" updated successfully.`);
      } else {
        await service.createDealer(editingDealer);
        SnackBar.Success(`Dealer "${editingDealer.dealerName}" created successfully.`);
      }
      await loadDealers(1, false, false);
      closeModal();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to save dealer.');
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
                  <Text className='text-foreground' style={styles.categoryName}>{dealer.dealerName}</Text>
                  <Badge variant={dealer.isRequired ? 'active' : 'muted'}>
                    <Text>{dealer.isRequired ? 'Required' : 'Optional'}</Text>
                  </Badge>
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
              <Text variant='h4' className='text-foreground'>{editingDealer ? 'Edit dealer' : 'Add dealer'}</Text>
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

            <Label className='text-foreground' style={styles.label}>Logo URL</Label>
            <Input
              placeholder='Enter logo url'
              value={editingDealer?.logoUrl}
              onChangeText={(text) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, logoUrl: text } as DealerItem))}
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text className='text-foreground' style={styles.switchLabel}>Is Required</Text>
              <Switch value={editingDealer?.isRequired} onValueChange={(value) => setEditingDealer((prev: DealerItem | null) => ({ ...prev, isRequired: value } as DealerItem))} />
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
    gap: 8,
    flex: 1,
    marginRight: 8,
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
