import { authenticatedFetchApi } from '@/lib/apiClient';
import { CreateSaleRequest, Sale, SaleDashboard, SaleListPayload } from '@/models/sale';

export interface ISaleService {
  getDashboard(): Promise<SaleDashboard>;
  getSales(page?: number, pageSize?: number): Promise<Sale[]>;
  getSaleById(id: string): Promise<Sale>;
  createSale(request: CreateSaleRequest): Promise<Sale>;
  updateSale(id: string, taxRate: number, discount: number): Promise<Sale>;
  voidSale(id: string, reason: string): Promise<Sale>;
  addPayment(id: string, amount: number): Promise<Sale>;
}

export class SaleServiceClient implements ISaleService {
  async getDashboard(): Promise<SaleDashboard> {
    const response = await authenticatedFetchApi('/sales/dashboard', { method: 'GET' });
    return response.data as SaleDashboard;
  }

  async getSales(page = 1, pageSize = 20): Promise<Sale[]> {
    const response = await authenticatedFetchApi(`/sales?page=${page}&pageSize=${pageSize}`, { method: 'GET' });
    const payload = response.data as SaleListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async getSaleById(id: string): Promise<Sale> {
    const response = await authenticatedFetchApi(`/sales/${id}`, { method: 'GET' });
    return response.data as Sale;
  }

  async createSale(request: CreateSaleRequest): Promise<Sale> {
    const response = await authenticatedFetchApi('/sales', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data as Sale;
  }

  async updateSale(id: string, taxRate: number, discount: number): Promise<Sale> {
    const response = await authenticatedFetchApi(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ taxRate, discount }),
    });
    return response.data as Sale;
  }

  async voidSale(id: string, reason: string): Promise<Sale> {
    const response = await authenticatedFetchApi(`/sales/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.data as Sale;
  }

  async addPayment(id: string, amount: number): Promise<Sale> {
    const response = await authenticatedFetchApi(`/sales/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    return response.data as Sale;
  }
}