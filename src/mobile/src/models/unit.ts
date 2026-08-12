export interface UnitItem {
  id: string;
  unit: string;
  isActive: boolean;
  rowVersion?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface UnitListPayload {
  items?: UnitItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}
