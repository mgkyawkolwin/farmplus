namespace FarmPlus.Api.Dtos.Purchases;

/// <summary>Represents a product line included in a purchase.</summary>
public sealed record PurchaseItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}