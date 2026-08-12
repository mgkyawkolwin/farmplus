import { authenticatedFetchApi } from '@/lib/apiClient';
import { SupplierItem, SupplierListPayload } from '@/models/supplier';

export interface ISupplierService {
  getSuppliers(page?: number, pageSize?: number): Promise<SupplierItem[]>;
  createSupplier(request: Partial<SupplierItem>): Promise<SupplierItem>;
  updateSupplier(request: SupplierItem): Promise<SupplierItem>;
  deleteSupplier(id: string): Promise<void>;
}

export class SupplierServiceClient implements ISupplierService {
  async getSuppliers(page = 1, pageSize = 50): Promise<SupplierItem[]> {
    const response = await authenticatedFetchApi(`/suppliers?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });

    const payload = response.data as SupplierListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items.map(mapSupplier) : [];
  }

  async createSupplier(request: Partial<SupplierItem>): Promise<SupplierItem> {
    const response = await authenticatedFetchApi('/suppliers', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return mapSupplier(response.data as SupplierItem | undefined);
  }

  async updateSupplier(request: SupplierItem): Promise<SupplierItem> {
    const response = await authenticatedFetchApi(`/suppliers/${request.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    return mapSupplier(response.data as SupplierItem | undefined);
  }

  async deleteSupplier(id: string): Promise<void> {
    await authenticatedFetchApi(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }
}

function mapSupplier(item?: Partial<SupplierItem> | null): SupplierItem {
  return {
    id: item?.id ?? '',
    supplierName: item?.supplierName ?? '',
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
