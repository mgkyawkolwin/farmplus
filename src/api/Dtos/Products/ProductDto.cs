namespace FarmPlus.Api.Dtos.Products;

public sealed record ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal PurchasePrice { get; set; } = 0.00m;
    public decimal SalePrice { get; set; } = 0.00m;
    public int CurrentStock { get; set; } = 0;
    public int MinimumStock { get; set; } = 0;
    public string? CoverImageUrl { get; set; }
    public List<ProductMediaDto> Medias { get; set; } = new();
    public Guid RowVersion { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public Guid CreatedById { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public Guid UpdatedById { get; set; }
}
