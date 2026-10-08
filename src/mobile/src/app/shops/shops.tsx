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

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import { Shop } from '@/models/shop';
import { ShopServiceClient } from '@/services/shopService';

const PAGE_SIZE = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function DetailRow({ icon: RowIcon, value }: { icon: typeof MapPin; value: string }) {
  return (
    <View style={styles.detailRow}>
      <RowIcon size={13} color="#64748B" />
      <Text className="text-foreground" style={styles.detailText} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function ShopCard({ shop, onEdit, onDelete }: { shop: Shop; onEdit: () => void; onDelete: () => void }) {
  const location = locationSummary(shop);
  const addressLine = [shop.address, shop.postalCode].filter(Boolean).join(' ');
  const hasDetails = Boolean(addressLine || shop.phone || shop.email);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.tile}>
          <Store size={18} color="#16794B" />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text className="text-foreground" style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
          <Text className="text-muted-foreground" style={styles.shopLocation} numberOfLines={1}>
            {location || 'No location'}
          </Text>
        </View>
      </View>

      <View style={styles.detailList}>
        {addressLine ? <DetailRow icon={MapPin} value={addressLine} /> : null}
        {shop.phone ? <DetailRow icon={Phone} value={shop.phone} /> : null}
        {shop.email ? <DetailRow icon={Mail} value={shop.email} /> : null}
        {!hasDetails ? <Text className="text-muted-foreground" style={styles.noDetails}>No contact details</Text> : null}
      </View>

      <View style={styles.cardFooter}>
        <Pressable
          onPress={onEdit}
          style={styles.footerAction}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${shop.name}`}
        >
          <Pencil size={14} color="#2367A8" />
          <Text style={[styles.footerText, styles.footerEdit]}>Edit</Text>
        </Pressable>
        <View style={styles.footerDivider} />
        <Pressable
          onPress={onDelete}
          style={styles.footerAction}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${shop.name}`}
        >
          <Trash2 size={14} color="#B42318" />
          <Text style={[styles.footerText, styles.footerDelete]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ShopsScreen() {
  const router = useRouter();
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
      setErrorMessage(error?.message || 'Unable to load shops.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [service]);

  React.useEffect(() => {
    void loadShops(1, false, false);
  }, [loadShops]);

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
    if (!form.name.trim()) errors.name = 'Shop name is required.';
    const email = (form.email ?? '').trim();
    if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSaving(true);
      if (form.id) {
        await service.updateShop({ ...form, name: form.name.trim() });
        SnackBar.Success(`Shop "${form.name.trim()}" updated successfully.`);
      } else {
        await service.createShop({ ...form, name: form.name.trim() });
        SnackBar.Success(`Shop "${form.name.trim()}" created successfully.`);
      }
      setModalVisible(false);
      await loadShops(1, false, false);
    } catch (error: any) {
      SnackBar.Error(error?.message || 'Unable to save shop.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (shop: Shop) => {
    RNAlert.alert(
      'Delete shop',
      `Are you sure you want to delete "${shop.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void handleDelete(shop) },
      ],
    );
  };

  const handleDelete = async (shop: Shop) => {
    try {
      await service.deleteShop(shop.id);
      SnackBar.Success(`Shop "${shop.name}" deleted successfully.`);
      await loadShops(1, false, false);
    } catch (error: any) {
      SnackBar.Error(error?.message || `Unable to delete shop "${shop.name}".`);
    }
  };

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon as={ChevronLeft} size={22} className="text-foreground" />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Shops</Text>
        <Button onPress={openCreate} style={styles.addButton}>
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New Shop</Text>
        </Button>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={15} color="#64748B" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, city, phone or email"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <X size={14} color="#64748B" />
            </Pressable>
          ) : null}
        </View>
        <Text className="text-muted-foreground" style={styles.countText}>
          {visibleShops.length} {visibleShops.length === 1 ? 'shop' : 'shops'}
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
            <ActivityIndicator size="large" color="#16794B" />
            <Text className="text-muted-foreground" style={styles.emptyText}>Loading shops...</Text>
          </View>
        ) : errorMessage && shops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className="text-foreground" style={styles.emptyTitle}>Unable to load shops</Text>
            <Text className="text-muted-foreground" style={styles.emptyText}>{errorMessage}</Text>
          </View>
        ) : shops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className="text-foreground" style={styles.emptyTitle}>No shops yet</Text>
            <Text className="text-muted-foreground" style={styles.emptyText}>Tap New Shop to add your first one.</Text>
          </View>
        ) : visibleShops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text className="text-muted-foreground" style={styles.emptyText}>No shops match your search.</Text>
          </View>
        ) : (
          visibleShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} onEdit={() => openEdit(shop)} onDelete={() => confirmDelete(shop)} />
          ))
        )}
        {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color="#16794B" /> : null}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
            <View className="bg-background" style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text className="text-foreground" style={styles.sheetTitle}>{form.id ? 'Edit Shop' : 'New Shop'}</Text>
                <Pressable onPress={closeModal} hitSlop={8} accessibilityLabel="Close">
                  <X size={20} color="#475569" />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
                <View style={styles.field}>
                  <Label className="text-foreground">Shop name <Text style={styles.required}>*</Text></Label>
                  <Input
                    value={form.name}
                    onChangeText={(value) => setField('name', value)}
                    placeholder="Enter shop name"
                    autoCapitalize="words"
                    editable={!saving}
                    maxLength={100}
                  />
                  {formErrors.name ? <Text style={styles.errorText}>{formErrors.name}</Text> : null}
                </View>

                <View style={styles.field}>
                  <Label className="text-foreground">Address</Label>
                  <Input
                    value={form.address}
                    onChangeText={(value) => setField('address', value)}
                    placeholder="Street address"
                    editable={!saving}
                    maxLength={200}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Label className="text-foreground">City</Label>
                    <Input value={form.city} onChangeText={(value) => setField('city', value)} placeholder="City" editable={!saving} maxLength={100} />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Label className="text-foreground">State / Division</Label>
                    <Input value={form.stateDivision} onChangeText={(value) => setField('stateDivision', value)} placeholder="State / Division" editable={!saving} maxLength={100} />
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldHalf}>
                    <Label className="text-foreground">Country</Label>
                    <Input value={form.country} onChangeText={(value) => setField('country', value)} placeholder="Country" editable={!saving} maxLength={100} />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Label className="text-foreground">Postal code</Label>
                    <Input value={form.postalCode} onChangeText={(value) => setField('postalCode', value)} placeholder="Postal code" editable={!saving} maxLength={20} />
                  </View>
                </View>

                <View style={styles.field}>
                  <Label className="text-foreground">Phone</Label>
                  <Input
                    value={form.phone}
                    onChangeText={(value) => setField('phone', value)}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                    editable={!saving}
                    maxLength={30}
                  />
                </View>

                <View style={styles.field}>
                  <Label className="text-foreground">Email</Label>
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
                  {formErrors.email ? <Text style={styles.errorText}>{formErrors.email}</Text> : null}
                </View>
              </ScrollView>

              <View style={styles.sheetFooter}>
                <Button variant="outline" onPress={closeModal} disabled={saving} style={styles.sheetButton}>
                  <Text className="text-foreground">Cancel</Text>
                </Button>
                <Button onPress={handleSubmit} disabled={saving} style={[styles.sheetButton, styles.saveButton]}>
                  {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveText}>Save Shop</Text>}
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  backButton: { minWidth: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#16794B' },
  addButtonText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  toolbar: { paddingHorizontal: 16, paddingTop: 12, gap: 6 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, height: '100%', fontSize: 13, color: '#0F172A' },
  countText: { fontSize: 11, fontWeight: '600' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, gap: 10 },
  card: { borderWidth: 1, borderColor: '#D9DEE5', borderRadius: 8, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  tile: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F4EC' },
  cardTitleWrap: { flex: 1, minWidth: 0, gap: 2 },
  shopName: { fontSize: 14, fontWeight: '800' },
  shopLocation: { fontSize: 11 },
  detailList: { paddingHorizontal: 12, paddingBottom: 12, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailText: { flex: 1, fontSize: 12 },
  noDetails: { fontSize: 11 },
  cardFooter: { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
  footerAction: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footerDivider: { width: StyleSheet.hairlineWidth, backgroundColor: '#CBD5E1' },
  footerText: { fontSize: 12, fontWeight: '700' },
  footerEdit: { color: '#2367A8' },
  footerDelete: { color: '#B42318' },
  emptyState: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { marginTop: 8, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.38)' },
  sheetWrap: { maxHeight: '92%' },
  sheet: { borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingTop: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#CBD5E1' },
  sheetTitle: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  formContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  field: { gap: 6 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1, gap: 6 },
  required: { color: '#B42318' },
  errorText: { fontSize: 11, color: '#B42318' },
  sheetFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#CBD5E1' },
  sheetButton: { flex: 1, borderRadius: 6 },
  saveButton: { backgroundColor: '#16794B' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
});
