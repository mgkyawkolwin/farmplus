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
  clearLogoUrl?: boolean;
  isActive: boolean;
  totalOrders?: number;
  totalSales?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  recentSales?: Array<{
    id: string;
    saleDate: string;
    netTotal: number;
    balance: number;
    status: string;
  }>;
  recentPayments?: Array<{
    id: string;
    saleId: string;
    amount: number;
    balanceAfter: number;
    paidAt: string;
  }>;
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
