using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Dtos.Shops;

public sealed record CreateShopRequestDto
{
    public string? Name { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? StateDivision { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
}

public sealed record UpdateShopRequestDto : UpdateRequestBase<Guid>
{
    public string? Name { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? StateDivision { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
}
