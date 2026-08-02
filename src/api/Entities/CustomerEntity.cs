using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Cluspedia.FarmPlus.Api.Entities;

[Table("Customers")]
public class CustomerEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(50)]
    public required string Name { get; set; }

    [MaxLength(50)]
    public string? NationalIdNumber { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(50)]
    public string? Email { get; set; }

    [MaxLength(256)]
    public string? Address { get; set; }

    [MaxLength(50)]
    public string? City { get; set; }

    [MaxLength(50)]
    public string? Country { get; set; }

    [MaxLength(50)]
    public string? PostalCode { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

}
