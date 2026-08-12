import { authenticatedFetchApi } from '@/lib/apiClient';
import { UnitItem, UnitListPayload } from '@/models/unit';

export interface IUnitService {
  getUnits(page?: number, pageSize?: number): Promise<UnitItem[]>;
  createUnit(unit: string, isActive?: boolean): Promise<UnitItem>;
  updateUnit(unit: UnitItem): Promise<UnitItem>;
  deleteUnit(id: string): Promise<void>;
}

export class UnitServiceClient implements IUnitService {
  async getUnits(page = 1, pageSize = 50): Promise<UnitItem[]> {
    const response = await authenticatedFetchApi(`/units?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    });

    const payload = response.data as UnitListPayload | undefined;
    return Array.isArray(payload?.items) ? payload.items.map(mapUnit) : [];
  }

  async createUnit(unit: string, isActive = true): Promise<UnitItem> {
    const response = await authenticatedFetchApi('/units', {
      method: 'POST',
      body: JSON.stringify({ unit, isActive }),
    });

    return mapUnit(response.data as UnitItem | undefined);
  }

  async updateUnit(unit: UnitItem): Promise<UnitItem> {
    const response = await authenticatedFetchApi(`/units/${unit.id}`, {
      method: 'PUT',
      body: JSON.stringify(unit),
    });

    return mapUnit(response.data as UnitItem | undefined);
  }

  async deleteUnit(id: string): Promise<void> {
    await authenticatedFetchApi(`/units/${id}`, {
      method: 'DELETE',
    });
  }
}

function mapUnit(item?: Partial<UnitItem> | null): UnitItem {
  return {
    id: item?.id ?? '',
    unit: item?.unit ?? '',
    isActive: item?.isActive ?? true,
    rowVersion: item?.rowVersion,
    createdAtUtc: item?.createdAtUtc,
    updatedAtUtc: item?.updatedAtUtc,
  };
}
