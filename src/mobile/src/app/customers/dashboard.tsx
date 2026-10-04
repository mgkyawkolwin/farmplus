'use client';

import { useRouter } from 'expo-router';
import { CustomerDashboardContent } from '@/components/customer-dashboard';

export default function CustomersDashboardScreen() {
  const router = useRouter();

  return <CustomerDashboardContent title="Customers" onBack={() => router.back()} />;
}
