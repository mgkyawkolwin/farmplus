'use client';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductsDashboardContent } from '@/components/product-dashboard';

export default function ProductDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ProductsDashboardContent showHeader title="Products" onBack={() => router.back()} />
    </SafeAreaView>
  );
}
