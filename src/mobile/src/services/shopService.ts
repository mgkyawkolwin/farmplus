import { authenticatedFetchApi } from '@/lib/apiClient';
import { Shop, ShopListPayload } from '@/models/shop';

export interface IShopService {
  getShops(page?: number, pageSize?: number): Promise<Shop[]>;
  createShop(request: Partial<Shop>): Promise<Shop>;
  updateShop(request: Shop): Promise<Shop>;
  deleteShop(id: string): Promise<void>;
}

export class ShopServiceClient implements IShopService {
  async getShops(page = 1, pageSize = 20): Promise<Shop[]> {
    const response = await authenticatedFetchApi(`/shops?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });

    const payload = response.data as ShopListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items.map(mapShop) : [];
  }

  async createShop(request: Partial<Shop>): Promise<Shop> {
    const response = await authenticatedFetchApi('/shops', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return mapShop(response.data as Shop | undefined);
  }

  async updateShop(request: Shop): Promise<Shop> {
    const response = await authenticatedFetchApi(`/shops/${request.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    return mapShop(response.data as Shop | undefined);
  }

  async deleteShop(id: string): Promise<void> {
    await authenticatedFetchApi(`/shops/${id}`, {
      method: 'DELETE',
    });
  }
}

function mapShop(item?: Partial<Shop> | null): Shop {
  return {
    id: item?.id ?? '',
    name: item?.name ?? '',
    address: item?.address,
    city: item?.city,
    stateDivision: item?.stateDivision,
    country: item?.country,
    postalCode: item?.postalCode,
    phone: item?.phone,
    email: item?.email,
    rowVersion: item?.rowVersion,
    createdAtUtc: item?.createdAtUtc,
    updatedAtUtc: item?.updatedAtUtc,
  };
}
