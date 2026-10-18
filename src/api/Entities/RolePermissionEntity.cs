using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("RolePermissions")]
public class RolePermissionEntity : EntityBase<Guid>
{
    [Required]
    public Guid RoleId { get; set; }

    [Required]
    [MaxLength(160)]
    public required string PermissionKey { get; set; }
}