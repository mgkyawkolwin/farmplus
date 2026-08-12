export interface SupplierItem {
  id: string;
  supplierName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  stateDivision?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  isRequired: boolean;
  rowVersion?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface SupplierListPayload {
  items?: SupplierItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}
