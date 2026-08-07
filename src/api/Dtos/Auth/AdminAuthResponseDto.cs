using FarmPlus.Api.Dtos.AdminUsers;
using FarmPlus.Api.Dtos.Users;

namespace FarmPlus.Api.Dtos.Auth;

public sealed record AdminAuthResponseDto(
    string Token,
    AdminUserDto User
);
