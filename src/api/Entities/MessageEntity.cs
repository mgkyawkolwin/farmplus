using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("Messages")]
public class MessageEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(20)]
    public required string Audience { get; set; }

    [Required]
    [MaxLength(4000)]
    public required string MessageText { get; set; }

    public Guid? TargetUserId { get; set; }
}