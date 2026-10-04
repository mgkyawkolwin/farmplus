using FarmPlus.Api.Dtos;

namespace FarmPlus.Api.Dtos.Roles;

public sealed record RoleDto : DtoBase
{
    public Guid Id { get; set; }
    public string Role { get; set; } = string.Empty;
}