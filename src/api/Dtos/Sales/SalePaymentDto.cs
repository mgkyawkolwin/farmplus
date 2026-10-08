namespace FarmPlus.Api.Dtos.Sales;

/// <summary>Represents a payment received against a sale.</summary>
public sealed record SalePaymentDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public DateTimeOffset PaidAt { get; set; }
    public string? ReceivedByName { get; set; }
}
