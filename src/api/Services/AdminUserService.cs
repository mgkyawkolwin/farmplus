using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.AdminUsers;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public class AdminUserService : IAdminUserService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<AdminUserEntity> _passwordHasher;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<AdminUserService> _logger;

    public AdminUserService(
        AppDbContext dbContext,
        IPasswordHasher<AdminUserEntity> passwordHasher,
        IStringLocalizer<LocalizedStrings> localizer,
        ILogger<AdminUserService> logger)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _localizer = localizer;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<AdminUserDto>> GetAdminUsersAsync(int page, int pageSize)
    {
        _logger.LogDebug("CALLED: GetAdminUsersAsync(page={Page}, pageSize={PageSize})", page, pageSize);
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Set<AdminUserEntity>().AsNoTracking().OrderByDescending(u => u.CreatedAtUtc);
        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(user => new AdminUserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Role = user.Role,
                IsActive = user.IsActive,
                RowVersion = user.RowVersion
            })
            .ToListAsync();

        return new PaginatedResultDto<AdminUserDto>(items, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<AdminUserDto?> GetAdminUserByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetAdminUserByIdAsync(id={Id})", id);
        var user = await _dbContext.Set<AdminUserEntity>().AsNoTracking().SingleOrDefaultAsync(u => u.Id == id);
        return user == null ? null : MapToDto(user);
    }

    public async Task<AdminUserDto> CreateAdminUserAsync(CreateAdminUserDto request, Guid currentUserId)
    {
        _logger.LogDebug("CALLED: CreateAdminUserAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "UserName", request.UserName);
        ValidationHelper.ValidateEmail(_localizer, "Email", request.Email);
        ValidationHelper.ValidateRequiredString(_localizer, "Password", request.Password);
        ValidationHelper.ValidateRequiredString(_localizer, "Role", request.Role);

        var normalizedUserName = request.UserName!.Trim();
        var normalizedEmail = request.Email!.Trim().ToLowerInvariant();

        if (await _dbContext.Set<AdminUserEntity>().AnyAsync(u => u.UserName == normalizedUserName || u.Email == normalizedEmail))
        {
            throw new CustomException("An admin user with this username or email already exists.");
        }

        var adminUser = new AdminUserEntity
        {
            UserName = normalizedUserName,
            Email = normalizedEmail,
            Role = request.Role!.Trim(),
            IsActive = request.IsActive ?? true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };
        adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, request.Password!);

        _dbContext.Set<AdminUserEntity>().Add(adminUser);
        await _dbContext.SaveChangesAsync();

        return MapToDto(adminUser);
    }

    public async Task<AdminUserDto?> UpdateAdminUserAsync(Guid id, UpdateAdminUserDto request, Guid currentUserId)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateAdminUserAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredString(_localizer, "UserName", request.UserName);
            ValidationHelper.ValidateEmail(_localizer, "Email", request.Email);
            ValidationHelper.ValidateRequiredString(_localizer, "Role", request.Role);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);

            var user = await _dbContext.Set<AdminUserEntity>().SingleOrDefaultAsync(u => u.Id == id)
                ?? throw new CustomException("Admin user not found.");

            var normalizedEmail = request.Email!.Trim().ToLowerInvariant();
            var emailExists = await _dbContext.Set<AdminUserEntity>().AnyAsync(u => u.Id != id && u.Email == normalizedEmail);
            if (emailExists)
            {
                throw new CustomException(_localizer[$"Template.AlreadyExists", "Email"]);
            }

            user.UserName = request.UserName!.Trim();
            user.Email = normalizedEmail;
            user.Role = request.Role!.Trim();
            if (request.IsActive.HasValue)
            {
                user.IsActive = request.IsActive.Value;
            }
            _dbContext.Entry(user).Property(u => u.RowVersion).OriginalValue = request.RowVersion;
            user.UpdatedAtUtc = DateTime.UtcNow;
            user.UpdatedById = currentUserId;

            await _dbContext.SaveChangesAsync();
            return MapToDto(user);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task<bool> DeleteAdminUserAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteAdminUserAsync(id={Id})", id);
        var user = await _dbContext.Set<AdminUserEntity>().SingleOrDefaultAsync(u => u.Id == id)
            ?? throw new CustomException("Admin user not found.");

        _dbContext.Set<AdminUserEntity>().Remove(user);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static AdminUserDto MapToDto(AdminUserEntity user)
    {
        return new AdminUserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            RowVersion = user.RowVersion
        };
    }
}
