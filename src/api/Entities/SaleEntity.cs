using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FarmPlus.Api.Entities;

[Table("Sales")]
public class SaleEntity : EntityBase<Guid>
{
    public Guid? CustomerId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string CustomerName { get; set; }

    [Required]
    public DateTime SaleDate { get; set; }

    [Required]
    public int TotalProducts { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal SubTotal { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal Tax { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal NetTotal { get; set; }

    public ICollection<SaleItemEntity> Items { get; set; } = [];
}