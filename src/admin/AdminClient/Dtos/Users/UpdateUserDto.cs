using FarmPlus.AdminClient.Dtos;

namespace FarmPlus.AdminClient.Dtos.Users;

public sealed record UpdateUserDto : UpdateRequestBase<Guid>
{
    public string? UserName { get; init; }
    public string? DisplayName { get; init; }
    public string? Email { get; init; }
    public string? Password { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
}
