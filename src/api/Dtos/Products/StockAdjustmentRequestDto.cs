namespace FarmPlus.Api.Dtos.Products;

public sealed record StockAdjustmentRequestDto
{
    public int Quantity { get; set; }
    public string? Remark { get; set; }
}
