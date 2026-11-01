'use client';

import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PurchaseDashboardContent } from '@/components/purchase-dashboard';
import { THEME } from '@/lib/theme';

export default function PurchaseDashboardScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <PurchaseDashboardContent showHeader onBack={() => router.back()} />
    </SafeAreaView>
  );
}
