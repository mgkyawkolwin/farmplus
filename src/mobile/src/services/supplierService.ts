import { authenticatedFetchApi } from '@/lib/apiClient';
import { Supplier, SupplierListPayload } from '@/models/supplier';

export interface ISupplierService {
  getSuppliers(page?: number, pageSize?: number): Promise<Supplier[]>;
  createSupplier(request: Partial<Supplier>): Promise<Supplier>;
  updateSupplier(request: Supplier): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;
}

export class SupplierServiceClient implements ISupplierService {
  async getSuppliers(page = 1, pageSize = 50): Promise<Supplier[]> {
    const response = await authenticatedFetchApi(`/suppliers?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });

    const payload = response.data as SupplierListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items.map(mapSupplier) : [];
  }

  async createSupplier(request: Partial<Supplier>): Promise<Supplier> {
    const response = await authenticatedFetchApi('/suppliers', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return mapSupplier(response.data as Supplier | undefined);
  }

  async updateSupplier(request: Supplier): Promise<Supplier> {
    const response = await authenticatedFetchApi(`/suppliers/${request.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    return mapSupplier(response.data as Supplier | undefined);
  }

  async deleteSupplier(id: string): Promise<void> {
    await authenticatedFetchApi(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }
}

function mapSupplier(item?: Partial<Supplier> | null): Supplier {
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
    isActive: item?.isActive ?? false,
    rowVersion: item?.rowVersion,
    createdAtUtc: item?.createdAtUtc,
    updatedAtUtc: item?.updatedAtUtc,
  };
}
