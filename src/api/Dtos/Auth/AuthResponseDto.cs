using Cluspedia.FarmPlus.Api.Dtos.Users;

namespace Cluspedia.FarmPlus.Api.Dtos.Auth;

public sealed record AuthResponseDto(
    string Token,
    UserDto User
);
