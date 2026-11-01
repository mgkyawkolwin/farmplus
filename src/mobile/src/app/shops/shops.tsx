'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Alert as RNAlert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, MapPin, Pencil, Phone, Plus, Search, Store, Trash2, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import { Shop } from '@/models/shop';
import { ShopServiceClient } from '@/services/shopService';
import UnauthorizedView from '@/components/unauthorized-view';
import { usePagePermission } from '@/lib/usePagePermission';
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type ThemeColors = typeof THEME.light;

const EMPTY_SHOP: Shop = {
  id: '',
  name: '',
  address: '',
  city: '',
  stateDivision: '',
  country: '',
  postalCode: '',
  phone: '',
  email: '',
};

function locationSummary(shop: Shop) {
  return [shop.city, shop.stateDivision, shop.country].filter(Boolean).join(' · ');
}

function DetailRow({ icon: RowIcon, value, theme }: { icon: typeof MapPin; value: string; theme: ThemeColors }) {
  return (
    <View style={styles.detailRow}>
      <RowIcon size={13} color={theme.mutedForeground} />
      <Text className="text-foreground" style={styles.detailText} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function ShopCard({ shop, onEdit, onDelete, theme }: { shop: Shop; onEdit: () => void; onDelete: () => void; theme: ThemeColors }) {
  const { t } = useTranslation();
  const location = locationSummary(shop);
  const addressLine = [shop.address, shop.postalCode].filter(Boolean).join(' ');
  const hasDetails = Boolean(addressLine || shop.phone || shop.email);

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.tile, { backgroundColor: theme.secondary }]}>
          <Store size={18} color={theme.primary} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text className="text-foreground" style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
          <Text className="text-muted-foreground" style={styles.shopLocation} numberOfLines={1}>
            {location || t('suppliers.dashboard.noLocation')}
          </Text>
        </View>
      </View>

      <View style={styles.detailList}>
        {addressLine ? <DetailRow icon={MapPin} value={addressLine} theme={theme} /> : null}
        {shop.phone ? <DetailRow icon={Phone} value={shop.phone} theme={theme} /> : null}
        {shop.email ? <DetailRow icon={Mail} value={shop.email} theme={theme} /> : null}
        {!hasDetails ? <Text className="text-muted-foreground" style={styles.noDetails}>{t('shops.noContactDetails')}</Text> : null}
      </View>

      <View style={[styles.cardFooter, { borderTopColor: theme.border, backgroundColor: theme.muted }]}>
        <Pressable
          onPress={onEdit}
          style={styles.footerAction}
          accessibilityRole="button"
          accessibilityLabel={t('shops.accessibility.editShop', { name: shop.name })}
        >
          <Pencil size={14} color={theme.primary} />
          <Text style={[styles.footerText, { color: theme.primary }]}>{t('sales.actions.edit')}</Text>
        </Pressable>
        <View style={[styles.footerDivider, { backgroundColor: theme.border }]} />
        <Pressable
          onPress={onDelete}
          style={styles.footerAction}
          accessibilityRole="button"
          accessibilityLabel={t('shops.accessibility.deleteShop', { name: shop.name })}
        >
          <Trash2 size={14} color={theme.destructive} />
          <Text style={[styles.footerText, { color: theme.destructive }]}>{t('categories.actions.delete')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ShopsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/shops/shops');
  const service = React.useMemo(() => new ShopServiceClient(), []);

  const [shops, setShops] = React.useState<Shop[]>([]);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [form, setForm] = React.useState<Shop>(EMPTY_SHOP);
  const [formErrors, setFormErrors] = React.useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = React.useState(false);

  const loadShops = React.useCallback(async (requestedPage = 1, append = false, isRefresh = false) => {
    try {
      if (requestedPage === 1 && !append) setLoading(true);
      if (requestedPage > 1) setLoadingMore(true);
      if (isRefresh) setRefreshing(true);
      setErrorMessage(null);

      const data = await service.getShops(requestedPage, PAGE_SIZE);
      setShops((current) => (append ? [...current, ...data] : data));
      setPage(requestedPage);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (error: any) {
      setErrorMessage(error?.message || t('shops.messages.unableLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [service, t]);

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
    void loadShops(1, false, false);
  }, [loadShops, permissionState]);

  const handleScroll = React.useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y < contentSize.height - 80) return;
    if (loadingMore || !hasMore || loading || refreshing) return;
    void loadShops(page + 1, true, false);
  }, [hasMore, loading, loadingMore, loadShops, page, refreshing]);

  const visibleShops = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return shops;
    return shops.filter((shop) => [shop.name, shop.city, shop.stateDivision, shop.country, shop.phone, shop.email]
      .some((value) => (value ?? '').toLowerCase().includes(term)));
  }, [shops, query]);

  const setField = (key: keyof Shop, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'name' || key === 'email') {
      setFormErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const openCreate = () => {
    setForm(EMPTY_SHOP);
    setFormErrors({});
    setModalVisible(true);
  };

  const openEdit = (shop: Shop) => {
    setForm({
      ...shop,
      address: shop.address ?? '',
      city: shop.city ?? '',
      stateDivision: shop.stateDivision ?? '',
      country: shop.country ?? '',
      postalCode: shop.postalCode ?? '',
      phone: shop.phone ?? '',
      email: shop.email ?? '',
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    const errors: { name?: string; email?: string } = {};
    if (!form.name.trim()) errors.name = t('shops.messages.nameRequired');
    const email = (form.email ?? '').trim();
    if (email && !EMAIL_PATTERN.test(email)) errors.email = t('profile.messages.invalidEmail');
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);
      if (form.id) {
        await service.updateShop({ ...form, name: form.name.trim() });
        SnackBar.Success(t('shops.messages.updated', { name: form.name.trim() }));
      } else {
        await service.createShop({ ...form, name: form.name.trim() });
        SnackBar.Success(t('shops.messages.created', { name: form.name.trim() }));
      }
      setModalVisible(false);
      await loadShops(1, false, false);
    } catch (error: any) {
      SnackBar.Error(error?.message || t('shops.messages.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (shop: Shop) => {
    RNAlert.alert(
      t('shops.deleteTitle'),
      t('shops.deleteConfirmation', { name: shop.name }),
      [
        { text: t('categories.actions.cancel'), style: 'cancel' },
        { text: t('categories.actions.delete'), style: 'destructive', onPress: () => void handleDelete(shop) },
      ],
    );
  };

  const handleDelete = async (shop: Shop) => {
    try {
      await service.deleteShop(shop.id);
      SnackBar.Success(t('shops.messages.deleted', { name: shop.name }));
      await loadShops(1, false, false);
    } catch (error: any) {
      SnackBar.Error(error?.message || t('shops.messages.deleteFailed', { name: shop.name }));
    }
  };

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon as={ChevronLeft} size={22} className="text-foreground" />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{t('shops.title')}</Text>
        <Button onPress={openCreate} disabled={permissionState !== 'authorized'} style={[styles.addButton, { backgroundColor: theme.primary }]}>
          <Plus size={14} color={theme.primaryForeground} />
          <Text style={[styles.addButtonText, { color: theme.primaryForeground }]}>{t('shops.newTitle')}</Text>
        </Button>
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.emptyText}>{t('categories.checkingPermission')}</Text>
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
            placeholder={t('shops.placeholders.search')}
            placeholderTextColor={theme.mutedForeground}
            style={[styles.searchInput, { color: theme.foreground }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel={t('shops.accessibility.clearSearch')}>
              <X size={14} color={theme.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
        <Text className="text-muted-foreground" style={styles.countText}>
          {t('shops.count', { count: visibleShops.length })}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadShops(1, false, true)} />}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        keyboardShouldPersistTaps="handled"
      >
        {loading && !refreshing ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text className="text-muted-foreground" style={styles.emptyText}>{t('shops.loading')}</Text>
          </View>
        ) : errorMessage && shops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className="text-foreground" style={styles.emptyTitle}>{t('shops.loadFailedTitle')}</Text>
            <Text className="text-muted-foreground" style={styles.emptyText}>{errorMessage}</Text>
          </View>
        ) : shops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className="text-foreground" style={styles.emptyTitle}>{t('shops.emptyTitle')}</Text>
            <Text className="text-muted-foreground" style={styles.emptyText}>{t('shops.emptyDescription')}</Text>
          </View>
        ) : visibleShops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className="text-muted-foreground" style={styles.emptyText}>{t('shops.emptyFiltered')}</Text>
          </View>
        ) : (
          visibleShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} onEdit={() => openEdit(shop)} onDelete={() => confirmDelete(shop)} theme={theme} />
          ))
        )}
        {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color={theme.primary} /> : null}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
            <View style={[styles.sheet, { backgroundColor: theme.card }]}>
              <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
                <Text className="text-foreground" style={styles.sheetTitle}>{form.id ? t('shops.editTitle') : t('shops.newTitle')}</Text>
                <Pressable onPress={closeModal} hitSlop={8} accessibilityLabel={t('products.actions.close')}>
                  <X size={20} color={theme.mutedForeground} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
                <View style={styles.field}>
                  <Label className="text-foreground">{t('shops.fields.shopName')} <Text style={{ color: theme.destructive }}>*</Text></Label>
                  <Input
                    value={form.name}
                    onChangeText={(value) => setField('name', value)}
                    placeholder={t('shops.placeholders.shopName')}
                    autoCapitalize="words"
                    editable={!saving}
                    maxLength={100}
                  />
                  {formErrors.name ? <Text style={[styles.errorText, { color: theme.destructive }]}>{formErrors.name}</Text> : null}
                </View>

                <View style={styles.field}>
                  <Label className="text-foreground">{t('customers.fields.address')}</Label>
                  <Input
                    value={form.address}
                    onChangeText={(value) => setField('address', value)}
                    placeholder={t('shops.placeholders.address')}
                    editable={!saving}
                    maxLength={200}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Label className="text-foreground">{t('customers.fields.city')}</Label>
                    <Input value={form.city} onChangeText={(value) => setField('city', value)} placeholder={t('customers.fields.city')} editable={!saving} maxLength={100} />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Label className="text-foreground">{t('dealers.fields.stateDivision')}</Label>
                    <Input value={form.stateDivision} onChangeText={(value) => setField('stateDivision', value)} placeholder={t('dealers.fields.stateDivision')} editable={!saving} maxLength={100} />
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Label className="text-foreground">{t('customers.fields.country')}</Label>
                    <Input value={form.country} onChangeText={(value) => setField('country', value)} placeholder={t('customers.fields.country')} editable={!saving} maxLength={100} />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Label className="text-foreground">{t('shops.fields.postalCode')}</Label>
                    <Input value={form.postalCode} onChangeText={(value) => setField('postalCode', value)} placeholder={t('shops.placeholders.postalCode')} editable={!saving} maxLength={20} />
                  </View>
                </View>

                <View style={styles.field}>
                  <Label className="text-foreground">{t('customers.fields.phone')}</Label>
                  <Input
                    value={form.phone}
                    onChangeText={(value) => setField('phone', value)}
                    placeholder={t('shops.placeholders.phone')}
                    keyboardType="phone-pad"
                    editable={!saving}
                    maxLength={30}
                  />
                </View>

                <View style={styles.field}>
                  <Label className="text-foreground">{t('customers.fields.email')}</Label>
                  <Input
                    value={form.email}
                    onChangeText={(value) => setField('email', value)}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!saving}
                    maxLength={100}
                  />
                  {formErrors.email ? <Text style={[styles.errorText, { color: theme.destructive }]}>{formErrors.email}</Text> : null}
                </View>
              </ScrollView>

              <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
                <Button variant="outline" onPress={closeModal} disabled={saving} style={styles.sheetButton}>
                  <Text className="text-foreground">{t('categories.actions.cancel')}</Text>
                </Button>
                <Button onPress={handleSubmit} disabled={saving} style={[styles.sheetButton, { backgroundColor: theme.primary }]}>
                  {saving ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : <Text style={[styles.saveText, { color: theme.primaryForeground }]}>{t('shops.actions.save')}</Text>}
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  backButton: { minWidth: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 12, borderRadius: 6 },
  addButtonText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  toolbar: { paddingHorizontal: 16, paddingTop: 12, gap: 6 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8 },
  searchInput: { flex: 1, height: '100%', fontSize: 13 },
  countText: { fontSize: 11, fontWeight: '600' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, gap: 10 },
  card: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  tile: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitleWrap: { flex: 1, minWidth: 0, gap: 2 },
  shopName: { fontSize: 14, fontWeight: '800' },
  shopLocation: { fontSize: 11 },
  detailList: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailText: { flex: 1, fontSize: 12 },
  noDetails: { fontSize: 11 },
  cardFooter: { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: StyleSheet.hairlineWidth },
  footerAction: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footerDivider: { width: StyleSheet.hairlineWidth },
  footerText: { fontSize: 12, fontWeight: '700' },
  emptyState: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { marginTop: 8, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheetWrap: { maxHeight: '92%' },
  sheet: { borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingTop: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  formContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  field: { gap: 6 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1, gap: 6 },
  errorText: { fontSize: 11 },
  sheetFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderTopWidth: StyleSheet.hairlineWidth },
  sheetButton: { flex: 1, borderRadius: 6 },
  saveText: { fontWeight: '700' },
});
