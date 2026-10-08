using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FarmPlus.Api.Constants;
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

    /// <summary>Shop the stock was sold from. Null for sales recorded before shops existed.</summary>
    public Guid? ShopId { get; set; }

    [Required]
    public int TotalProducts { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal SubTotal { get; set; }

    [Required]
    [Precision(5, 2)]
    public decimal TaxRate { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal Tax { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal Discount { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal NetTotal { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal PaidAmount { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal Balance { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = SaleStatus.Completed;

    [MaxLength(500)]
    public string? VoidReason { get; set; }

    public DateTime? VoidedAtUtc { get; set; }

    public Guid? VoidedById { get; set; }

    public ICollection<SaleItemEntity> Items { get; set; } = [];

    public ICollection<SalePaymentEntity> Payments { get; set; } = [];
}