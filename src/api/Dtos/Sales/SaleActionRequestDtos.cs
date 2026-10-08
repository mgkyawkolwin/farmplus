namespace FarmPlus.Api.Dtos.Sales;

/// <summary>Payload for voiding a sale.</summary>
public sealed record VoidSaleRequestDto
{
    public string Reason { get; set; } = string.Empty;
}

/// <summary>Payload for recording a payment against a sale.</summary>
public sealed record AddSalePaymentRequestDto
{
    public decimal Amount { get; set; }
}

/// <summary>Payload for adjusting the tax rate and discount of a sale.</summary>
public sealed record UpdateSaleRequestDto
{
    public decimal TaxRate { get; set; }
    public decimal Discount { get; set; }
}
