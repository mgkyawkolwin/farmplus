namespace FarmPlus.Api.Dtos.Sales;

/// <summary>Represents a recorded sale.</summary>
public sealed record SaleDto
{
    public Guid Id { get; set; }
    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTimeOffset SaleDate { get; set; }
    public int TotalProducts { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal NetTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal Balance { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? VoidReason { get; set; }
    public DateTimeOffset? VoidedAt { get; set; }
    public string? VoidedByName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public string? UpdatedByName { get; set; }
    public List<SaleItemDto> Items { get; set; } = [];
    public List<SalePaymentDto> Payments { get; set; } = [];
}