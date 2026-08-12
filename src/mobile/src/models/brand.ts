export interface BrandItem {
  id: string;
  brand: string;
  isActive: boolean;
  rowVersion?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface BrandListPayload {
  items?: BrandItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}
