namespace FarmPlus.AdminClient.Dtos.Auth;

public sealed record AuthUserDto(Guid Id, string? UserName, string? Email);

public sealed record AuthResponseDto(string Token, AuthUserDto User);
