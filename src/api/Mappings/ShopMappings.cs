using FarmPlus.Api.Dtos.Shops;
using FarmPlus.Api.Entities;

namespace FarmPlus.Api.Mappings;

public static class ShopMappings
{
    public static ShopDto MapToDto(this ShopEntity entity)
    {
        return new ShopDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Address = entity.Address,
            City = entity.City,
            StateDivision = entity.StateDivision,
            Country = entity.Country,
            PostalCode = entity.PostalCode,
            Phone = entity.Phone,
            Email = entity.Email,
            RowVersion = entity.RowVersion,
            CreatedAtUtc = entity.CreatedAtUtc,
            CreatedById = entity.CreatedById,
            UpdatedAtUtc = entity.UpdatedAtUtc,
            UpdatedById = entity.UpdatedById,
        };
    }
}
