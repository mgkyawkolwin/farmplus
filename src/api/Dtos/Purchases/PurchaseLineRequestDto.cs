namespace FarmPlus.Api.Dtos.Purchases;

/// <summary>Specifies a product, quantity, and unit price for a purchase.</summary>
public sealed record PurchaseLineRequestDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}