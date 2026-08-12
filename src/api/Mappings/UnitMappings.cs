using FarmPlus.Api.Dtos.Units;
using FarmPlus.Api.Entities;

namespace FarmPlus.Api.Mappings;

public static class UnitMappings
{
    public static UnitDto MapToDto(this UnitEntity entity)
    {
        return new UnitDto
        {
            Id = entity.Id,
            Unit = entity.Unit,
            IsActive = entity.IsActive,
            RowVersion = entity.RowVersion,
            CreatedAtUtc = entity.CreatedAtUtc,
            CreatedById = entity.CreatedById,
            UpdatedAtUtc = entity.UpdatedAtUtc,
            UpdatedById = entity.UpdatedById
        };
    }

    public static List<UnitDto> MapToDtoList(this IEnumerable<UnitEntity> entities)
    {
        return entities.Select(e => e.MapToDto()).ToList();
    }
}
