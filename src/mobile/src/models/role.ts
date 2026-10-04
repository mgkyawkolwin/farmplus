export interface RoleItem {
  id: string;
  role: string;
  rowVersion?: string;
}

export interface RoleListPayload {
  items?: RoleItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface CreateRoleRequest {
  role: string;
}

export interface UpdateRoleRequest {
  role: string;
  rowVersion: string;
}