using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("AdminUsers")]
public class AdminUserEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(20)]
    public required string UserName { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(50)]
    public required string Email { get; set; }

    [Required]
    [MaxLength(50)]
    public required string Role { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    [MaxLength(256)]
    public string PasswordHash { get; set; } = null!;
}
