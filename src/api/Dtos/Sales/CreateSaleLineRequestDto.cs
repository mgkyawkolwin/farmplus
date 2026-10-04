namespace FarmPlus.Api.Dtos.Sales;

/// <summary>Specifies a product and quantity to sell.</summary>
public sealed record CreateSaleLineRequestDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}