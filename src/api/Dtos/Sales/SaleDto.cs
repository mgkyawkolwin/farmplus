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
    public decimal Tax { get; set; }
    public decimal NetTotal { get; set; }
}