using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("Units")]
public class UnitEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(50)]
    public required string Unit { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;
}
