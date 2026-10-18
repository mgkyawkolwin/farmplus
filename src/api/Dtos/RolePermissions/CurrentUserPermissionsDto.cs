namespace FarmPlus.Api.Dtos.RolePermissions;

public sealed record CurrentUserPermissionsDto(IReadOnlyList<string> PermissionKeys, bool IsExempt);