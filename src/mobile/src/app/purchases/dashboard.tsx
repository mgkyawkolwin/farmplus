'use client';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PurchaseDashboardContent } from '@/components/purchase-dashboard';

export default function PurchaseDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <PurchaseDashboardContent showHeader title="Purchases" onBack={() => router.back()} />
    </SafeAreaView>
  );
}
