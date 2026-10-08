using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FarmPlus.Api.Entities;

[Table("Purchases")]
public class PurchaseEntity : EntityBase<Guid>
{
    [Required]
    public Guid SupplierId { get; set; }

    [Required]
    [MaxLength(50)]
    public required string SupplierName { get; set; }

    [Required]
    public DateTime PurchaseDate { get; set; }

    /// <summary>Shop that received the stock. Null for purchases recorded before shops existed.</summary>
    public Guid? ShopId { get; set; }

    [MaxLength(100)]
    public string? ShopName { get; set; }

    [Required]
    public int TotalProducts { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal SubTotal { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal Discount { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal Tax { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal NetTotal { get; set; }

    public ICollection<PurchaseItemEntity> Items { get; set; } = [];
}