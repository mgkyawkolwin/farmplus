using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Dtos.Brands;

public sealed record UpdateBrandRequestDto : UpdateRequestBase<Guid>
{
    public string? Brand { get; set; }
    public bool? IsActive { get; set; }
}
