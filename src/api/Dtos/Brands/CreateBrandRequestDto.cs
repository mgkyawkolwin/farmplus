namespace FarmPlus.Api.Dtos.Brands;

public sealed record CreateBrandRequestDto
{
    public string? Brand { get; set; }
    public bool? IsActive { get; set; }
}
