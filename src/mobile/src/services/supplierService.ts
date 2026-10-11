import { authenticatedFetchApi } from "@/lib/apiClient";
import { Supplier, SupplierListPayload } from "@/models/supplier";
import { Purchase, PurchaseListPayload } from "@/models/purchase";

export interface ISupplierService {
  getSuppliers(page?: number, pageSize?: number): Promise<Supplier[]>;
  getSupplierById(id: string): Promise<Supplier>;
  getSupplierPurchases(
    id: string,
    page?: number,
    pageSize?: number,
  ): Promise<Purchase[]>;
  createSupplier(request: Partial<Supplier>): Promise<Supplier>;
  updateSupplier(request: Supplier): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;
  uploadSupplierLogo(
    id: string,
    file: { uri: string; name: string; type: string },
  ): Promise<Supplier>;
}

export class SupplierServiceClient implements ISupplierService {
  async getSuppliers(page = 1, pageSize = 50): Promise<Supplier[]> {
    const response = await authenticatedFetchApi(
      `/suppliers?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
      },
    );

    const payload = response.data as SupplierListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items.map(mapSupplier) : [];
  }

  async getSupplierById(id: string): Promise<Supplier> {
    const response = await authenticatedFetchApi(`/suppliers/${id}`, {
      method: "GET",
    });
    return mapSupplier(response.data as Supplier | undefined);
  }

  async getSupplierPurchases(
    id: string,
    page = 1,
    pageSize = 20,
  ): Promise<Purchase[]> {
    const response = await authenticatedFetchApi(
      `/suppliers/${id}/purchases?page=${page}&pageSize=${pageSize}`,
      { method: "GET" },
    );
    const payload = response.data as PurchaseListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async createSupplier(request: Partial<Supplier>): Promise<Supplier> {
    const response = await authenticatedFetchApi("/suppliers", {
      method: "POST",
      body: JSON.stringify(request),
    });

    return mapSupplier(response.data as Supplier | undefined);
  }

  async updateSupplier(request: Supplier): Promise<Supplier> {
    const response = await authenticatedFetchApi(`/suppliers/${request.id}`, {
      method: "PUT",
      body: JSON.stringify(request),
    });

    return mapSupplier(response.data as Supplier | undefined);
  }

  async deleteSupplier(id: string): Promise<void> {
    await authenticatedFetchApi(`/suppliers/${id}`, {
      method: "DELETE",
    });
  }

  async uploadSupplierLogo(
    id: string,
    file: { uri: string; name: string; type: string },
  ): Promise<Supplier> {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
    const response = await authenticatedFetchApi(`/suppliers/${id}/logo`, {
      method: "PATCH",
      body: formData,
    });
    return mapSupplier(response.data as Supplier | undefined);
  }
}

function mapSupplier(item?: Partial<Supplier> | null): Supplier {
  return {
    id: item?.id ?? "",
    supplierName: item?.supplierName ?? "",
    email: item?.email,
    phoneNumber: item?.phoneNumber,
    address: item?.address,
    stateDivision: item?.stateDivision,
    city: item?.city,
    country: item?.country,
    logoUrl: item?.logoUrl,
    isActive: item?.isActive ?? false,
    recentPurchases: item?.recentPurchases,
    rowVersion: item?.rowVersion,
    createdAtUtc: item?.createdAtUtc,
    updatedAtUtc: item?.updatedAtUtc,
  };
}
