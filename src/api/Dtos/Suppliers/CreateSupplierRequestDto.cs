namespace FarmPlus.Api.Dtos.Suppliers;

public sealed record CreateSupplierRequestDto
{
    public string? SupplierName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? StateDivision { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? LogoUrl { get; set; }
    public bool? IsRequired { get; set; }
}
