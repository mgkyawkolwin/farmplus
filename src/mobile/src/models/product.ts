export interface ProductMediaItem {
  id?: string;
  objectName: string;
  mediaType: string;
  size: number;
  url?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  unit?: string;
  purchasePrice?: number;
  salePrice?: number;
  currentStock?: number;
  minimumStock?: number;
  coverImageUrl?: string;
  medias?: ProductMediaItem[];
  rowVersion?: string;
  createdAtUtc?: string;
  createdById?: string;
  updatedAtUtc?: string;
  updatedById?: string;
}

export interface ProductListPayload {
  items?: ProductItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  unit?: string;
  purchasePrice?: number;
  salePrice?: number;
  currentStock?: number;
  minimumStock?: number;
  coverImageUrl?: string;
  medias?: ProductMediaItem[];
}

export interface UpdateProductRequest {
  id: string;
  name?: string;
  description?: string;
  brand?: string;
  category?: string;
  unit?: string;
  purchasePrice?: number;
  salePrice?: number;
  currentStock?: number;
  minimumStock?: number;
  coverImageUrl?: string;
  medias?: ProductMediaItem[];
  rowVersion?: string;
}
