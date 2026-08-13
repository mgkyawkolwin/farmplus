export interface DealerItem {
  id: string;
  dealerName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  stateDivision?: string;
  city?: string;
  country?: string;
  logoUrl?: string | null;
  isActive: boolean;
  rowVersion?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface DealerListPayload {
  items?: DealerItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}
