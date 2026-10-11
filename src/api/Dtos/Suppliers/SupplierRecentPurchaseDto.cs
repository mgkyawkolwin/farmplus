namespace FarmPlus.Api.Dtos.Suppliers;

public sealed record SupplierRecentPurchaseDto
{
    public Guid Id { get; set; }
    public DateTime PurchaseDate { get; set; }
    public decimal NetTotal { get; set; }
    public int TotalProducts { get; set; }
}
