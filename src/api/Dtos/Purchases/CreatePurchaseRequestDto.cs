namespace FarmPlus.Api.Dtos.Purchases;

/// <summary>Payload for recording a purchase from a supplier.</summary>
public sealed record CreatePurchaseRequestDto
{
    public Guid SupplierId { get; set; }
    public DateTimeOffset PurchaseDate { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public List<PurchaseLineRequestDto> Items { get; set; } = [];
}