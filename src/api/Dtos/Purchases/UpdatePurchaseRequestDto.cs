using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Dtos.Purchases;

/// <summary>Payload for updating a purchase and replacing its product lines.</summary>
public sealed record UpdatePurchaseRequestDto : UpdateRequestBase<Guid>
{
    public Guid SupplierId { get; set; }
    public DateTimeOffset PurchaseDate { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public List<PurchaseLineRequestDto> Items { get; set; } = [];
}