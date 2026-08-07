using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FarmPlus.Api.Entities;

[Table("Products")]
public class ProductEntity : EntityBase<Guid>
{
    [Required]
    [MaxLength(50)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(512)]
    public required string Description { get; set; }

    [Required]
    [MaxLength(50)]
    public required string Brand { get; set; }

    [MaxLength(50)]
    public string? SKU { get; set; }

    [MaxLength(50)]
    public string? UPC { get; set; }

    [Required]
    [MaxLength(50)]
    public required string Category { get; set; }

    [Required]
    [MaxLength(50)]
    public required string Unit { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal PurchasePrice { get; set; } = 0.00m;

    [Required]
    [Precision(18, 2)]
    public decimal SalePrice { get; set; } = 0.00m;

    [Required]
    public int CurrentStock { get; set; } = 0;

    [Required]
    public int MinimumStock { get; set; } = 0;

    [Required]
    [Precision(5, 2)]
    public decimal TaxRate { get; set; } = 0.00m;

    [Required]
    public bool IsActive { get; set; } = true;

}
