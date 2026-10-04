import { SafeAreaView } from 'react-native-safe-area-context';

import HomeTopBar from '@/components/homeTopBar';
import { PurchaseDashboardContent } from '@/components/purchase-dashboard';

export default function PurchasesTab() {
  return (
    <SafeAreaView className="bg-background" style={{ flex: 1 }}>
      <HomeTopBar />
      <PurchaseDashboardContent showHeader={false} title="Purchases" />
    </SafeAreaView>
  );
}
