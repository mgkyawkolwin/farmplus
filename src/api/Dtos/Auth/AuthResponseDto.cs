using FarmPlus.Api.Dtos.Users;

namespace FarmPlus.Api.Dtos.Auth;

public sealed record AuthResponseDto(
    string Token,
    UserDto User
);
