namespace FarmPlus.Api.Dtos.AdminUsers;

public sealed record CreateAdminUserDto
{
    public string? UserName { get; init; }
    public string? Email { get; init; }
    public string? Password { get; init; }
    public string? Role { get; init; }
    public bool? IsActive { get; init; }
}
