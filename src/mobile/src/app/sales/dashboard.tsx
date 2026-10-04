'use client';

import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { SalesDashboardContent } from '@/components/sales-dashboard';

export default function SalesDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <SalesDashboardContent onBack={() => router.back()} />
    </SafeAreaView>
  );
}