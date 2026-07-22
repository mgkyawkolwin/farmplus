using Cluspedia.FarmPlus.Api.Dtos.Auth;

namespace Cluspedia.FarmPlus.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto> SignInAsync(LoginDto dto);
    Task<AuthResponseDto> SignInWithGoogleAsync(GoogleLoginDto dto);
}
