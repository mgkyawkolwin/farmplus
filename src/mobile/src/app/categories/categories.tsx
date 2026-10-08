'use client';

import * as React from 'react';
import { ActivityIndicator, Alert as RNAlert, Modal, Pressable, RefreshControl, StyleSheet, View, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Plus, Pencil, Trash2, X, ChevronLeft } from 'lucide-react-native';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { CategoryServiceClient } from '@/services/categoryService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon } from '@/components/ui/icon';
import { CategoryItem } from '@/models/category';
import SnackBar from '@/components/ui/snack-bar';

export default function CategoriesScreen() {
    const router = useRouter();
    const service = React.useMemo(() => new CategoryServiceClient(), []);

    const [categories, setCategories] = React.useState<CategoryItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [refreshing, setRefreshing] = React.useState(false);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState<CategoryItem | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const loadCategories = React.useCallback(async (requestedPage = 1, append = false, isRefresh = false) => {
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

            const data = await service.getCategories(requestedPage, 20);
            setCategories((prev) => (requestedPage === 1 || !append ? data : [...prev, ...data]));
            setPage(requestedPage);
            setHasMore(data.length >= 20);
        } catch (error: any) {
            setErrorMessage(error?.message || 'Unable to load categories.');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [service]);

    React.useEffect(() => {
        void loadCategories(1, false, false);
    }, [loadCategories]);

    const handleRefresh = React.useCallback(() => {
        void loadCategories(1, false, true);
    }, [loadCategories]);

    const handleLoadMore = React.useCallback(() => {
        if (loadingMore || !hasMore || loading || refreshing) {
            return;
        }

        void loadCategories(page + 1, true, false);
    }, [hasMore, loading, loadingMore, page, refreshing]);

    const handleScroll = React.useCallback((event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 24) {
            handleLoadMore();
        }
    }, [handleLoadMore]);

    const openCreateModal = () => {
        setEditingCategory({ id: '', category: '', isActive: true, rowVersion: '', createdAtUtc: '', updatedAtUtc: '' });
        setErrorMessage(null);
        setModalVisible(true);
    };

    const openEditModal = (category: CategoryItem) => {
        setEditingCategory(category);
        setErrorMessage(null);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingCategory(null);
        setErrorMessage(null);
    };

    const handleSubmit = async () => {
        if (!editingCategory?.category || editingCategory.category.trim() === '') {
            SnackBar.Error('Category name is required.');
            return;
        }

        try {
            setSaving(true);
            setErrorMessage(null);

            if (editingCategory.id) {
                await service.updateCategory(editingCategory);
                SnackBar.Success(`Category "${editingCategory.category}" updated successfully.`);
            } else {
                await service.createCategory(editingCategory.category, editingCategory.isActive);
                SnackBar.Success(`Category "${editingCategory.category}" created successfully.`);
            }
            await loadCategories(1, false, false);
            closeModal();
        } catch (error: any) {
            SnackBar.Error(error?.message || 'Unable to save category.');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (category: CategoryItem) => {
        RNAlert.alert(
            'Delete category',
            `Are you sure you want to delete "${category.category}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => handleDelete(category) },
            ]
        );
    };

    const handleDelete = async (category: CategoryItem) => {
        try {
            await service.deleteCategory(category.id);
            SnackBar.Success(`Category "${category.category}" deleted successfully.`);
            await loadCategories(1, false, false);
        } catch (error: any) {
            SnackBar.Error(error?.message || `Unable to delete category "${category.category}".`);
        }
    };

    return (
        <SafeAreaView className='bg-background' style={styles.page}>
            <View className='bg-background border-b border-border' style={styles.headerBar}>
                <Button variant='ghost' onPress={() => router.back()} style={styles.backButton}>
                    <Icon as={ChevronLeft} size={22} className='text-foreground' />
                </Button>
                <Text className='text-foreground' style={styles.headerTitle}>Category</Text>
                <Button variant='outline' size='sm' onPress={openCreateModal} style={styles.addButton}>
                    <Icon as={Plus} size={14} color='#0F172A' />
                    <Text style={styles.addButtonText}>New</Text>
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
                        <Text className='text-muted-foreground' style={styles.emptyText}>Loading categories...</Text>
                    </View>
                ) : categories.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text className='text-muted-foreground' style={styles.emptyText}>No categories yet.</Text>
                    </View>
                ) : (
                    <View>
                        <View style={styles.summaryBar}>
                            <View style={styles.summaryCell}>
                                <Text style={styles.summaryLabel}>Total</Text>
                                <Text style={styles.summaryValue}>{categories.length}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryCell}>
                                <Text style={styles.summaryLabel}>Active</Text>
                                <Text style={[styles.summaryValue, styles.summaryActive]}>{categories.filter((item) => item.isActive).length}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryCell}>
                                <Text style={styles.summaryLabel}>Inactive</Text>
                                <Text style={[styles.summaryValue, styles.summaryInactive]}>{categories.filter((item) => !item.isActive).length}</Text>
                            </View>
                        </View>

                        <View style={styles.listContainer}>
                            {categories.map((category) => (
                                <View key={category.id} style={[styles.card, category.isActive ? styles.cardActive : styles.cardInactive]}>
                                    <View style={styles.cardBody}>
                                        <View style={[styles.tile, category.isActive ? styles.tileActive : styles.tileInactive]}>
                                            <Text style={[styles.tileText, category.isActive ? styles.tileTextActive : styles.tileTextInactive]}>
                                                {(category.category?.trim().charAt(0) || '?').toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.cardInfo}>
                                            <Text className='text-foreground' style={styles.categoryName} numberOfLines={1}>
                                                {category.category}
                                            </Text>
                                            <View style={styles.statusRow}>
                                                <View style={[styles.statusDot, category.isActive ? styles.dotActive : styles.dotInactive]} />
                                                <Text style={[styles.statusLabel, category.isActive ? styles.statusLabelActive : styles.statusLabelInactive]}>
                                                    {category.isActive ? 'Active' : 'Inactive'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.actions}>
                                        <Pressable
                                            onPress={() => openEditModal(category)}
                                            hitSlop={6}
                                            style={styles.actionButton}
                                            accessibilityRole='button'
                                            accessibilityLabel={`Edit ${category.category}`}
                                        >
                                            <Pencil size={15} color='#2367A8' />
                                        </Pressable>
                                        <Pressable
                                            onPress={() => confirmDelete(category)}
                                            hitSlop={6}
                                            style={[styles.actionButton, styles.actionButtonDanger]}
                                            accessibilityRole='button'
                                            accessibilityLabel={`Delete ${category.category}`}
                                        >
                                            <Trash2 size={15} color='#B42318' />
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
                            <Text variant='h4' className='text-foreground'> {editingCategory ? 'Edit category' : 'Add category'} </Text>
                            <Pressable onPress={closeModal} style={styles.closeButton}>
                                <Icon as={X} size={20} color="#4b5563" />
                            </Pressable>
                        </View>

                        <Label className='text-foreground' style={styles.label}>Category name</Label>
                        <Input
                            placeholder='Enter category name'
                            value={editingCategory?.category}
                            onChangeText={(text) => setEditingCategory((prev: CategoryItem | null) => ({ ...prev, category: text } as (CategoryItem | null)))}
                            autoCapitalize='words'
                            style={styles.input}
                        />

                        <View style={styles.switchRow}>
                            <Text className='text-foreground' style={styles.switchLabel}>Is Active</Text>
                            <Switch value={editingCategory?.isActive} onValueChange={(value) => setEditingCategory((prev: CategoryItem | null) => ({ ...prev, isActive: value } as (CategoryItem | null)))} />
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
        borderWidth: 1.5,
        borderColor: '#0F172A',
        backgroundColor: '#FFFFFF',
    },
    addButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: 0.3,
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
    summaryBar: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: 14,
        paddingVertical: 12,
        backgroundColor: '#0F172A',
        borderRadius: 8,
    },
    summaryCell: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: '#475569',
    },
    summaryLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    summaryValue: {
        marginTop: 3,
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    summaryActive: { color: '#6EE7B7' },
    summaryInactive: { color: '#FCA5A5' },
    listContainer: {
        gap: 8,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderLeftWidth: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
    },
    cardActive: { borderColor: '#D9DEE5', borderLeftColor: '#16794B' },
    cardInactive: { borderColor: '#D9DEE5', borderLeftColor: '#94A3B8', backgroundColor: '#F8FAFC' },
    cardBody: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tile: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileActive: { backgroundColor: '#E6F4EC' },
    tileInactive: { backgroundColor: '#E2E8F0' },
    tileText: { fontSize: 15, fontWeight: '800' },
    tileTextActive: { color: '#16794B' },
    tileTextInactive: { color: '#64748B' },
    cardInfo: {
        flex: 1,
        minWidth: 0,
        gap: 3,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '700',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    dotActive: { backgroundColor: '#16794B' },
    dotInactive: { backgroundColor: '#94A3B8' },
    statusLabel: { fontSize: 11, fontWeight: '600' },
    statusLabelActive: { color: '#047857' },
    statusLabelInactive: { color: '#64748B' },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BFD4EA',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    actionButtonDanger: {
        borderColor: '#F0C4BF',
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
        backgroundColor: '#0F172A',
    },
});