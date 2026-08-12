using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("Suppliers")]
public class SupplierEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(50)]
    public required string SupplierName { get; set; }

    [EmailAddress]
    [MaxLength(50)]
    public string? Email { get; set; }

    [MaxLength(100)]
    public string? PhoneNumber { get; set; }

    [MaxLength(100)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? StateDivision { get; set; }

    [MaxLength(50)]
    public string? City { get; set; }

    [MaxLength(50)]
    public string? Country { get; set; }

    [MaxLength(100)]
    public string? LogoUrl { get; set; }

    [Required]
    public bool IsRequired { get; set; }

}
