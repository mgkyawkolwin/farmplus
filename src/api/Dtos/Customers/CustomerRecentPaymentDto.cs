namespace FarmPlus.Api.Dtos.Customers;

public sealed record CustomerRecentPaymentDto
{
    public Guid Id { get; set; }
    public Guid SaleId { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public DateTime PaidAt { get; set; }
}
