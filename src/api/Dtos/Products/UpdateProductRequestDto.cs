using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Dtos.Products;

public sealed record UpdateProductRequestDto : UpdateRequestBase<Guid>
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public string? Category { get; set; }
    public string? Unit { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
    public int? CurrentStock { get; set; }
    public int? MinimumStock { get; set; }
}
