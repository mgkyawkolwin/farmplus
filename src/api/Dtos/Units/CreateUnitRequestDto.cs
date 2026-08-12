namespace FarmPlus.Api.Dtos.Units;

public sealed record CreateUnitRequestDto
{
    public string? Unit { get; set; }
    public bool? IsActive { get; set; }
}
