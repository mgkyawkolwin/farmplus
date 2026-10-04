namespace FarmPlus.Api.Dtos.Sales;

/// <summary>Payload for recording a sale.</summary>
public sealed record CreateSaleRequestDto
{
    public Guid? CustomerId { get; set; }
    public List<CreateSaleLineRequestDto> Items { get; set; } = new List<CreateSaleLineRequestDto>();
}