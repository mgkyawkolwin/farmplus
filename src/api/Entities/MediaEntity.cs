using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Cluspedia.FarmPlus.Api.Entities;

[Table("Medias")]
public class MediaEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(50)]
    public required string ObjectName { get; set; }

    [Required]
    [MaxLength(50)]
    public required string MediaType { get; set; }

    [Required]
    public Guid OwnerId { get; set; }

    [Required]
    public long Size { get; set; }

}
