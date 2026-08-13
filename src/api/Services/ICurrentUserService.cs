namespace FarmPlus.Api.Services;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? TenantId { get; }
    bool IsAdmin { get; }
}