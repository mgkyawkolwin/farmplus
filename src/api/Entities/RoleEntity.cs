using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("Roles")]
public class RoleEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(50)]
    public required string Role { get; set; }
}