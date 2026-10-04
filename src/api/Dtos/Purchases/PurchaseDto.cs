using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Dtos.Purchases;

/// <summary>Represents a purchase and its product lines.</summary>
public sealed record PurchaseDto : DtoBase
{
    public Guid Id { get; set; }
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public DateTimeOffset PurchaseDate { get; set; }
    public int TotalProducts { get; set; }
    public decimal SubTotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal NetTotal { get; set; }
    public List<PurchaseItemDto> Items { get; set; } = [];
}