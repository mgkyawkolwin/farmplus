export interface PermissionPage {
  key: string;
  group: string;
  title: string;
}

export interface PermissionCatalogPayload {
  items?: PermissionPage[];
}

export interface RolePermissionKeysPayload {
  permissionKeys?: string[];
}