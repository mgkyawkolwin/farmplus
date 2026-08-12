using FarmPlus.Api.Dtos.Brands;
using FarmPlus.Api.Entities;

namespace FarmPlus.Api.Mappings;

public static class BrandMappings
{
    public static BrandDto MapToDto(this BrandEntity entity)
    {
        return new BrandDto
        {
            Id = entity.Id,
            Brand = entity.Brand,
            IsActive = entity.IsActive,
            RowVersion = entity.RowVersion,
            CreatedAtUtc = entity.CreatedAtUtc,
            CreatedById = entity.CreatedById,
            UpdatedAtUtc = entity.UpdatedAtUtc,
            UpdatedById = entity.UpdatedById
        };
    }

    public static List<BrandDto> MapToDtoList(this IEnumerable<BrandEntity> entities)
    {
        return entities.Select(e => e.MapToDto()).ToList();
    }
}
