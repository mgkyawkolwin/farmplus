using Cluspedia.FarmPlus.Api.Dtos.Products;
using Cluspedia.FarmPlus.Api.Entities;

namespace Cluspedia.FarmPlus.Api.Mappings;

public static class ProductMappings
{
    public static ProductDto MapToDto(this ProductEntity entity)
    {
        return new ProductDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Brand = entity.Brand,
            Category = entity.Category,
            Unit = entity.Unit,
            PurchasePrice = entity.PurchasePrice,
            SalePrice = entity.SalePrice,
            CurrentStock = entity.CurrentStock,
            MinimumStock = entity.MinimumStock,
            RowVersion = entity.RowVersion,
            CreatedAtUtc = entity.CreatedAtUtc,
            CreatedById = entity.CreatedById,
            UpdatedAtUtc = entity.UpdatedAtUtc,
            UpdatedById = entity.UpdatedById
        };
    }

    public static List<ProductDto> MapToDtoList(this IEnumerable<ProductEntity> entities)
    {
        return entities.Select(e => e.MapToDto()).ToList();
    }
}
