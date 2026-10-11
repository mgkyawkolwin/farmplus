namespace FarmPlus.Api.Dtos.Customers;

public sealed record CustomerRecentSaleDto
{
    public Guid Id { get; set; }
    public DateTime SaleDate { get; set; }
    public decimal NetTotal { get; set; }
    public decimal Balance { get; set; }
    public string Status { get; set; } = string.Empty;
}
