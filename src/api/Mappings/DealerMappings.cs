using FarmPlus.Api.Dtos.Dealers;
using FarmPlus.Api.Entities;

namespace FarmPlus.Api.Mappings;

public static class DealerMappings
{
    public static DealerDto MapToDto(this DealerEntity entity)
    {
        return new DealerDto
        {
            Id = entity.Id,
            DealerName = entity.DealerName,
            Email = entity.Email,
            PhoneNumber = entity.PhoneNumber,
            Address = entity.Address,
            StateDivision = entity.StateDivision,
            City = entity.City,
            Country = entity.Country,
            LogoUrl = entity.LogoUrl,
            IsRequired = entity.IsRequired,
            RowVersion = entity.RowVersion,
            CreatedAtUtc = entity.CreatedAtUtc,
            CreatedById = entity.CreatedById,
            UpdatedAtUtc = entity.UpdatedAtUtc,
            UpdatedById = entity.UpdatedById
        };
    }

    public static List<DealerDto> MapToDtoList(this IEnumerable<DealerEntity> entities)
    {
        return entities.Select(e => e.MapToDto()).ToList();
    }
}
