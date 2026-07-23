'use client';

import * as React from 'react';
import { ActivityIndicator, Alert as RNAlert, Modal, Pressable, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, Pencil, Trash2, X } from 'lucide-react-native';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import HomeTopBar from '@/components/homeTopBar';
import { CategoryServiceClient, type CategoryItem } from '@/services/categoryService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon } from '@/components/ui/icon';

export default function CategoriesScreen() {
    const service = React.useMemo(() => new CategoryServiceClient(), []);

    const [categories, setCategories] = React.useState<CategoryItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState<CategoryItem | null>(null);
    const [name, setName] = React.useState('');
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const loadCategories = React.useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            const data = await service.getCategories();
            setCategories(data);
        } catch (error: any) {
            setErrorMessage(error?.message || 'Unable to load categories.');
        } finally {
            setLoading(false);
        }
    }, [service]);

    React.useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const openCreateModal = () => {
        setEditingCategory(null);
        setName('');
        setErrorMessage(null);
        setModalVisible(true);
    };

    const openEditModal = (category: CategoryItem) => {
        setEditingCategory(category);
        setName(category.category);
        setErrorMessage(null);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingCategory(null);
        setName('');
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
                await service.updateCategory(editingCategory.id, trimmedName);
            } else {
                await service.createCategory(trimmedName);
            }

            await loadCategories();
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
            await loadCategories();
        } catch (error: any) {
            RNAlert.alert('Delete failed', error?.message || 'Unable to delete category.');
        }
    };

    return (
        <SafeAreaView className='bg-background' style={styles.page}>
            <HomeTopBar />
            <KeyboardAwareScrollView className='bg-background' style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text variant="h3" className='text-foreground'>Categories</Text>
                    <Button variant="default" size="sm" onPress={openCreateModal}>
                        <Icon as={Plus} size={8} className='text-primary-foreground' />
                        <Text className='text-primary-foreground'>Add New</Text>
                    </Button>
                </View>
                {loading ? (
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
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