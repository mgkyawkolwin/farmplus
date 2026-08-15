export interface Supplier {
  id: string;
  supplierName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  stateDivision?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  isActive: boolean;
  rowVersion?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface SupplierListPayload {
  items?: Supplier[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}
