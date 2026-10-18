using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("CustomerMessages")]
public class CustomerMessageEntity : EntityBase<Guid>
{
    [Required]
    public Guid MessageId { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public bool IsRead { get; set; }

    public DateTime? ReadAtUtc { get; set; }
}