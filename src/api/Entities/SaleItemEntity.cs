using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FarmPlus.Api.Entities;

[Table("SaleItems")]
public class SaleItemEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid SaleId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [MaxLength(50)]
    public required string ProductName { get; set; }

    [MaxLength(50)]
    public string? Unit { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal UnitPrice { get; set; }

    [Required]
    [Precision(5, 2)]
    public decimal TaxRate { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal LineTotal { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal TaxTotal { get; set; }
}