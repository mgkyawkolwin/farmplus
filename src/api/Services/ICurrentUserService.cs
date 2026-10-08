namespace FarmPlus.Api.Services;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? TenantId { get; }
    bool IsAdmin { get; }

    /// <summary>The shop the client currently has selected (X-Shop-Id request header), if any.</summary>
    Guid? ShopId { get; }
}