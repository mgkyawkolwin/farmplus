using FarmPlus.Api.Dtos.Auth;

namespace FarmPlus.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> SignInAsync(LoginDto dto);
    Task<AdminAuthResponseDto> SignInAdminAsync(LoginDto dto);
    Task<AuthResponseDto> SignInWithGoogleAsync(GoogleLoginDto dto);
}
