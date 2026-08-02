using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Cluspedia.FarmPlus.Api.Entities;

[Table("Categories")]
public class CategoryEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(50)]
    public required string Category { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

}
