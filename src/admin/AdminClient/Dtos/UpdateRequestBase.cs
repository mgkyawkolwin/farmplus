namespace FarmPlus.AdminClient.Dtos;

public record UpdateRequestBase<T>
{
    public Guid RowVersion { get; init; }
}
