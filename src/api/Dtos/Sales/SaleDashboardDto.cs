namespace FarmPlus.Api.Dtos.Sales;

/// <summary>Contains sales dashboard metrics and the most recent sales.</summary>
public sealed record SaleDashboardDto
{
    public decimal TodaySales { get; set; }
    public decimal ThisMonthSales { get; set; }
    public int UnpaidSales { get; set; }
    public decimal UnpaidAmount { get; set; }
    public int TotalProducts { get; set; }
    public int TotalCustomers { get; set; }
    public List<SaleDto> RecentSales { get; set; } = new List<SaleDto>();
}