using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace FarmPlus.Api.Entities;

[Table("SalePayments")]
public class SalePaymentEntity : EntityBase<Guid>
{
    [Required]
    public Guid SaleId { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal Amount { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal BalanceBefore { get; set; }

    [Required]
    [Precision(18, 2)]
    public decimal BalanceAfter { get; set; }
}
