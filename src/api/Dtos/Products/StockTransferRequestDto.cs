namespace FarmPlus.Api.Dtos.Products;

public sealed record StockTransferRequestDto
{
    public Guid FromShopId { get; set; }
    public Guid ToShopId { get; set; }
    public int Quantity { get; set; }
    public string? Remark { get; set; }
}
