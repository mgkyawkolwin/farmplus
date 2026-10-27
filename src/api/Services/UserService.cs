using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Users;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface IUserService
{
    Task<PaginatedResultDto<UserDto>> GetUsersAsync(int page, int pageSize);
    Task<UserDto?> GetUserByIdAsync(Guid id);
    Task<UserDto> CreateUserAsync(CreateUserRequestDto request, Guid currentUserId);
    Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserRequestDto request, Guid currentUserId);
    Task<bool> DeleteUserAsync(Guid id);
    Task<bool> ChangePasswordAsync(Guid id, ChangePasswordRequestDto request);
    Task<bool> ResetUserPasswordAsync(Guid id, ResetUserPasswordRequestDto request, Guid currentUserId);
    Task<UserDto?> UploadProfilePictureAsync(Guid id, IFormFile file, Guid currentUserId);
    Task<UserDto?> UpdateProfileAsync(Guid id, UpdateProfileRequestDto request, Guid currentUserId);
}

public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<UserEntity> _passwordHasher;
    private readonly IStorageService _storageService;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<UserService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public UserService(AppDbContext dbContext, IPasswordHasher<UserEntity> passwordHasher, IStorageService storageService, IStringLocalizer<LocalizedStrings> localizer, ILogger<UserService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _storageService = storageService;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<UserDto>> GetUsersAsync(int page, int pageSize)
    {
        _logger.LogDebug("CALLED: GetUsersAsync(page={Page}, pageSize={PageSize})", page, pageSize);
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var usersQuery = GetTenantUsers();
        if (_currentUserService.IsAdmin)
        {
            usersQuery = usersQuery.Where(user => !user.MainTenantId.HasValue || user.Id != user.MainTenantId.Value);
        }
        else if (Guid.TryParse(_currentUserService.TenantId, out var tenantId))
        {
            usersQuery = usersQuery.Where(user => user.Id != tenantId);
        }

        var query = usersQuery.AsNoTracking().OrderByDescending(u => u.CreatedAtUtc);
        var total = await query.CountAsync();

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(user => new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                DisplayName = user.DisplayName,
                Email = user.Email,
                Address = user.Address,
                City = user.City,
                Phone = user.Phone,
                NationalId = user.NationalId,
                PassportNumber = user.PassportNumber,
                IsActive = user.IsActive,
                ProfilePictureUrl = user.ProfilePictureUrl,
                RoleId = user.RoleId,
                RoleName = _dbContext.Roles
                    .Where(role => role.Id == user.RoleId)
                    .Select(role => role.Role)
                    .FirstOrDefault(),
                RowVersion = user.RowVersion
            })
            .ToListAsync();

        var mappedUsers = users.Select(user => new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            DisplayName = user.DisplayName,
            Email = user.Email,
            Address = user.Address,
            City = user.City,
            Phone = user.Phone,
            NationalId = user.NationalId,
            PassportNumber = user.PassportNumber,
            IsActive = user.IsActive,
            ProfilePictureUrl = ResolvePictureUrl(user.ProfilePictureUrl),
            RoleId = user.RoleId,
            RoleName = user.RoleName,
            RowVersion = user.RowVersion
        }).ToList();

        return new PaginatedResultDto<UserDto>(mappedUsers, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetUserByIdAsync(id={Id})", id);
        var user = await GetTenantUsers().AsNoTracking().SingleOrDefaultAsync(u => u.Id == id);
        return user == null ? null : MapToDto(user);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequestDto request, Guid currentUserId)
    {
        _logger.LogDebug("CALLED: CreateUserAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "UserName", request.UserName);
        ValidationHelper.ValidateEmail(_localizer, "Email", request.Email);
        ValidationHelper.ValidateRequiredString(_localizer, "Password", request.Password);
        ValidateMaxLength("Phone", request.Phone, 20);
        ValidateMaxLength("National ID", request.NationalId, 30);
        ValidateMaxLength("Passport number", request.PassportNumber, 30);

        var normalizedUserName = request.UserName.Trim();
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var tenantId = GetCurrentTenantId();
        await EnsureRoleAssignmentAsync(request.RoleId, tenantId);

        if (await _dbContext.Users.AnyAsync(u => u.UserName == normalizedUserName || u.Email == normalizedEmail))
        {
            throw new CustomException("A user with this username or email already exists.");
        }

        var user = new UserEntity
        {
            UserName = normalizedUserName,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? normalizedUserName : request.DisplayName.Trim(),
            Email = normalizedEmail,
            Address = request.Address,
            City = request.City,
            Phone = NormalizeOptional(request.Phone),
            NationalId = NormalizeOptional(request.NationalId),
            PassportNumber = NormalizeOptional(request.PassportNumber),
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId,
            MainTenantId = tenantId,
            RoleId = request.RoleId,
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password!);
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        _logger.LogTrace("Created user {UserName} with id {UserId}", user.UserName, user.Id);
        return MapToDto(user);
    }

    public async Task<UserDto?> UpdateUserAsync(Guid id, UpdateUserRequestDto request, Guid currentUserId)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateUserAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateEmail(_localizer, "Email", request.Email);
            ValidationHelper.ValidateRequiredString(_localizer, "DisplayName", request.DisplayName);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);

            var user = await GetTenantUsers().SingleOrDefaultAsync(u => u.Id == id) ?? throw new CustomException("User not found.");
            if (request.RoleId.HasValue)
            {
                await EnsureRoleAssignmentAsync(request.RoleId, user.MainTenantId);
                user.RoleId = request.RoleId;
            }
            user.DisplayName = request.DisplayName ?? "";

            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                var normalizedEmail = request.Email.Trim().ToLowerInvariant();
                var emailExists = await _dbContext.Users.AnyAsync(u => u.Id != id && u.Email == normalizedEmail);
                if (emailExists)
                {
                    throw new CustomException(_localizer[$"Template.AlreadyExists", "Email"]);
                }

                user.Email = normalizedEmail;
            }

            _dbContext.Entry(user).Property(u => u.RowVersion).OriginalValue = request.RowVersion;
            user.Address = request.Address;
            user.City = request.City;
            ValidateMaxLength("Phone", request.Phone, 20);
            ValidateMaxLength("National ID", request.NationalId, 30);
            ValidateMaxLength("Passport number", request.PassportNumber, 30);
            user.Phone = NormalizeOptional(request.Phone);
            user.NationalId = NormalizeOptional(request.NationalId);
            user.PassportNumber = NormalizeOptional(request.PassportNumber);
            if (request.IsActive.HasValue)
            {
                user.IsActive = request.IsActive.Value;
            }
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

    public async Task<UserDto?> UpdateProfileAsync(Guid id, UpdateProfileRequestDto request, Guid currentUserId)
    {
        _logger.LogDebug("CALLED: UpdateProfileAsync(id={Id})", id);

        ValidationHelper.ValidateEmail(_localizer, "Email", request.Email);
        ValidateMaxLength("Email", request.Email, 50);
        ValidateMaxLength("Phone", request.Phone, 20);
        ValidateMaxLength("National ID", request.NationalId, 30);
        ValidateMaxLength("Passport number", request.PassportNumber, 30);
        ValidateMaxLength("Address", request.Address, 500);
        ValidateMaxLength("City", request.City, 100);

        var user = await GetTenantUsers().SingleOrDefaultAsync(u => u.Id == id)
            ?? throw new CustomException(_localizer[$"Template.NotFound", "User"]);

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await _dbContext.Users.AnyAsync(u => u.Id != id && u.Email == normalizedEmail))
        {
            throw new CustomException(_localizer[$"Template.AlreadyExists", "Email"]);
        }

        user.Email = normalizedEmail;
        user.Phone = NormalizeOptional(request.Phone);
        user.NationalId = NormalizeOptional(request.NationalId);
        user.PassportNumber = NormalizeOptional(request.PassportNumber);
        user.Address = NormalizeOptional(request.Address);
        user.City = NormalizeOptional(request.City);
        user.UpdatedAtUtc = DateTime.UtcNow;
        user.UpdatedById = currentUserId;

        await _dbContext.SaveChangesAsync();

        return MapToDto(user);
    }

    private static void ValidateMaxLength(string fieldName, string? value, int maxLength)
    {
        if (value != null && value.Trim().Length > maxLength)
        {
            throw new CustomException($"{fieldName} must not exceed {maxLength} characters.");
        }
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteUserAsync(id={Id})", id);
        var user = await GetTenantUsers().SingleOrDefaultAsync(u => u.Id == id) ?? throw new CustomException("User not found.");
        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ChangePasswordAsync(Guid id, ChangePasswordRequestDto request)
    {
        _logger.LogDebug("CALLED: ChangePasswordAsync(id={Id})", id);
        ValidationHelper.ValidateRequiredString( _localizer, "CurrentPassword", request.CurrentPassword);
        ValidationHelper.ValidateRequiredString(_localizer, "NewPassword", request.NewPassword);

        var user = await GetTenantUsers().SingleOrDefaultAsync(u => u.Id == id);
        if (user == null)
        {
            throw new CustomException(_localizer[$"Template.NotFound", "User"]);
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            throw new CustomException(_localizer[$"Template.Incorrect", "Current password"]);
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResetUserPasswordAsync(Guid id, ResetUserPasswordRequestDto request, Guid currentUserId)
    {
        ValidationHelper.ValidateRequiredString(_localizer, "NewPassword", request.NewPassword);

        var user = await GetTenantUsers().SingleOrDefaultAsync(u => u.Id == id)
            ?? throw new CustomException(_localizer[$"Template.NotFound", "User"]);

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAtUtc = DateTime.UtcNow;
        user.UpdatedById = currentUserId;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<UserDto?> UploadProfilePictureAsync(Guid id, IFormFile file, Guid currentUserId)
    {
        _logger.LogDebug("CALLED: UploadProfilePictureAsync(id={Id}, file={FileName})", id, file?.FileName);
        if (file == null || file.Length == 0)
        {
            throw new CustomException(_localizer[$"Template.Required", "picture"]);
        }

        var user = await GetTenantUsers().SingleOrDefaultAsync(u => u.Id == id) ?? throw new CustomException(_localizer[$"Template.NotFound", "User"]);

        if (!string.IsNullOrWhiteSpace(user.ProfilePictureUrl) && !user.ProfilePictureUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                await _storageService.DeleteObjectAsync(user.ProfilePictureUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete previous profile picture for user {UserId}", user.Id);
            }
        }

        var objectName = await _storageService.UploadFileAsync(file);
        user.ProfilePictureUrl = objectName;
        user.UpdatedAtUtc = DateTime.UtcNow;
        user.UpdatedById = currentUserId;
        await _dbContext.SaveChangesAsync();

        return MapToDto(user);
    }

    private UserDto MapToDto(UserEntity user)
    {
        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            DisplayName = user.DisplayName,
            Email = user.Email,
            Address = user.Address,
            City = user.City,
            Phone = user.Phone,
            NationalId = user.NationalId,
            PassportNumber = user.PassportNumber,
            IsActive = user.IsActive,
            ProfilePictureUrl = ResolvePictureUrl(user.ProfilePictureUrl),
            RoleId = user.RoleId,
            RowVersion = user.RowVersion
        };
    }

    private async Task EnsureRoleAssignmentAsync(Guid? roleId, Guid? tenantId)
    {
        if (!roleId.HasValue) return;

        var roles = _dbContext.Roles.AsNoTracking().Where(role => role.Id == roleId.Value);
        if (!_currentUserService.IsAdmin)
        {
            if (!tenantId.HasValue)
            {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            roles = roles.Where(role => role.MainTenantId == tenantId.Value);
        }

        if (!await roles.AnyAsync())
        {
            throw new CustomException("Role not found for this tenant.");
        }
    }

    private string? ResolvePictureUrl(string? objectName)
    {
        if (string.IsNullOrWhiteSpace(objectName))
        {
            return null;
        }

        if (objectName.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || objectName.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return objectName;
        }

        return _storageService.BuildObjectUrl(objectName);
    }

    private IQueryable<UserEntity> GetTenantUsers()
    {
        var query = _dbContext.Users.AsQueryable();
        if (_currentUserService.IsAdmin)
        {
            return query;
        }

        if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId))
        {
            throw new CustomException("Tenant ID is missing for the current user.");
        }

        return query.Where(user => user.MainTenantId == tenantId);
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
}
