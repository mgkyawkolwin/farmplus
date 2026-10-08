namespace FarmPlus.Api.Dtos.Sales;

/// <summary>Represents a product line within a recorded sale.</summary>
public sealed record SaleItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImageUrl { get; set; }
    public string? Unit { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal LineTotal { get; set; }
}
