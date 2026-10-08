import * as React from 'react';

import { getSelectedShopId } from '@/lib/authStorage';
import { useSelectedShopChanged } from '@/lib/selectedShop';
import { ShopServiceClient } from '@/services/shopService';

const shopService = new ShopServiceClient();

/** Resolves the name of the shop chosen in the top bar and keeps it in sync when it changes. */
export function useSelectedShopName() {
  const [shopName, setShopName] = React.useState<string | null>(null);
  const [shopLoaded, setShopLoaded] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const [shopId, shops] = await Promise.all([getSelectedShopId(), shopService.getShops(1, 200)]);
      setShopName(shops.find((shop) => shop.id === shopId)?.name ?? null);
    } catch {
      setShopName(null);
    } finally {
      setShopLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  useSelectedShopChanged(() => {
    void load();
  });

  return { shopName, shopLoaded };
}
