import { authenticatedFetchApi } from '@/lib/apiClient';
import { DealerItem, DealerListPayload } from '@/models/dealer';

export interface IDealerService {
  getDealers(page?: number, pageSize?: number): Promise<DealerItem[]>;
  createDealer(request: Partial<DealerItem>): Promise<DealerItem>;
  updateDealer(request: DealerItem): Promise<DealerItem>;
  deleteDealer(id: string): Promise<void>;
}

export class DealerServiceClient implements IDealerService {
  async getDealers(page = 1, pageSize = 50): Promise<DealerItem[]> {
    const response = await authenticatedFetchApi(`/dealers?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });

    const payload = response.data as DealerListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items.map(mapDealer) : [];
  }

  async createDealer(request: Partial<DealerItem>): Promise<DealerItem> {
    const response = await authenticatedFetchApi('/dealers', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return mapDealer(response.data as DealerItem | undefined);
  }

  async updateDealer(request: DealerItem): Promise<DealerItem> {
    const response = await authenticatedFetchApi(`/dealers/${request.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    return mapDealer(response.data as DealerItem | undefined);
  }

  async deleteDealer(id: string): Promise<void> {
    await authenticatedFetchApi(`/dealers/${id}`, {
      method: 'DELETE',
    });
  }
}

function mapDealer(item?: Partial<DealerItem> | null): DealerItem {
  return {
    id: item?.id ?? '',
    dealerName: item?.dealerName ?? '',
    email: item?.email,
    phoneNumber: item?.phoneNumber,
    address: item?.address,
    stateDivision: item?.stateDivision,
    city: item?.city,
    country: item?.country,
    logoUrl: item?.logoUrl,
    isRequired: item?.isRequired ?? false,
    rowVersion: item?.rowVersion,
    createdAtUtc: item?.createdAtUtc,
    updatedAtUtc: item?.updatedAtUtc,
  };
}
