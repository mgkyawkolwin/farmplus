namespace FarmPlus.Api.Dtos.Suppliers;

public sealed record SupplierDto
{
    public Guid Id { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? StateDivision { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsRequired { get; set; }
    public Guid RowVersion { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public Guid CreatedById { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public Guid UpdatedById { get; set; }
}
