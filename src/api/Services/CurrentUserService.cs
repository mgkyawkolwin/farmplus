using System.Security.Claims;
using FarmPlus.Api.Constants;

namespace FarmPlus.Api.Services;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? TenantId { get; }
    bool IsAdmin { get; }
}

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier) 
                             ?? User?.FindFirstValue("sub");

    public string? TenantId => User?.FindFirst(AuthKey.TenantId)?.Value;

    public bool IsAdmin => User?.IsInRole("Admin") ?? false;
}