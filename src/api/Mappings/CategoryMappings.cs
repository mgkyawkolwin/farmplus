using FarmPlus.Api.Dtos.Categories;
using FarmPlus.Api.Entities;

namespace FarmPlus.Api.Mappings;

public static class CategoryMappings
{
    public static CategoryDto MapToDto(this CategoryEntity entity)
    {
        return new CategoryDto
        {
            Id = entity.Id,
            Category = entity.Category,
            RowVersion = entity.RowVersion,
            CreatedAtUtc = entity.CreatedAtUtc,
            CreatedById = entity.CreatedById,
            UpdatedAtUtc = entity.UpdatedAtUtc,
            UpdatedById = entity.UpdatedById
        };
    }

    public static List<CategoryDto> MapToDtoList(this IEnumerable<CategoryEntity> entities)
    {
        return entities.Select(e => e.MapToDto()).ToList();
    }
}
