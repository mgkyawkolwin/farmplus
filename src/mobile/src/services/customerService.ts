import { authenticatedFetchApi } from '@/lib/apiClient';
import {
  CustomerItem,
  CustomerListPayload,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/models/customer';

export interface ICustomerService {
  getCustomers(page?: number, pageSize?: number, name?: string, isActive?: boolean): Promise<CustomerItem[]>;
  getCustomerById(id: string): Promise<CustomerItem>;
  createCustomer(request: CreateCustomerRequest): Promise<CustomerItem>;
  updateCustomer(request: UpdateCustomerRequest): Promise<CustomerItem>;
  uploadCustomerProfilePicture(id: string, file: { uri: string; name: string; type: string }): Promise<CustomerItem>;
  deleteCustomer(id: string): Promise<void>;
}

export class CustomerServiceClient implements ICustomerService {
  async getCustomers(page = 1, pageSize = 20, name?: string, isActive?: boolean): Promise<CustomerItem[]> {
    let url = `/customers?page=${page}&pageSize=${pageSize}`;
    if (name) {
      url += `&name=${encodeURIComponent(name)}`;
    }
    if (typeof isActive === 'boolean') {
      url += `&isActive=${isActive}`;
    }

    const response = await authenticatedFetchApi(url, {
      method: 'GET',
    });

    const payload = response.data as CustomerListPayload | undefined;
    return Array.isArray(payload?.items)
      ? payload.items
      : [];
  }

  async getCustomerById(id: string): Promise<CustomerItem> {
    const response = await authenticatedFetchApi(`/customers/${id}`, {
      method: 'GET',
    });

    return response.data as CustomerItem;
  }

  async createCustomer(request: CreateCustomerRequest): Promise<CustomerItem> {
    const response = await authenticatedFetchApi('/customers', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response.data as CustomerItem;
  }

  async updateCustomer(request: UpdateCustomerRequest): Promise<CustomerItem> {
    const response = await authenticatedFetchApi(`/customers/${request.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    return response.data as CustomerItem;
  }

  async uploadCustomerProfilePicture(id: string, file: { uri: string; name: string; type: string }): Promise<CustomerItem> {
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);

    const response = await authenticatedFetchApi(`/customers/${id}/profilePicture`, {
      method: 'PATCH',
      body: formData,
    });

    return response.data as CustomerItem;
  }

  async deleteCustomer(id: string): Promise<void> {
    await authenticatedFetchApi(`/customers/${id}`, {
      method: 'DELETE',
    });
  }
}
