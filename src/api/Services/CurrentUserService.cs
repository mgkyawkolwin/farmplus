using System.Security.Claims;
using FarmPlus.Api.Constants;

namespace FarmPlus.Api.Services;

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

    public string? TenantId => User?.FindFirst(CustomClaimTypes.TenantId)?.Value;

    public bool IsAdmin => bool.TryParse(User?.FindFirst(CustomClaimTypes.IsAdmin)?.Value, out var isAdmin) && isAdmin;

    public const string ShopIdHeader = "X-Shop-Id";

    public Guid? ShopId =>
        Guid.TryParse(_httpContextAccessor.HttpContext?.Request.Headers[ShopIdHeader].ToString(), out var shopId) && shopId != Guid.Empty
            ? shopId
            : null;
}