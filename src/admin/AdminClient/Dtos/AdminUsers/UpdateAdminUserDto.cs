using FarmPlus.AdminClient.Dtos;

namespace FarmPlus.AdminClient.Dtos.AdminUsers;

public sealed record UpdateAdminUserDto : UpdateRequestBase<Guid>
{
    public string? UserName { get; init; }
    public string? Email { get; init; }
    public string? Role { get; init; }
    public bool IsActive { get; init; }
}
