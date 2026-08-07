using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Dtos.Categories;

public sealed record UpdateCategoryRequestDto : UpdateRequestBase<Guid>
{
    public string? Category { get; set; }
    public bool? IsActive { get; set; }
}
