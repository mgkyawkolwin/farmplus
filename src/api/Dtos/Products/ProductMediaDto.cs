namespace FarmPlus.Api.Dtos.Products;

public sealed record ProductMediaDto
{
    public Guid? Id { get; set; }
    public string ObjectName { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string? Url { get; set; }
}
