namespace FarmPlus.Api.Dtos.Brands;

public sealed record BrandDto
{
    public Guid Id { get; set; }
    public string Brand { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public Guid RowVersion { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public Guid CreatedById { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public Guid UpdatedById { get; set; }
}
