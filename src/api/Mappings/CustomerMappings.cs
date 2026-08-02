using Cluspedia.FarmPlus.Api.Dtos.Customers;
using Cluspedia.FarmPlus.Api.Entities;

namespace Cluspedia.FarmPlus.Api.Mappings;

public static class CustomerMappings
{
    public static CustomerDto MapToDto(this CustomerEntity entity)
    {
        return new CustomerDto
        {
            Id = entity.Id,
            Name = entity.Name,
            NationalIdNumber = entity.NationalIdNumber,
            Phone = entity.Phone,
            Email = entity.Email,
            Address = entity.Address,
            City = entity.City,
            Country = entity.Country,
            PostalCode = entity.PostalCode,
            IsActive = entity.IsActive,
            RowVersion = entity.RowVersion,
            CreatedAtUtc = entity.CreatedAtUtc,
            CreatedById = entity.CreatedById,
            UpdatedAtUtc = entity.UpdatedAtUtc,
            UpdatedById = entity.UpdatedById
        };
    }

    public static List<CustomerDto> MapToDtoList(this IEnumerable<CustomerEntity> entities)
    {
        return entities.Select(e => e.MapToDto()).ToList();
    }
}
