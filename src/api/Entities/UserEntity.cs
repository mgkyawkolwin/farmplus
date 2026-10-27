using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("Users")]
public class UserEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(20)]
    public required string UserName { get; set; }

    [Required]
    [MaxLength(100)]
    public required string DisplayName { get; set; }

    [EmailAddress]
    [MaxLength(50)]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(30)]
    public string? NationalId { get; set; }

    [MaxLength(30)]
    public string? PassportNumber { get; set; }

    public bool IsActive { get; set; } = true;

    public Guid? RoleId { get; set; }

    [MaxLength(500)]
    public string? ProfilePictureUrl { get; set; }

    [Required]
    [MaxLength(256)]
    public string PasswordHash { get; set; } = null!;

}
