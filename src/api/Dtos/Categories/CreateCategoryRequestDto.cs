namespace FarmPlus.Api.Dtos.Categories;

public sealed record CreateCategoryRequestDto
{
    public string? Category { get; set; }
    public bool? IsActive { get; set; }
}
