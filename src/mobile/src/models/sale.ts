export interface Sale {
  id: string;
  customerId?: string;
  customerName: string;
  saleDate: string;
  totalProducts: number;
  subTotal: number;
  tax: number;
  netTotal: number;
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
  totalProducts: number;
  totalCustomers: number;
  recentSales: Sale[];
}

export interface CreateSaleRequest {
  customerId?: string;
  items: Array<{ productId: string; quantity: number }>;
}