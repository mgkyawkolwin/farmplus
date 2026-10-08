'use client';

import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { InventoryDashboardContent } from '@/components/inventory-dashboard';

export default function InventoryDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <InventoryDashboardContent onBack={() => router.back()} />
    </SafeAreaView>
  );
}
