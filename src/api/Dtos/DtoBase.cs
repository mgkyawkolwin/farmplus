namespace Cluspedia.FarmPlus.Api.Dtos;

public record DtoBase
{
    public Guid? RowVersion { get; init; }
}