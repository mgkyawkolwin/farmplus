using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmPlus.Api.Entities;

/// <summary>On-hand quantity of one product in one shop.</summary>
[Table("ShopStocks")]
public class ShopStockEntity : EntityBase<Guid>
{
    [Required]
    public Guid ShopId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    public int Quantity { get; set; }
}
