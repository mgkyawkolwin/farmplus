import { authenticatedFetchApi } from '@/lib/apiClient';
import { BrandItem, BrandListPayload } from '@/models/brand';

export interface IBrandService {
  getBrands(page?: number, pageSize?: number): Promise<BrandItem[]>;
  createBrand(brand: string, isActive?: boolean): Promise<BrandItem>;
  updateBrand(brand: BrandItem): Promise<BrandItem>;
  deleteBrand(id: string): Promise<void>;
}

export class BrandServiceClient implements IBrandService {
  async getBrands(page = 1, pageSize = 50): Promise<BrandItem[]> {
    const response = await authenticatedFetchApi(`/brands?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });

    const payload = response.data as BrandListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items.map(mapBrand) : [];
  }

  async createBrand(brand: string, isActive = true): Promise<BrandItem> {
    const response = await authenticatedFetchApi('/brands', {
      method: 'POST',
      body: JSON.stringify({ brand, isActive }),
    });

    return mapBrand(response.data as BrandItem | undefined);
  }

  async updateBrand(brand: BrandItem): Promise<BrandItem> {
    const response = await authenticatedFetchApi(`/brands/${brand.id}`, {
      method: 'PUT',
      body: JSON.stringify(brand),
    });

    return mapBrand(response.data as BrandItem | undefined);
  }

  async deleteBrand(id: string): Promise<void> {
    await authenticatedFetchApi(`/brands/${id}`, {
      method: 'DELETE',
    });
  }
}

function mapBrand(item?: Partial<BrandItem> | null): BrandItem {
  return {
    id: item?.id ?? '',
    brand: item?.brand ?? '',
    isActive: item?.isActive ?? true,
    rowVersion: item?.rowVersion,
    createdAtUtc: item?.createdAtUtc,
    updatedAtUtc: item?.updatedAtUtc,
  };
}
