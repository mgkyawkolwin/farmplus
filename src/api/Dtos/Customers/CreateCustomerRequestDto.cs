namespace Cluspedia.FarmPlus.Api.Dtos.Customers;

public sealed record CreateCustomerRequestDto
{
    public string? Name { get; set; }
    public string? NationalIdNumber { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public bool? IsActive { get; set; }
}
