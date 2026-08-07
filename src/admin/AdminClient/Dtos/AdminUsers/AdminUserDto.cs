namespace FarmPlus.AdminClient.Dtos.AdminUsers;

public sealed record AdminUserDto
{
    public Guid Id { get; init; }
    public string? UserName { get; init; }
    public string? Email { get; init; }
    public string? Role { get; init; }
    public bool IsActive { get; init; }
    public Guid? RowVersion { get; init; }
}
