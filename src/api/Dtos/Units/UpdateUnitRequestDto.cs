using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Dtos.Units;

public sealed record UpdateUnitRequestDto : UpdateRequestBase<Guid>
{
    public string? Unit { get; set; }
    public bool? IsActive { get; set; }
}
