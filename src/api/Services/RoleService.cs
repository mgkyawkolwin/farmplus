using Microsoft.EntityFrameworkCore;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Roles;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface IRoleService
{
    Task<PaginatedResultDto<RoleDto>> GetRolesAsync(int page, int pageSize);
    Task<RoleDto?> GetRoleByIdAsync(Guid id);
    Task<RoleDto> CreateRoleAsync(CreateRoleRequestDto request);
    Task<RoleDto?> UpdateRoleAsync(Guid id, UpdateRoleRequestDto request);
    Task DeleteRoleAsync(Guid id);
}

public class RoleService : IRoleService
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<RoleService> _logger;

    public RoleService(AppDbContext dbContext, ICurrentUserService currentUserService, ILogger<RoleService> logger)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<RoleDto>> GetRolesAsync(int page, int pageSize)
    {
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);
        var query = GetTenantRoles().AsNoTracking().OrderBy(role => role.Role);
        var total = await query.CountAsync();
        var roles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(role => new RoleDto
            {
                Id = role.Id,
                Role = role.Role,
                RowVersion = role.RowVersion,
            })
            .ToListAsync();

        return new PaginatedResultDto<RoleDto>(roles, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<RoleDto?> GetRoleByIdAsync(Guid id)
    {
        var role = await GetTenantRoles().AsNoTracking().SingleOrDefaultAsync(item => item.Id == id);
        return role is null ? null : MapToDto(role);
    }

    public async Task<RoleDto> CreateRoleAsync(CreateRoleRequestDto request)
    {
        var roleName = NormalizeRole(request.Role);
        var tenantId = GetCurrentTenantId();
        if (await GetTenantRoles().AnyAsync(item => item.Role.ToLower() == roleName.ToLower()))
        {
            throw new CustomException("A role with this name already exists.");
        }

        var role = new RoleEntity
        {
            Role = roleName,
            MainTenantId = tenantId,
            CreatedById = GetCurrentUserId(),
            UpdatedById = GetCurrentUserId(),
        };

        _dbContext.Roles.Add(role);
        await _dbContext.SaveChangesAsync();
        return MapToDto(role);
    }

    public async Task<RoleDto?> UpdateRoleAsync(Guid id, UpdateRoleRequestDto request)
    {
        try
        {
            var roleName = NormalizeRole(request.Role);
            if (request.RowVersion == Guid.Empty)
            {
                throw new CustomException("RowVersion is required.");
            }

            var role = await GetTenantRoles().SingleOrDefaultAsync(item => item.Id == id)
                ?? throw new CustomException("Role not found.");
            if (await GetTenantRoles().AnyAsync(item => item.Id != id && item.Role.ToLower() == roleName.ToLower()))
            {
                throw new CustomException("A role with this name already exists.");
            }

            role.Role = roleName;
            _dbContext.Entry(role).Property(item => item.RowVersion).OriginalValue = request.RowVersion;
            role.RowVersion = Guid.NewGuid();
            role.UpdatedAtUtc = DateTime.UtcNow;
            role.UpdatedById = GetCurrentUserId();
            await _dbContext.SaveChangesAsync();
            return MapToDto(role);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException("This role was changed by another user. Refresh and try again.");
        }
    }

    public async Task DeleteRoleAsync(Guid id)
    {
        var role = await GetTenantRoles().SingleOrDefaultAsync(item => item.Id == id)
            ?? throw new CustomException("Role not found.");
        _dbContext.Roles.Remove(role);
        await _dbContext.SaveChangesAsync();
    }

    private IQueryable<RoleEntity> GetTenantRoles()
    {
        var query = _dbContext.Roles.AsQueryable();
        if (_currentUserService.IsAdmin)
        {
            return query;
        }

        if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId))
        {
            throw new CustomException("Tenant ID is missing for the current user.");
        }

        return query.Where(role => role.MainTenantId == tenantId);
    }

    private Guid? GetCurrentTenantId()
    {
        if (Guid.TryParse(_currentUserService.TenantId, out var tenantId))
        {
            return tenantId;
        }

        if (!_currentUserService.IsAdmin)
        {
            throw new CustomException("Tenant ID is missing for the current user.");
        }

        return null;
    }

    private Guid GetCurrentUserId()
    {
        return Guid.TryParse(_currentUserService.UserId, out var userId)
            ? userId
            : throw new CustomException("Invalid session user.");
    }

    private static string NormalizeRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            throw new CustomException("Role is required.");
        }

        var normalizedRole = role.Trim();
        if (normalizedRole.Length > 50)
        {
            throw new CustomException("Role cannot exceed 50 characters.");
        }

        return normalizedRole;
    }

    private static RoleDto MapToDto(RoleEntity role)
    {
        return new RoleDto
        {
            Id = role.Id,
            Role = role.Role,
            RowVersion = role.RowVersion,
        };
    }
}