import { authenticatedFetchApi } from '@/lib/apiClient';
import { Purchase, PurchaseListPayload, PurchaseRequest, UpdatePurchaseRequest } from '@/models/purchase';

export interface IPurchaseService {
  getPurchases(page?: number, pageSize?: number): Promise<Purchase[]>;
  getPurchaseById(id: string): Promise<Purchase>;
  createPurchase(request: PurchaseRequest): Promise<Purchase>;
  updatePurchase(id: string, request: UpdatePurchaseRequest): Promise<Purchase>;
  deletePurchase(id: string): Promise<void>;
}

export class PurchaseServiceClient implements IPurchaseService {
  async getPurchases(page = 1, pageSize = 20): Promise<Purchase[]> {
    const response = await authenticatedFetchApi(`/purchases?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });
    const payload = response.data as PurchaseListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async getPurchaseById(id: string): Promise<Purchase> {
    const response = await authenticatedFetchApi(`/purchases/${id}`, { method: 'GET' });
    return response.data as Purchase;
  }

  async createPurchase(request: PurchaseRequest): Promise<Purchase> {
    const response = await authenticatedFetchApi('/purchases', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data as Purchase;
  }

  async updatePurchase(id: string, request: UpdatePurchaseRequest): Promise<Purchase> {
    const response = await authenticatedFetchApi(`/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    return response.data as Purchase;
  }

  async deletePurchase(id: string): Promise<void> {
    await authenticatedFetchApi(`/purchases/${id}`, { method: 'DELETE' });
  }
}