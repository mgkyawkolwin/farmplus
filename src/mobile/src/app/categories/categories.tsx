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
    const [name, setName] = React.useState('');
    const [isActive, setIsActive] = React.useState(true);
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
        setEditingCategory(null);
        setName('');
        setIsActive(true);
        setErrorMessage(null);
        setModalVisible(true);
    };

    const openEditModal = (category: CategoryItem) => {
        setEditingCategory(category);
        setName(category.category);
        setIsActive(category.isActive ?? true);
        setErrorMessage(null);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingCategory(null);
        setName('');
        setIsActive(true);
        setErrorMessage(null);
    };

    const handleSubmit = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setErrorMessage('Category name is required.');
            return;
        }

        try {
            setSaving(true);
            setErrorMessage(null);

            if (editingCategory) {
                await service.updateCategory(editingCategory.id, trimmedName, isActive);
            } else {
                await service.createCategory(trimmedName, isActive);
            }

            await loadCategories(1, false, false);
            closeModal();
        } catch (error: any) {
            setErrorMessage(error?.message || 'Unable to save category.');
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
            await loadCategories(1, false, false);
        } catch (error: any) {
            RNAlert.alert('Delete failed', error?.message || 'Unable to delete category.');
        }
    };

    return (
        <SafeAreaView className='bg-background' style={styles.page}>
            <View className='bg-background border-b border-border' style={styles.headerBar}>
                <Button variant='ghost' onPress={() => router.back()} style={styles.backButton}>
                    <Icon as={ChevronLeft} size={22} className='text-foreground' />
                </Button>
                <Text className='text-foreground' style={styles.headerTitle}>Category</Text>
                <Button variant='default' size='sm' onPress={openCreateModal} style={styles.addButton}>
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
                        <Text className='text-muted-foreground' style={styles.emptyText}>Loading categories...</Text>
                    </View>
                ) : categories.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text className='text-muted-foreground' style={styles.emptyText}>No categories yet.</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {categories.map((category) => (
                            <View className='bg-card border-border' key={category.id} style={styles.card}>
                                <Text className='text-foreground' style={styles.categoryName}>{category.category}</Text>
                                <View style={styles.actions}>
                                    <Pressable onPress={() => openEditModal(category)} style={styles.iconButton}>
                                        <Pencil size={18} color="#2563eb" />
                                    </Pressable>
                                    <Pressable onPress={() => confirmDelete(category)} style={styles.iconButton}>
                                        <Trash2 size={18} color="#dc2626" />
                                    </Pressable>
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
                            <Text variant='h4' className='text-foreground'> {editingCategory ? 'Edit category' : 'Add category'} </Text>
                            <Pressable onPress={closeModal} style={styles.closeButton}>
                                <Icon as={X} size={20} color="#4b5563" />
                            </Pressable>
                        </View>

                        <Label className='text-foreground' style={styles.label}>Category name</Label>
                        <Input
                            placeholder='Enter category name'
                            value={name}
                            onChangeText={setName}
                            autoCapitalize='words'
                            style={styles.input}
                        />

                        <View style={styles.switchRow}>
                            <Text className='text-foreground' style={styles.switchLabel}>Is Active</Text>
                            <Switch value={isActive} onValueChange={setIsActive} />
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
        minWidth: 72,
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
        flex: 1,
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