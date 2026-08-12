namespace FarmPlus.Api.Dtos.Brands;

public sealed record GetBrandsRequestDto
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? Brand { get; init; }
}
