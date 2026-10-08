export interface SaleItem {
  productId: string;
  productName: string;
  productImageUrl?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxTotal: number;
  lineTotal: number;
}

export interface SalePayment {
  id: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paidAt: string;
  receivedByName?: string;
}

export interface Sale {
  id: string;
  customerId?: string;
  customerName: string;
  saleDate: string;
  totalProducts: number;
  subTotal: number;
  taxRate: number;
  tax: number;
  discount: number;
  netTotal: number;
  paidAmount: number;
  balance: number;
  status?: 'Completed' | 'Voided' | string;
  voidReason?: string;
  voidedAt?: string;
  voidedByName?: string;
  createdAt?: string;
  createdByName?: string;
  updatedAt?: string;
  updatedByName?: string;
  items?: SaleItem[];
  payments?: SalePayment[];
}

export interface SaleListPayload {
  items?: Sale[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface SaleDashboard {
  todaySales: number;
  thisMonthSales: number;
  unpaidSales: number;
  unpaidAmount: number;
  totalProducts: number;
  totalCustomers: number;
  recentSales: Sale[];
}

export interface CreateSaleRequest {
  customerId?: string;
  taxRate?: number;
  discount?: number;
  paidAmount?: number;
  items: Array<{ productId: string; quantity: number }>;
}