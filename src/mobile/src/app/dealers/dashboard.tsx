'use client';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DealerDashboardContent } from '@/components/dealer-dashboard';

export default function DealerDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <DealerDashboardContent showHeader title="Dealers" onBack={() => router.back()} />
    </SafeAreaView>
  );
}
