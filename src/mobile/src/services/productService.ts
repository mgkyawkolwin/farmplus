import { authenticatedFetchApi } from '@/lib/apiClient';
import {
  CreateProductRequest,
  ProductItem,
  ProductListPayload,
  UpdateProductRequest,
} from '@/models/product';

export interface IProductService {
  getProducts(page?: number, pageSize?: number): Promise<ProductItem[]>;
  getProductById(id: string): Promise<ProductItem>;
  createProduct(request: CreateProductRequest): Promise<ProductItem>;
  updateProduct(request: UpdateProductRequest): Promise<ProductItem>;
  uploadProductCoverImage(id: string, file: { uri: string; name: string; type: string }): Promise<ProductItem>;
  uploadProductMedia(id: string, file: { uri: string; name: string; type: string }): Promise<ProductItem>;
  deleteProductMedia(id: string, mediaId: string): Promise<ProductItem>;
  deleteProduct(id: string): Promise<void>;
}

export class ProductServiceClient implements IProductService {
  async getProducts(page = 1, pageSize = 20): Promise<ProductItem[]> {
    const response = await authenticatedFetchApi(`/products?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });

    const payload = response.data as ProductListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items : [];
  }

  async getProductById(id: string): Promise<ProductItem> {
    const response = await authenticatedFetchApi(`/products/${id}`, {
      method: 'GET',
    });

    return response.data as ProductItem;
  }

  async createProduct(request: CreateProductRequest): Promise<ProductItem> {
    const response = await authenticatedFetchApi('/products', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response.data as ProductItem;
  }

  async updateProduct(request: UpdateProductRequest): Promise<ProductItem> {
    const response = await authenticatedFetchApi(`/products/${request.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    return response.data as ProductItem;
  }

  async uploadProductCoverImage(id: string, file: { uri: string; name: string; type: string }): Promise<ProductItem> {
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);

    const response = await authenticatedFetchApi(`/products/${id}/cover-image`, {
      method: 'PATCH',
      body: formData,
    });

    return response.data as ProductItem;
  }

  async uploadProductMedia(id: string, file: { uri: string; name: string; type: string }): Promise<ProductItem> {
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);

    const response = await authenticatedFetchApi(`/products/${id}/medias`, {
      method: 'PATCH',
      body: formData,
    });

    return response.data as ProductItem;
  }

  async deleteProductMedia(id: string, mediaId: string): Promise<ProductItem> {
    const response = await authenticatedFetchApi(`/products/${id}/medias/${mediaId}`, {
      method: 'DELETE',
    });

    return response.data as ProductItem;
  }

  async deleteProduct(id: string): Promise<void> {
    await authenticatedFetchApi(`/products/${id}`, {
      method: 'DELETE',
    });
  }
}
