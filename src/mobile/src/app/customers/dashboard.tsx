'use client';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

import { CustomerDashboardContent } from '@/components/customer-dashboard';
import { THEME } from '@/lib/theme';

export default function CustomersDashboardScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <CustomerDashboardContent showHeader title="Customer Dashboard" onBack={() => router.back()} />
    </SafeAreaView>
  );
}
