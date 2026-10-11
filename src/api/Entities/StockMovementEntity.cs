using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

[Table("StockMovements")]
public class StockMovementEntity : EntityBase<Guid>
{
    [Required]
    public Guid ShopId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    [MaxLength(20)]
    public required string Type { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }
}
