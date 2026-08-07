using FarmPlus.Api.Dtos.AdminUsers;
using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Services;

public interface IAdminUserService
{
    Task<PaginatedResultDto<AdminUserDto>> GetAdminUsersAsync(int page, int pageSize);
    Task<AdminUserDto?> GetAdminUserByIdAsync(Guid id);
    Task<AdminUserDto> CreateAdminUserAsync(CreateAdminUserDto request, Guid currentUserId);
    Task<AdminUserDto?> UpdateAdminUserAsync(Guid id, UpdateAdminUserDto request, Guid currentUserId);
    Task<bool> DeleteAdminUserAsync(Guid id);
}
