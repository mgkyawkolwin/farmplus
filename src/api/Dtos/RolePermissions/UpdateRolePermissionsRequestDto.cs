namespace FarmPlus.Api.Dtos.RolePermissions;

public sealed record UpdateRolePermissionsRequestDto
{
    public List<string> PermissionKeys { get; set; } = [];
}