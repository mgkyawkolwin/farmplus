import { authenticatedFetchApi } from '@/lib/apiClient';

export interface CategoryItem {
  id: string;
  category: string;
  rowVersion?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

interface CategoryListPayload {
  items?: CategoryItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface ICategoryService {
  getCategories(page?: number, pageSize?: number): Promise<CategoryItem[]>;
  createCategory(category: string): Promise<CategoryItem>;
  updateCategory(id: string, category: string): Promise<CategoryItem>;
  deleteCategory(id: string): Promise<void>;
}

export class CategoryServiceClient implements ICategoryService {
  async getCategories(page = 1, pageSize = 50): Promise<CategoryItem[]> {
    const response = await authenticatedFetchApi(`/categories?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });

    const payload = response.data as CategoryListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items.map(mapCategory) : [];
  }

  async createCategory(category: string): Promise<CategoryItem> {
    const response = await authenticatedFetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify({ category }),
    });

    return mapCategory(response.data as CategoryItem | undefined);
  }

  async updateCategory(id: string, category: string): Promise<CategoryItem> {
    const response = await authenticatedFetchApi(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ category }),
    });

    return mapCategory(response.data as CategoryItem | undefined);
  }

  async deleteCategory(id: string): Promise<void> {
    await authenticatedFetchApi(`/categories/${id}`, {
      method: 'DELETE',
    });
  }
}

function mapCategory(item?: Partial<CategoryItem> | null): CategoryItem {
  return {
    id: item?.id ?? '',
    category: item?.category ?? '',
    rowVersion: item?.rowVersion,
    createdAtUtc: item?.createdAtUtc,
    updatedAtUtc: item?.updatedAtUtc,
  };
}
