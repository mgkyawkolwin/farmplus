import { authenticatedFetchApi } from '@/lib/apiClient';
import { CategoryItem, CategoryListPayload } from '@/models/category';

export interface ICategoryService {
  getCategories(page?: number, pageSize?: number): Promise<CategoryItem[]>;
  createCategory(category: string, isActive?: boolean): Promise<CategoryItem>;
  updateCategory(category: CategoryItem): Promise<CategoryItem>;
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

  async createCategory(category: string, isActive = true): Promise<CategoryItem> {
    const response = await authenticatedFetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify({ category, isActive }),
    });

    return mapCategory(response.data as CategoryItem | undefined);
  }

  async updateCategory(category: CategoryItem): Promise<CategoryItem> {
    const response = await authenticatedFetchApi(`/categories/${category.id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
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
    isActive: item?.isActive ?? true,
    rowVersion: item?.rowVersion,
    createdAtUtc: item?.createdAtUtc,
    updatedAtUtc: item?.updatedAtUtc,
  };
}
