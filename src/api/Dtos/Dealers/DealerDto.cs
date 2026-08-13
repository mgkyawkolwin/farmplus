namespace FarmPlus.Api.Dtos.Dealers;

public sealed record DealerDto
{
    public Guid Id { get; set; }
    public string DealerName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? StateDivision { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public Guid RowVersion { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public Guid CreatedById { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public Guid UpdatedById { get; set; }
}
