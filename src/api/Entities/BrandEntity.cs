using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("Brands")]
public class BrandEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(50)]
    public required string Brand { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;
}
