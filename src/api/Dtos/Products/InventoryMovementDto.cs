namespace FarmPlus.Api.Dtos.Products;

public sealed record InventoryMovementDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid ShopId { get; set; }
    public string ShopName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}