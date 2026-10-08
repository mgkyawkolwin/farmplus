using Microsoft.EntityFrameworkCore;
using FarmPlus.Api.Data;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;

namespace FarmPlus.Api.Services;

/// <summary>Reads and changes per-shop product stock. Changes are tracked and saved by the calling service.</summary>
public interface IShopStockService
{
    /// <summary>Returns the selected shop id after checking it exists in the current tenant.</summary>
    Task<ShopEntity> RequireCurrentShopAsync();

    Task<Dictionary<Guid, int>> GetQuantitiesAsync(Guid shopId, IReadOnlyCollection<Guid> productIds);

    /// <summary>Adds <paramref name="delta"/> to the shop's stock. Returns false (and changes nothing) if the result would be negative.</summary>
    Task<bool> TryAdjustAsync(Guid shopId, Guid productId, int delta, Guid userId, Guid? tenantId);

    /// <summary>Sets the shop's stock to an absolute quantity.</summary>
    Task SetAsync(Guid shopId, Guid productId, int quantity, Guid userId, Guid? tenantId);
}

public class ShopStockService : IShopStockService
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public ShopStockService(AppDbContext dbContext, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<ShopEntity> RequireCurrentShopAsync()
    {
        var shopId = _currentUserService.ShopId
            ?? throw new CustomException("Select a shop first.");

        var query = _dbContext.Shops.AsQueryable();
        if (!_currentUserService.IsAdmin)
        {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId))
            {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(shop => shop.MainTenantId == tenantId);
        }

        return await query.SingleOrDefaultAsync(shop => shop.Id == shopId)
            ?? throw new CustomException("The selected shop was not found. Select a shop again.");
    }

    public async Task<Dictionary<Guid, int>> GetQuantitiesAsync(Guid shopId, IReadOnlyCollection<Guid> productIds)
    {
        if (productIds.Count == 0) return new Dictionary<Guid, int>();

        var ids = productIds.ToArray();
        return await _dbContext.ShopStocks.AsNoTracking()
            .Where(stock => stock.ShopId == shopId && ids.Contains(stock.ProductId))
            .ToDictionaryAsync(stock => stock.ProductId, stock => stock.Quantity);
    }

    public async Task<bool> TryAdjustAsync(Guid shopId, Guid productId, int delta, Guid userId, Guid? tenantId)
    {
        var stock = await FindOrCreateAsync(shopId, productId, userId, tenantId);
        if (stock.Quantity + delta < 0) return false;

        stock.Quantity += delta;
        Touch(stock, userId);
        return true;
    }

    public async Task SetAsync(Guid shopId, Guid productId, int quantity, Guid userId, Guid? tenantId)
    {
        if (quantity < 0) throw new CustomException("Stock cannot be negative.");

        var stock = await FindOrCreateAsync(shopId, productId, userId, tenantId);
        stock.Quantity = quantity;
        Touch(stock, userId);
    }

    private async Task<ShopStockEntity> FindOrCreateAsync(Guid shopId, Guid productId, Guid userId, Guid? tenantId)
    {
        var stock = _dbContext.ShopStocks.Local.FirstOrDefault(item => item.ShopId == shopId && item.ProductId == productId)
            ?? await _dbContext.ShopStocks.SingleOrDefaultAsync(item => item.ShopId == shopId && item.ProductId == productId);
        if (stock is not null) return stock;

        stock = new ShopStockEntity
        {
            ShopId = shopId,
            ProductId = productId,
            Quantity = 0,
            MainTenantId = tenantId,
            CreatedById = userId,
            UpdatedById = userId,
        };
        _dbContext.ShopStocks.Add(stock);
        return stock;
    }

    private static void Touch(ShopStockEntity stock, Guid userId)
    {
        stock.RowVersion = Guid.NewGuid();
        stock.UpdatedAtUtc = DateTime.UtcNow;
        stock.UpdatedById = userId;
    }
}
