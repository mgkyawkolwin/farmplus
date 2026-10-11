namespace FarmPlus.Api.Dtos.Products;

public sealed record StockMovementDto
{
    public Guid Id { get; set; }
    public int Quantity { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
