'use client';

import * as React from 'react';
import { ActivityIndicator, Alert as RNAlert, Modal, Pressable, RefreshControl, StyleSheet, View, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Plus, Pencil, Trash2, X, ChevronLeft } from 'lucide-react-native';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { UnitServiceClient } from '@/services/unitService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon } from '@/components/ui/icon';
import { UnitItem } from '@/models/unit';
import SnackBar from '@/components/ui/snack-bar';

export default function UnitsScreen() {
  const router = useRouter();
  const service = React.useMemo(() => new UnitServiceClient(), []);

  const [units, setUnits] = React.useState<UnitItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<UnitItem | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadUnits = React.useCallback(async (requestedPage = 1, append = false, isRefresh = false) => {
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

      const data = await service.getUnits(requestedPage, 20);
      setUnits((prev) => (requestedPage === 1 || !append ? data : [...prev, ...data]));
      setPage(requestedPage);
      setHasMore(data.length >= 20);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Unable to load units.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [service]);

  React.useEffect(() => {
    void loadUnits(1, false, false);
  }, [loadUnits]);

  const handleRefresh = React.useCallback(() => {
    void loadUnits(1, false, true);
  }, [loadUnits]);

  const handleLoadMore = React.useCallback(() => {
    if (loadingMore || !hasMore || loading || refreshing) {
      return;
    }

    void loadUnits(page + 1, true, false);
  }, [hasMore, loading, loadingMore, page, refreshing, loadUnits]);

  const handleScroll = React.useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 24) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  const openCreateModal = () => {
    setEditingUnit({ id: '', unit: '', isActive: true, rowVersion: '', createdAtUtc: '', updatedAtUtc: '' });
    setErrorMessage(null);
    setModalVisible(true);
  };

  const openEditModal = (unit: UnitItem) => {
    setEditingUnit(unit);
    setErrorMessage(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingUnit(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!editingUnit?.unit || editingUnit.unit.trim() === '') {
      SnackBar.Error('Unit name is required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      if (editingUnit.id) {
        await service.updateUnit(editingUnit);
        SnackBar.Success(`Unit "${editingUnit.unit}" updated successfully.`);
      } else {
        await service.createUnit(editingUnit.unit, editingUnit.isActive);
        SnackBar.Success(`Unit "${editingUnit.unit}" created successfully.`);
      }
      await loadUnits(1, false, false);
      closeModal();
    } catch (error: any) {
      SnackBar.Error(error?.message || 'Unable to save unit.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (unit: UnitItem) => {
    RNAlert.alert(
      'Delete unit',
      `Are you sure you want to delete "${unit.unit}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(unit) },
      ]
    );
  };

  const handleDelete = async (unit: UnitItem) => {
    try {
      await service.deleteUnit(unit.id);
      SnackBar.Success(`Unit "${unit.unit}" deleted successfully.`);
      await loadUnits(1, false, false);
    } catch (error: any) {
      SnackBar.Error(error?.message || `Unable to delete unit "${unit.unit}".`);
    }
  };

  return (
    <SafeAreaView className='bg-background' style={styles.page}>
      <View className='bg-background border-b border-border' style={styles.headerBar}>
        <Button variant='ghost' onPress={() => router.back()} style={styles.backButton}>
          <Icon as={ChevronLeft} size={22} className='text-foreground' />
        </Button>
        <Text className='text-foreground' style={styles.headerTitle}>Unit</Text>
        <Button variant='default' size='sm' onPress={openCreateModal} style={styles.addButton}>
          <Icon as={Plus} size={14} className='text-primary-foreground' />
          <Text className='text-primary-foreground' style={styles.addButtonText}>Add</Text>
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
            <Text className='text-muted-foreground' style={styles.emptyText}>Loading units...</Text>
          </View>
        ) : units.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className='text-muted-foreground' style={styles.emptyText}>No units yet.</Text>
          </View>
        ) : (
          <View>
            <View style={styles.sectionHeading}>
              <Text className='text-foreground' style={styles.sectionTitle}>All Units</Text>
              <Text className='text-muted-foreground' style={styles.sectionCount}>{units.length} {units.length === 1 ? 'record' : 'records'}</Text>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={styles.nameColumn}>
                  <Text className='text-muted-foreground' style={styles.headerCell}>Unit</Text>
                </View>
                <View style={styles.statusColumn}>
                  <Text className='text-muted-foreground' style={styles.headerCell}>Status</Text>
                </View>
                <View style={styles.actionsColumn} />
              </View>

              {units.map((unit, index) => (
                <View key={unit.id} style={[styles.row, index === units.length - 1 && styles.rowLast]}>
                  <View style={styles.nameColumn}>
                    <Text className='text-foreground' style={styles.unitName} numberOfLines={1}>
                      {unit.unit}
                    </Text>
                  </View>
                  <View style={styles.statusColumn}>
                    <View style={[styles.statusPill, unit.isActive ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusText, unit.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                        {unit.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionsColumn}>
                    <Pressable
                      onPress={() => openEditModal(unit)}
                      hitSlop={8}
                      style={styles.iconButton}
                      accessibilityRole='button'
                      accessibilityLabel={`Edit ${unit.unit}`}
                    >
                      <Pencil size={16} color='#2367A8' />
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDelete(unit)}
                      hitSlop={8}
                      style={styles.iconButton}
                      accessibilityRole='button'
                      accessibilityLabel={`Delete ${unit.unit}`}
                    >
                      <Trash2 size={16} color='#B42318' />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
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
        <KeyboardAvoidingView className='bg-[hsla(0,0%,0%,0.5)]' style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className='bg-card border-border' style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text variant='h4' className='text-foreground'>{editingUnit ? 'Edit unit' : 'Add unit'}</Text>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Icon as={X} size={20} color="#4b5563" />
              </Pressable>
            </View>

            <Label className='text-foreground' style={styles.label}>Unit name</Label>
            <Input
              placeholder='Enter unit name'
              value={editingUnit?.unit}
              onChangeText={(text) => setEditingUnit((prev: UnitItem | null) => ({ ...prev, unit: text } as (UnitItem | null)))}
              autoCapitalize='words'
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text className='text-foreground' style={styles.switchLabel}>Is Active</Text>
              <Switch value={editingUnit?.isActive} onValueChange={(value) => setEditingUnit((prev: UnitItem | null) => ({ ...prev, isActive: value } as (UnitItem | null)))} />
            </View>

            <View style={styles.modalActions}>
              <Button variant='outline' size='sm' onPress={closeModal} style={styles.modalButton}>
                <Text className='text-foreground'>Cancel</Text>
              </Button>
              <Button variant='default' size='sm' onPress={handleSubmit} disabled={saving} style={[styles.modalButton, styles.saveButton]}>
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
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
    borderRadius: 6,
    backgroundColor: '#16794B',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  table: {
    borderWidth: 1,
    borderColor: '#D9DEE5',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  tableHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#D9DEE5',
  },
  headerCell: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CBD5E1',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  nameColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  statusColumn: {
    width: 80,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  actionsColumn: {
    width: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  unitName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
  statusTextActive: { color: '#047857' },
  statusTextInactive: { color: '#B91C1C' },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
  saveButton: {
    backgroundColor: '#16794B',
  },
});
