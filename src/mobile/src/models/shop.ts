export interface Shop {
  id: string;
  name: string;
  address?: string;
  city?: string;
  stateDivision?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  rowVersion?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface ShopListPayload {
  items?: Shop[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}
