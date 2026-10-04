using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Dtos.Roles;

public sealed record UpdateRoleRequestDto : UpdateRequestBase<Guid>
{
    public string? Role { get; set; }
}