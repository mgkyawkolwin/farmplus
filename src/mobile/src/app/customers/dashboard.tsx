'use client';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomerDashboardContent } from '@/components/customer-dashboard';

export default function CustomersDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomerDashboardContent showHeader title="Customers" onBack={() => router.back()} />
    </SafeAreaView>
  );
}
