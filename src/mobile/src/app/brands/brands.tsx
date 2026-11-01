'use client';

import * as React from 'react';
import { ActivityIndicator, Alert as RNAlert, Modal, Pressable, RefreshControl, StyleSheet, TextInput, View, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Plus, Search, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { BrandServiceClient } from '@/services/brandService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon } from '@/components/ui/icon';
import { BrandItem } from '@/models/brand';
import SnackBar from '@/components/ui/snack-bar';
import UnauthorizedView from '@/components/unauthorized-view';
import { usePagePermission } from '@/lib/usePagePermission';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BrandsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/brands/brands');
  const service = React.useMemo(() => new BrandServiceClient(), []);

  const [brands, setBrands] = React.useState<BrandItem[]>([]);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
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
    if (permissionState !== 'authorized') return;
    void loadBrands(1, false, false);
  }, [loadBrands, permissionState]);

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

  const visibleBrands = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    return brands.filter((brand) => {
      if (statusFilter === 'active' && !brand.isActive) return false;
      if (statusFilter === 'inactive' && brand.isActive) return false;
      return !term || (brand.brand ?? '').toLowerCase().includes(term);
    });
  }, [brands, query, statusFilter]);

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
      SnackBar.Error('Brand name is required.');
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
      SnackBar.Error(error?.message || 'Unable to save brand.');
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
        <View style={[styles.headerCount, { backgroundColor: theme.secondary }]}>
          <Text style={[styles.headerCountText, { color: theme.foreground }]}>{brands.length}</Text>
        </View>
      </View>

      {permissionState === 'checking' ? (
        <View style={[styles.emptyState, styles.permissionState]}>
          <ActivityIndicator size='large' color={theme.primary} />
          <Text className='text-muted-foreground' style={styles.permissionText}>Checking permissions...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : (
        <>
      <View style={styles.toolbar}>
        <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Search size={15} color={theme.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder='Search brands'
            placeholderTextColor={theme.mutedForeground}
            style={[styles.searchInput, { color: theme.foreground }]}
            autoCapitalize='none'
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel='Clear search'>
              <X size={14} color={theme.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.segmented, { backgroundColor: theme.muted }]}>
          {(['all', 'active', 'inactive'] as const).map((option) => {
            const selected = statusFilter === option;
            return (
              <Pressable
                key={option}
                onPress={() => setStatusFilter(option)}
                style={[styles.segment, selected && [styles.segmentSelected, { backgroundColor: theme.card, shadowColor: theme.foreground }]]}
                accessibilityRole='button'
                accessibilityState={{ selected }}
              >
                <Text style={[styles.segmentText, { color: theme.mutedForeground }, selected && [styles.segmentTextSelected, { color: theme.foreground }]]}>
                  {option === 'all' ? 'All' : option === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
            <ActivityIndicator size="large" color={theme.primary} />
            <Text className='text-muted-foreground' style={styles.emptyText}>Loading brands...</Text>
          </View>
        ) : brands.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className='text-muted-foreground' style={styles.emptyText}>No brands yet.</Text>
          </View>
        ) : visibleBrands.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className='text-muted-foreground' style={styles.emptyText}>No brands match your search.</Text>
          </View>
        ) : (
          <View style={[styles.surface, { borderColor: theme.border, backgroundColor: theme.card }]}>
            {visibleBrands.map((brand, index) => (
              <Pressable
                key={brand.id}
                onPress={() => openEditModal(brand)}
                accessibilityRole='button'
                accessibilityLabel={`Edit ${brand.brand}`}
              >
                <View style={[styles.row, { borderBottomColor: theme.border }, index === visibleBrands.length - 1 && styles.rowLast]}>
                  <Text style={[styles.indexText, { color: theme.mutedForeground }]}>{String(index + 1).padStart(2, '0')}</Text>
                  <View style={styles.rowInfo}>
                    <Text className='text-foreground' style={styles.brandName} numberOfLines={1}>
                      {brand.brand}
                    </Text>
                    <Text style={[styles.brandMeta, { color: theme.mutedForeground }]} numberOfLines={1}>
                      Updated {formatDate(brand.updatedAtUtc || brand.createdAtUtc)}
                    </Text>
                  </View>
                  <View style={[styles.chip, { borderColor: brand.isActive ? theme.chart2 : theme.border, backgroundColor: theme.card }]}>
                    <Text style={[styles.chipText, { color: brand.isActive ? theme.chart2 : theme.mutedForeground }]}>
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => confirmDelete(brand)}
                    hitSlop={8}
                    style={styles.deleteButton}
                    accessibilityRole='button'
                    accessibilityLabel={`Delete ${brand.brand}`}
                  >
                    <Trash2 size={16} color={theme.destructive} />
                  </Pressable>
                  <ChevronRight size={16} color={theme.mutedForeground} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
        {loadingMore ? (
          <View style={styles.loadMoreRow}>
            <ActivityIndicator size='small' color={theme.primary} />
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

      <Pressable
        onPress={openCreateModal}
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.foreground }]}
        accessibilityRole='button'
        accessibilityLabel='Add brand'
      >
        <Plus size={24} color={theme.primaryForeground} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType='slide' onRequestClose={closeModal}>
        <KeyboardAvoidingView style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderTopColor: theme.primary }]}>
            <View style={styles.modalHeader}>
              <Text variant='h4' className='text-foreground'>{editingBrand ? 'Edit brand' : 'Add brand'}</Text>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Icon as={X} size={20} color={theme.mutedForeground} />
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
              <Switch
                value={editingBrand?.isActive}
                onValueChange={(value) => setEditingBrand((prev: BrandItem | null) => ({ ...prev, isActive: value } as (BrandItem | null)))}
                trackColor={{ false: theme.muted, true: theme.primary }}
                thumbColor={theme.card}
              />
            </View>

            <View style={styles.modalActions}>
              <Button variant='outline' size='sm' onPress={closeModal} style={styles.modalButton}>
                <Text className='text-foreground'>Cancel</Text>
              </Button>
              <Button variant='default' size='sm' onPress={handleSubmit} disabled={saving} style={[styles.modalButton, { backgroundColor: theme.primary }]}>
                {saving ? <ActivityIndicator size='small' color={theme.primaryForeground} /> : <Text style={{ color: theme.primaryForeground }}>Save</Text>}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  permissionState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    marginTop: 10,
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
  headerCount: {
    minWidth: 40,
    height: 24,
    paddingHorizontal: 8,
    marginRight: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
  },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 8,
  },
  segment: {
    flex: 1,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextSelected: {
    fontWeight: '800',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 96,
  },
  surface: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  indexText: {
    width: 22,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
  },
  brandMeta: {
    fontSize: 10,
  },
  chip: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  chipText: { fontSize: 10, fontWeight: '700' },
  deleteButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
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
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderTopWidth: 3,
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
    borderRadius: 6,
  },
});
