export interface CustomerItem {
  id: string;
  name: string;
  nationalIdNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  isActive: boolean;
  rowVersion?: string;
  createdAtUtc?: string;
  createdById?: string;
  updatedAtUtc?: string;
  updatedById?: string;
}

export interface CustomerListPayload {
  items?: CustomerItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface CreateCustomerRequest {
  name: string;
  nationalIdNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  isActive?: boolean;
}

export interface UpdateCustomerRequest {
  id: string;
  name: string;
  nationalIdNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  isActive?: boolean;
  rowVersion?: string;
}
