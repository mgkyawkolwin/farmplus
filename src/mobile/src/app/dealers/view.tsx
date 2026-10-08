'use client';

import * as React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { ChevronLeft, Globe, Mail, MapPin, Phone } from 'lucide-react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DealerItem } from '@/models/dealer';
import { DealerServiceClient } from '@/services/dealerService';
import SnackBar from '@/components/ui/snack-bar';

export default function DealerViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
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
    }, [loadDealer])
  );

  if (!dealer) {
    return (
      <SafeAreaView className="flex-1 bg-background" style={styles.page}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-muted-foreground" style={styles.loadingText}>
            Loading dealer...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const location = [dealer.address, dealer.city, dealer.stateDivision, dealer.country]
    .filter(Boolean)
    .join(', ');

  const detailRows = [
    { icon: Phone, label: 'Phone', value: dealer.phoneNumber || '-' },
    { icon: Mail, label: 'Email', value: dealer.email || '-' },
    { icon: MapPin, label: 'Address', value: location || '-' },
    { icon: Globe, label: 'Country', value: dealer.country || '-' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar
        className="bg-background"
        barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'}
      />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          Dealer
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          {dealer.logoUrl ? (
            <Image source={{ uri: dealer.logoUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderText}>{dealer.dealerName?.charAt(0) || 'D'}</Text>
            </View>
          )}

          <View style={styles.heroInfo}>
            <Text className="text-foreground" style={styles.dealerName}>
              {dealer.dealerName}
            </Text>
            <Text className="text-muted-foreground" style={styles.dealerMeta}>
              {dealer.isActive ? 'Active dealer' : 'Inactive dealer'}
            </Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileMain}>
            <Badge variant={dealer.isActive ? 'default' : 'outline'} style={styles.badge}>
              <Text>{dealer.isActive ? 'Active' : 'Inactive'}</Text>
            </Badge>
          </View>

          <View style={styles.detailsSection}>
            {detailRows.map((row, index) => (
              <View key={row.label} style={[styles.detailRow, index < detailRows.length - 1 ? styles.detailRowBorder : null]}>
                <View style={styles.detailIconWrap}>
                  <Icon className="text-foreground" as={row.icon} size={18} />
                </View>

                <View style={styles.detailTextWrap}>
                  <Text className="text-muted-foreground" style={styles.detailLabel}>
                    {row.label}
                  </Text>
                  <Text className="text-foreground" style={styles.detailValue}>
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButton: { minWidth: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },
  content: { padding: 16, gap: 16 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12 },
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  heroImage: { width: '100%', height: 220, resizeMode: 'cover' },
  heroPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: { color: '#FFFFFF', fontSize: 36, fontWeight: '700' },
  heroInfo: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  dealerName: { fontSize: 22, fontWeight: '700' },
  dealerMeta: { marginTop: 4, fontSize: 14 },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  profileMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12 },
  badge: { alignSelf: 'flex-end' },
  detailsSection: { gap: 8 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 12, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '500' },
});
