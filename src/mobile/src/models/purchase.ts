export interface PurchaseItem {
  id?: string;
  productId: string;
  productName: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseItemForm {
  productId: string;
  productName: string;
  unit?: string;
  quantity: string;
  unitPrice: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  totalProducts: number;
  subTotal: number;
  discount: number;
  tax: number;
  netTotal: number;
  rowVersion?: string;
  items: PurchaseItem[];
}

export interface PurchaseListPayload {
  items?: Purchase[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface PurchaseRequest {
  supplierId: string;
  purchaseDate: string;
  discount: number;
  tax: number;
  items: PurchaseItemRequest[];
}

export interface UpdatePurchaseRequest extends PurchaseRequest {
  rowVersion: string;
}