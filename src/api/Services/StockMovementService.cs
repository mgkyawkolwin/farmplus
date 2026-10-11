using FarmPlus.Api.Data;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;

namespace FarmPlus.Api.Services;

public interface IStockMovementService
{
    Task RecordAsync(Guid shopId, Guid productId, int quantity, string type, string? remark, Guid userId, Guid? tenantId);
}

public class StockMovementService : IStockMovementService
{
    private readonly AppDbContext _dbContext;
    private readonly IShopStockService _shopStock;

    public StockMovementService(AppDbContext dbContext, IShopStockService shopStock)
    {
        _dbContext = dbContext;
        _shopStock = shopStock;
    }

    public async Task RecordAsync(Guid shopId, Guid productId, int quantity, string type, string? remark, Guid userId, Guid? tenantId)
    {
        if (quantity == 0) return;
        if (!await _shopStock.TryAdjustAsync(shopId, productId, quantity, userId, tenantId))
        {
            throw new CustomException("Insufficient stock for this movement.");
        }

        _dbContext.StockMovements.Add(new StockMovementEntity
        {
            ShopId = shopId,
            ProductId = productId,
            Quantity = quantity,
            Type = type,
            Remark = string.IsNullOrWhiteSpace(remark) ? null : remark.Trim(),
            MainTenantId = tenantId,
            CreatedById = userId,
            UpdatedById = userId,
        });
    }
}
