using FarmPlus.Api.Dtos.Suppliers;
using FarmPlus.Api.Entities;

namespace FarmPlus.Api.Mappings;

public static class SupplierMappings
{
    public static SupplierDto MapToDto(this SupplierEntity entity)
    {
        return new SupplierDto
        {
            Id = entity.Id,
            SupplierName = entity.SupplierName,
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

    public static List<SupplierDto> MapToDtoList(this IEnumerable<SupplierEntity> entities)
    {
        return entities.Select(e => e.MapToDto()).ToList();
    }
}
