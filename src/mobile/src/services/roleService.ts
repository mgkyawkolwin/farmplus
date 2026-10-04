import { authenticatedFetchApi } from '@/lib/apiClient';
import { CreateRoleRequest, RoleItem, RoleListPayload, UpdateRoleRequest } from '@/models/role';

export interface IRoleService {
  getRoles(page?: number, pageSize?: number): Promise<RoleItem[]>;
  getRoleById(id: string): Promise<RoleItem>;
  createRole(request: CreateRoleRequest): Promise<RoleItem>;
  updateRole(id: string, request: UpdateRoleRequest): Promise<RoleItem>;
  deleteRole(id: string): Promise<void>;
}

export class RoleServiceClient implements IRoleService {
  async getRoles(page = 1, pageSize = 20): Promise<RoleItem[]> {
    const response = await authenticatedFetchApi(`/roles?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });
    const payload = response.data as RoleListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async getRoleById(id: string): Promise<RoleItem> {
    const response = await authenticatedFetchApi(`/roles/${id}`, { method: 'GET' });
    return response.data as RoleItem;
  }

  async createRole(request: CreateRoleRequest): Promise<RoleItem> {
    const response = await authenticatedFetchApi('/roles', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data as RoleItem;
  }

  async updateRole(id: string, request: UpdateRoleRequest): Promise<RoleItem> {
    const response = await authenticatedFetchApi(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    return response.data as RoleItem;
  }

  async deleteRole(id: string): Promise<void> {
    await authenticatedFetchApi(`/roles/${id}`, { method: 'DELETE' });
  }
}