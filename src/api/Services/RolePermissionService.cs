using Microsoft.EntityFrameworkCore;
using FarmPlus.Api.Constants;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos.RolePermissions;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;

namespace FarmPlus.Api.Services;

public interface IRolePermissionService
{
    Task<IReadOnlyList<PermissionPageDto>> GetCatalogAsync();
    Task<IReadOnlyList<string>> GetRolePermissionKeysAsync(Guid roleId);
    Task<CurrentUserPermissionsDto> GetCurrentPermissionsAsync();
    Task UpdateRolePermissionsAsync(Guid roleId, IReadOnlyCollection<string> permissionKeys);
}

public class RolePermissionService : IRolePermissionService
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public RolePermissionService(AppDbContext dbContext, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public Task<IReadOnlyList<PermissionPageDto>> GetCatalogAsync() =>
        Task.FromResult(PermissionCatalog.Pages);

    public async Task<IReadOnlyList<string>> GetRolePermissionKeysAsync(Guid roleId)
    {
        await EnsureRoleExistsAsync(roleId);
        var keys = await _dbContext.RolePermissions.AsNoTracking()
            .Where(permission => permission.RoleId == roleId)
            .Select(permission => permission.PermissionKey)
            .ToListAsync();
        return keys.Contains("*") ? PermissionCatalog.Pages.Select(page => page.Key).ToList() : keys;
    }

    public async Task<CurrentUserPermissionsDto> GetCurrentPermissionsAsync()
    {
        if (_currentUserService.IsAdmin || IsMainTenantUser())
        {
            return new CurrentUserPermissionsDto(PermissionCatalog.Pages.Select(page => page.Key).ToList(), true);
        }

        if (!Guid.TryParse(_currentUserService.UserId, out var userId))
        {
            return new CurrentUserPermissionsDto([], false);
        }

        var roleId = await _dbContext.Users.AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.RoleId)
            .SingleOrDefaultAsync();
        if (!roleId.HasValue)
        {
            return new CurrentUserPermissionsDto([], false);
        }

        var keys = await _dbContext.RolePermissions.AsNoTracking()
            .Where(permission => permission.RoleId == roleId.Value)
            .Select(permission => permission.PermissionKey)
            .ToListAsync();
        var effectiveKeys = keys.Contains("*") ? PermissionCatalog.Pages.Select(page => page.Key).ToList() : keys;
        return new CurrentUserPermissionsDto(effectiveKeys, false);
    }

    public async Task UpdateRolePermissionsAsync(Guid roleId, IReadOnlyCollection<string> permissionKeys)
    {
        await EnsureRoleExistsAsync(roleId);
        var keys = permissionKeys.Distinct(StringComparer.Ordinal).ToArray();
        var invalidKeys = keys.Where(key => !PermissionCatalog.Contains(key)).ToArray();
        if (invalidKeys.Length > 0)
        {
            throw new CustomException($"Unknown page permission: {invalidKeys[0]}");
        }

        var existing = await _dbContext.RolePermissions
            .Where(permission => permission.RoleId == roleId)
            .ToListAsync();
        _dbContext.RolePermissions.RemoveRange(existing);

        if (Guid.TryParse(_currentUserService.UserId, out var userId))
        {
            var tenantId = Guid.TryParse(_currentUserService.TenantId, out var parsedTenantId)
                ? parsedTenantId
                : (Guid?)null;
            _dbContext.RolePermissions.AddRange(keys.Select(key => new RolePermissionEntity
            {
                RoleId = roleId,
                PermissionKey = key,
                MainTenantId = tenantId,
                CreatedById = userId,
                UpdatedById = userId,
            }));
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task EnsureRoleExistsAsync(Guid roleId)
    {
        var roles = _dbContext.Roles.AsNoTracking();
        if (!_currentUserService.IsAdmin)
        {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId))
            {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            roles = roles.Where(role => role.MainTenantId == tenantId);
        }

        if (!await roles.AnyAsync(role => role.Id == roleId))
        {
            throw new CustomException("Role not found.");
        }
    }

    private bool IsMainTenantUser() =>
        Guid.TryParse(_currentUserService.UserId, out var userId) &&
        Guid.TryParse(_currentUserService.TenantId, out var tenantId) &&
        userId == tenantId;
}