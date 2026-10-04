'use client';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SupplierDashboardContent } from '@/components/supplier-dashboard';

export default function SupplierDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <SupplierDashboardContent showHeader title="Suppliers" onBack={() => router.back()} />
    </SafeAreaView>
  );
}
