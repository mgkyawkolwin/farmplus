export interface CategoryItem {
  id: string;
  category: string;
  isActive?: boolean;
  rowVersion?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface CategoryListPayload {
  items?: CategoryItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}