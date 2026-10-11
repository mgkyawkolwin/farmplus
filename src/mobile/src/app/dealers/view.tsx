'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  ChevronLeft,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from 'lucide-react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DealerItem } from '@/models/dealer';
import { DealerServiceClient } from '@/services/dealerService';
import SnackBar from '@/components/ui/snack-bar';

export default function DealerViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const dealerId = Array.isArray(params.id) ? params.id[0] : params.id;

  const service = React.useMemo(() => new DealerServiceClient(), []);
  const [dealer, setDealer] = React.useState<DealerItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadDealer = React.useCallback(async () => {
    if (!dealerId) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      const result = await service.getDealerById(dealerId);
      setDealer(result);
    } catch (error) {
      SnackBar.Error('Failed to load dealer details.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [dealerId, router, service]);

  useFocusEffect(
    React.useCallback(() => {
      void loadDealer();
      return undefined;
    }, [loadDealer]),
  );

  if (!dealer) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text className="text-muted-foreground" style={styles.loadingText}>
            Loading dealer...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const location = [
    dealer.address,
    dealer.city,
    dealer.stateDivision,
    dealer.country,
  ]
    .filter(Boolean)
    .join(', ');

  const detailRows = [
    { icon: Phone, label: 'Phone', value: dealer.phoneNumber || '-' },
    { icon: Mail, label: 'Email', value: dealer.email || '-' },
    { icon: MapPin, label: 'Address', value: location || '-' },
    { icon: Globe, label: 'Country', value: dealer.country || '-' },
  ];

  const initial = dealer.dealerName?.charAt(0).toUpperCase() || 'D';
  const subtitle =
    [dealer.city, dealer.country].filter(Boolean).join(', ') || 'Dealer';

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <View style={styles.headerBar}>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text style={styles.headerTitle}>Dealer</Text>
        <Button
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: '/dealers/edit',
              params: { id: dealer.id },
            })
          }
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Pencil} size={18} />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profilePanel}>
          <View style={styles.logoWrap}>
            {dealer.logoUrl ? (
              <Image
                source={{ uri: dealer.logoUrl }}
                style={styles.logoImage}
              />
            ) : (
              <Text style={styles.logoInitial}>{initial}</Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.dealerName} numberOfLines={1}>
              {dealer.dealerName}
            </Text>
            <Text style={styles.dealerMeta} numberOfLines={1}>
              {subtitle}
            </Text>
            <View
              style={[
                styles.statusPill,
                dealer.isActive
                  ? styles.statusPillActive
                  : styles.statusPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  dealer.isActive
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {dealer.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Contact & Location</Text>
        <View style={styles.panel}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                index < detailRows.length - 1 ? styles.rowDivider : null,
              ]}
            >
              <View style={styles.detailIconWrap}>
                <Icon
                  className="text-muted-foreground"
                  as={row.icon}
                  size={16}
                />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.fieldLabel}>{row.label}</Text>
                <Text style={styles.fieldValue} numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  ink: '#0F172A',
  muted: '#64748B',
  border: '#D9DEE5',
  rowBorder: '#CBD5E1',
  green: '#16794B',
  greenTint: '#F4FAF6',
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: { minWidth: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
  },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 13, color: COLORS.muted },
  profilePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: COLORS.border,
    borderTopColor: COLORS.green,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.greenTint,
  },
  logoImage: { width: '100%', height: '100%' },
  logoInitial: { fontSize: 22, fontWeight: '800', color: COLORS.green },
  profileInfo: { flex: 1, minWidth: 0, gap: 3 },
  dealerName: { fontSize: 18, fontWeight: '800', color: COLORS.ink },
  dealerMeta: { fontSize: 12, color: COLORS.muted },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillActive: { backgroundColor: '#D1FAE5' },
  statusPillInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  statusTextActive: { color: '#047857' },
  statusTextInactive: { color: '#B91C1C' },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.muted,
  },
  panel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.rowBorder,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  detailText: { flex: 1, minWidth: 0, gap: 2 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.muted,
  },
  fieldValue: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
});
