import { authenticatedFetchApi } from '@/lib/apiClient';
import { PermissionPage, RolePermissionKeysPayload } from '@/models/rolePermission';

export interface CurrentPermissions {
  permissionKeys: string[];
  isExempt: boolean;
}

export class RolePermissionServiceClient {
  async getCatalog(): Promise<PermissionPage[]> {
    const response = await authenticatedFetchApi('/rolepermissions', { method: 'GET' });
    return Array.isArray(response.data) ? response.data as PermissionPage[] : [];
  }

  async getRolePermissionKeys(roleId: string): Promise<string[]> {
    const response = await authenticatedFetchApi(`/rolepermissions/${roleId}`, { method: 'GET' });
    return (response.data as RolePermissionKeysPayload | undefined)?.permissionKeys ?? [];
  }

  async getCurrentPermissionKeys(): Promise<string[]> {
    return (await this.getCurrentPermissions()).permissionKeys;
  }

  async getCurrentPermissions(): Promise<CurrentPermissions> {
    const response = await authenticatedFetchApi('/rolepermissions/me', { method: 'GET' });
    const payload = response.data as (RolePermissionKeysPayload & { isExempt?: boolean }) | undefined;
    return {
      permissionKeys: payload?.permissionKeys ?? [],
      isExempt: payload?.isExempt ?? false,
    };
  }

  async updateRolePermissionKeys(roleId: string, permissionKeys: string[]): Promise<void> {
    await authenticatedFetchApi(`/rolepermissions/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissionKeys }),
    });
  }
}