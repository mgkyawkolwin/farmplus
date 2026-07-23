namespace Cluspedia.FarmPlus.Api.Dtos.Categories;

public sealed record CreateCategoryRequestDto
{
    public string Category { get; set; } = string.Empty;
}
