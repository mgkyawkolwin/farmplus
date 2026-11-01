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
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Icon } from '@/components/ui/icon';
import { CategoryItem } from '@/models/category';
import SnackBar from '@/components/ui/snack-bar';
import UnauthorizedView from '@/components/unauthorized-view';
import { usePagePermission } from '@/lib/usePagePermission';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';

export default function CategoriesScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
    const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
    const permissionState = usePagePermission('/categories/categories');
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
            setErrorMessage(error?.message || t('categories.messages.unableLoadCategories'));
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [service]);

    React.useEffect(() => {
        if (permissionState !== 'authorized') return undefined;
        void loadCategories(1, false, false);
    }, [loadCategories, permissionState]);

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
            SnackBar.Error(t('categories.messages.categoryNameRequired'));
            return;
        }

        try {
            setSaving(true);
            setErrorMessage(null);

            if (editingCategory.id) {
                await service.updateCategory(editingCategory);
                SnackBar.Success(t('categories.messages.categoryUpdated', { category: editingCategory.category }));
            } else {
                await service.createCategory(editingCategory.category, editingCategory.isActive);
                SnackBar.Success(t('categories.messages.categoryCreated', { category: editingCategory.category }));
            }
            await loadCategories(1, false, false);
            closeModal();
        } catch (error: any) {
            SnackBar.Error(error?.message || t('categories.messages.unableSaveCategory'));
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (category: CategoryItem) => {
        RNAlert.alert(
            t('categories.deleteTitle'),
            t('categories.deleteConfirmation', { category: category.category }),
            [
                { text: t('categories.actions.cancel'), style: 'cancel' },
                { text: t('categories.actions.delete'), style: 'destructive', onPress: () => handleDelete(category) },
            ]
        );
    };

    const handleDelete = async (category: CategoryItem) => {
        try {
            await service.deleteCategory(category.id);
            SnackBar.Success(t('categories.messages.categoryDeleted', { category: category.category }));
            await loadCategories(1, false, false);
        } catch (error: any) {
            SnackBar.Error(error?.message || t('categories.messages.unableDeleteCategory', { category: category.category }));
        }
    };

    return (
        <SafeAreaView className='bg-background' style={styles.page}>
            <View className='bg-background border-b border-border' style={styles.headerBar}>
                <Button variant='ghost' onPress={() => router.back()} style={styles.backButton}>
                    <Icon as={ChevronLeft} size={22} className='text-foreground' />
                </Button>
                <Text className='text-foreground' style={styles.headerTitle}>{t('categories.category')}</Text>
                <Button variant='outline' size='sm' onPress={openCreateModal} disabled={permissionState !== 'authorized'} style={[styles.addButton, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <Icon as={Plus} size={14} color={theme.foreground} />
                    <Text style={[styles.addButtonText, { color: theme.foreground }]}>{t('categories.actions.new')}</Text>
                </Button>
            </View>

            {permissionState === 'checking' ? (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text className='text-muted-foreground' style={styles.emptyText}>{t('categories.checkingPermission')}</Text>
                </View>
            ) : permissionState === 'denied' ? (
                <UnauthorizedView />
            ) : (
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
                        <Text className='text-muted-foreground' style={styles.emptyText}>{t('categories.loading')}</Text>
                    </View>
                ) : categories.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text className='text-muted-foreground' style={styles.emptyText}>{t('categories.emptyList')}</Text>
                    </View>
                ) : (
                    <View>
                        <View style={[styles.summaryBar, { backgroundColor: theme.primary }]}>
                            <View style={styles.summaryCell}>
                                <Text style={[styles.summaryLabel, { color: theme.primaryForeground }]}>{t('categories.total')}</Text>
                                <Text style={[styles.summaryValue, { color: theme.primaryForeground }]}>{categories.length}</Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: theme.mutedForeground }]} />
                            <View style={styles.summaryCell}>
                                <Text style={[styles.summaryLabel, { color: theme.primaryForeground }]}>{t('categories.active')}</Text>
                                <Text style={[styles.summaryValue, { color: theme.chart2 }]}>{categories.filter((item) => item.isActive).length}</Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: theme.mutedForeground }]} />
                            <View style={styles.summaryCell}>
                                <Text style={[styles.summaryLabel, { color: theme.primaryForeground }]}>{t('categories.inactive')}</Text>
                                <Text style={[styles.summaryValue, { color: theme.destructive }]}>{categories.filter((item) => !item.isActive).length}</Text>
                            </View>
                        </View>

                        <View style={styles.listContainer}>
                            {categories.map((category) => (
                                <View
                                    key={category.id}
                                    style={[
                                        styles.card,
                                        {
                                            backgroundColor: category.isActive ? theme.card : theme.muted,
                                            borderColor: theme.border,
                                            borderLeftColor: category.isActive ? theme.chart2 : theme.mutedForeground,
                                        },
                                    ]}
                                >
                                    <View style={styles.cardBody}>
                                        <View style={[styles.tile, { backgroundColor: theme.secondary }]}>
                                            <Text style={[styles.tileText, { color: category.isActive ? theme.chart2 : theme.mutedForeground }]}>
                                                {(category.category?.trim().charAt(0) || '?').toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.cardInfo}>
                                            <Text className='text-foreground' style={styles.categoryName} numberOfLines={1}>
                                                {category.category}
                                            </Text>
                                            <View style={styles.statusRow}>
                                                <View style={[styles.statusDot, { backgroundColor: category.isActive ? theme.chart2 : theme.destructive }]} />
                                                <Text style={[styles.statusLabel, { color: category.isActive ? theme.chart2 : theme.destructive }]}>
                                                    {t(category.isActive ? 'categories.active' : 'categories.inactive')}
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
                                            accessibilityLabel={t('categories.accessibility.editCategory', { category: category.category })}
                                        >
                                            <Pencil size={15} color={theme.primary} />
                                        </Pressable>
                                        <Pressable
                                            onPress={() => confirmDelete(category)}
                                            hitSlop={6}
                                            style={[styles.actionButton, { borderColor: theme.destructive, backgroundColor: theme.card }]}
                                            accessibilityRole='button'
                                            accessibilityLabel={t('categories.accessibility.deleteCategory', { category: category.category })}
                                        >
                                            <Trash2 size={15} color={theme.destructive} />
                                        </Pressable>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
                {loadingMore ? (
                    <View style={styles.loadMoreRow}>
                        <ActivityIndicator size='small' color={theme.primary} />
                        <Text className='text-muted-foreground'>{t('categories.loadingMore')}</Text>
                    </View>
                ) : null}
                {errorMessage ? (
                    <Alert variant='destructive' icon={X} className='mt-3'>
                        <AlertTitle>{t('categories.errorTitle')}</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                ) : null}
                            </KeyboardAwareScrollView>
                        )}

            <Modal visible={modalVisible} transparent animationType='slide' onRequestClose={closeModal}>
                <KeyboardAvoidingView style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.modalHeader}>
                            <Text variant='h4' className='text-foreground'>{t(editingCategory ? 'categories.editCategory' : 'categories.newCategory')}</Text>
                            <Pressable onPress={closeModal} style={styles.closeButton}>
                                <Icon as={X} size={20} color={theme.mutedForeground} />
                            </Pressable>
                        </View>

                        <Label className='text-foreground' style={styles.label}>{t('categories.fields.categoryName')}</Label>
                        <Input
                            placeholder={t('categories.placeholders.categoryName')}
                            value={editingCategory?.category}
                            onChangeText={(text) => setEditingCategory((prev: CategoryItem | null) => ({ ...prev, category: text } as (CategoryItem | null)))}
                            autoCapitalize='words'
                            style={styles.input}
                        />

                        <View style={styles.switchRow}>
                            <Text className='text-foreground' style={styles.switchLabel}>{t('categories.fields.active')}</Text>
                            <Switch
                                value={editingCategory?.isActive}
                                onValueChange={(value) => setEditingCategory((prev: CategoryItem | null) => ({ ...prev, isActive: value } as (CategoryItem | null)))}
                                trackColor={{ false: theme.muted, true: theme.primary }}
                                thumbColor={theme.card}
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <Button variant='outline' size='sm' onPress={closeModal} style={styles.modalButton}>
                                <Text className='text-foreground'>{t('categories.actions.cancel')}</Text>
                            </Button>
                            <Button variant='default' size='sm' onPress={handleSubmit} disabled={saving} style={[styles.modalButton, { backgroundColor: theme.primary }]}>
                                {saving ? <ActivityIndicator size='small' color={theme.primaryForeground} /> : <Text style={{ color: theme.primaryForeground }}>{t('categories.actions.save')}</Text>}
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
    },
    addButtonText: {
        fontSize: 12,
        fontWeight: '800',
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
        borderRadius: 8,
    },
    summaryCell: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: StyleSheet.hairlineWidth,
    },
    summaryLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    summaryValue: {
        marginTop: 3,
        fontSize: 18,
        fontWeight: '800',
    },
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
    },
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
    tileText: { fontSize: 15, fontWeight: '800' },
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
    statusLabel: { fontSize: 11, fontWeight: '600' },
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
        alignItems: 'center',
        justifyContent: 'center',
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
});