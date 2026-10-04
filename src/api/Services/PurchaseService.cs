using Microsoft.EntityFrameworkCore;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Purchases;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface IPurchaseService
{
    Task<PaginatedResultDto<PurchaseDto>> GetPurchasesAsync(int page, int pageSize);
    Task<PurchaseDto?> GetPurchaseByIdAsync(Guid id);
    Task<PurchaseDto> CreatePurchaseAsync(CreatePurchaseRequestDto request);
    Task<PurchaseDto?> UpdatePurchaseAsync(Guid id, UpdatePurchaseRequestDto request);
    Task DeletePurchaseAsync(Guid id);
}

public class PurchaseService : IPurchaseService
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<PurchaseService> _logger;

    public PurchaseService(AppDbContext dbContext, ICurrentUserService currentUserService, ILogger<PurchaseService> logger)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<PurchaseDto>> GetPurchasesAsync(int page, int pageSize)
    {
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);
        var query = GetTenantPurchases().AsNoTracking();
        var total = await query.CountAsync();
        var purchases = await query
            .Include(purchase => purchase.Items)
            .OrderByDescending(purchase => purchase.PurchaseDate)
            .ThenByDescending(purchase => purchase.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        var purchaseDtos = purchases.Select(MapToDto).ToList();

        return new PaginatedResultDto<PurchaseDto>(purchaseDtos, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<PurchaseDto?> GetPurchaseByIdAsync(Guid id)
    {
        var purchase = await GetTenantPurchases()
            .AsNoTracking()
            .Include(item => item.Items)
            .SingleOrDefaultAsync(item => item.Id == id);
        return purchase is null ? null : MapToDto(purchase);
    }

    public async Task<PurchaseDto> CreatePurchaseAsync(CreatePurchaseRequestDto request)
    {
        var userId = GetCurrentUserId();
        var tenantId = GetCurrentTenantId();
        var supplier = await GetTenantSuppliers().SingleOrDefaultAsync(item => item.Id == request.SupplierId)
            ?? throw new CustomException("Supplier not found.");
        var items = await CreateItemsAsync(request.Items);
        var totals = CalculateTotals(items, request.Discount, request.Tax);
        var purchaseDate = NormalizeDate(request.PurchaseDate);

        await AdjustProductStockAsync([], items, userId);

        var purchase = new PurchaseEntity
        {
            SupplierId = supplier.Id,
            SupplierName = supplier.SupplierName,
            PurchaseDate = purchaseDate,
            TotalProducts = totals.TotalProducts,
            SubTotal = totals.SubTotal,
            Discount = totals.Discount,
            Tax = totals.Tax,
            NetTotal = totals.NetTotal,
            Items = items,
            MainTenantId = tenantId,
            CreatedById = userId,
            UpdatedById = userId,
        };

        _dbContext.Purchases.Add(purchase);
        await _dbContext.SaveChangesAsync();
        return MapToDto(purchase);
    }

    public async Task<PurchaseDto?> UpdatePurchaseAsync(Guid id, UpdatePurchaseRequestDto request)
    {
        try
        {
            if (request.RowVersion == Guid.Empty)
            {
                throw new CustomException("RowVersion is required.");
            }

            var purchase = await GetTenantPurchases()
                .Include(item => item.Items)
                .SingleOrDefaultAsync(item => item.Id == id)
                ?? throw new CustomException("Purchase not found.");
            var supplier = await GetTenantSuppliers().SingleOrDefaultAsync(item => item.Id == request.SupplierId)
                ?? throw new CustomException("Supplier not found.");
            var items = await CreateItemsAsync(request.Items);
            var totals = CalculateTotals(items, request.Discount, request.Tax);
            var purchaseDate = NormalizeDate(request.PurchaseDate);
            var userId = GetCurrentUserId();

            await AdjustProductStockAsync(purchase.Items.ToList(), items, userId);

            _dbContext.Entry(purchase).Property(item => item.RowVersion).OriginalValue = request.RowVersion;
            purchase.RowVersion = Guid.NewGuid();
            purchase.SupplierId = supplier.Id;
            purchase.SupplierName = supplier.SupplierName;
            purchase.PurchaseDate = purchaseDate;
            purchase.TotalProducts = totals.TotalProducts;
            purchase.SubTotal = totals.SubTotal;
            purchase.Discount = totals.Discount;
            purchase.Tax = totals.Tax;
            purchase.NetTotal = totals.NetTotal;
            purchase.Items.Clear();
            foreach (var item in items)
            {
                purchase.Items.Add(item);
            }
            purchase.UpdatedAtUtc = DateTime.UtcNow;
            purchase.UpdatedById = userId;

            await _dbContext.SaveChangesAsync();
            return MapToDto(purchase);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException("This purchase was changed by another user. Refresh and try again.");
        }
    }

    public async Task DeletePurchaseAsync(Guid id)
    {
        var purchase = await GetTenantPurchases()
            .Include(item => item.Items)
            .SingleOrDefaultAsync(item => item.Id == id)
            ?? throw new CustomException("Purchase not found.");

        await AdjustProductStockAsync(purchase.Items.ToList(), [], GetCurrentUserId());
        _dbContext.Purchases.Remove(purchase);
        await _dbContext.SaveChangesAsync();
    }

    private async Task<List<PurchaseItemEntity>> CreateItemsAsync(IReadOnlyCollection<PurchaseLineRequestDto>? requests)
    {
        if (requests is null || requests.Count == 0)
        {
            throw new CustomException("At least one product is required.");
        }
        if (requests.Any(item => item.ProductId == Guid.Empty || item.Quantity <= 0 || item.UnitPrice < 0))
        {
            throw new CustomException("Each product must have a valid product, positive quantity, and non-negative price.");
        }
        if (requests.Select(item => item.ProductId).Distinct().Count() != requests.Count)
        {
            throw new CustomException("A product can only appear once in a purchase.");
        }

        var productIds = requests.Select(item => item.ProductId).ToArray();
        var products = await GetTenantProducts()
            .Where(product => productIds.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id);
        if (products.Count != productIds.Length)
        {
            throw new CustomException("One or more products could not be found.");
        }

        return requests.Select(request =>
        {
            var product = products[request.ProductId];
            var unitPrice = decimal.Round(request.UnitPrice, 2, MidpointRounding.AwayFromZero);
            return new PurchaseItemEntity
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Unit = product.Unit,
                Quantity = request.Quantity,
                UnitPrice = unitPrice,
                LineTotal = decimal.Round(request.Quantity * unitPrice, 2, MidpointRounding.AwayFromZero),
            };
        }).ToList();
    }

    private async Task AdjustProductStockAsync(
        IReadOnlyCollection<PurchaseItemEntity> previousItems,
        IReadOnlyCollection<PurchaseItemEntity> nextItems,
        Guid userId)
    {
        var oldQuantities = previousItems
            .GroupBy(item => item.ProductId)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));
        var newQuantities = nextItems
            .GroupBy(item => item.ProductId)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));
        var productIds = oldQuantities.Keys.Union(newQuantities.Keys).ToArray();
        if (productIds.Length == 0) return;

        var products = await GetTenantProducts()
            .Where(product => productIds.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id);
        if (newQuantities.Keys.Any(productId => !products.ContainsKey(productId)))
        {
            throw new CustomException("One or more products could not be found in the current tenant.");
        }

        foreach (var productId in productIds)
        {
            if (!products.TryGetValue(productId, out var product)) continue;
            var stockDelta = newQuantities.GetValueOrDefault(productId) - oldQuantities.GetValueOrDefault(productId);
            if (product.CurrentStock + stockDelta < 0)
            {
                throw new CustomException($"Purchase cannot be changed because {product.Name} stock has already been used.");
            }

            if (stockDelta == 0) continue;
            product.CurrentStock += stockDelta;
            product.RowVersion = Guid.NewGuid();
            product.UpdatedAtUtc = DateTime.UtcNow;
            product.UpdatedById = userId;
        }
    }

    private IQueryable<PurchaseEntity> GetTenantPurchases()
    {
        var query = _dbContext.Purchases.AsQueryable();
        if (_currentUserService.IsAdmin) return query;
        var tenantId = GetCurrentTenantId()!.Value;
        return query.Where(purchase => purchase.MainTenantId == tenantId);
    }

    private IQueryable<SupplierEntity> GetTenantSuppliers()
    {
        var query = _dbContext.Suppliers.AsQueryable();
        if (_currentUserService.IsAdmin) return query;
        var tenantId = GetCurrentTenantId()!.Value;
        return query.Where(supplier => supplier.MainTenantId == tenantId);
    }

    private IQueryable<ProductEntity> GetTenantProducts()
    {
        var query = _dbContext.Products.AsQueryable();
        if (_currentUserService.IsAdmin) return query;
        var tenantId = GetCurrentTenantId()!.Value;
        return query.Where(product => product.MainTenantId == tenantId);
    }

    private Guid? GetCurrentTenantId()
    {
        if (Guid.TryParse(_currentUserService.TenantId, out var tenantId)) return tenantId;
        if (!_currentUserService.IsAdmin) throw new CustomException("Tenant ID is missing for the current user.");
        return null;
    }

    private Guid GetCurrentUserId()
    {
        return Guid.TryParse(_currentUserService.UserId, out var userId)
            ? userId
            : throw new CustomException("Invalid session user.");
    }

    private static DateTime NormalizeDate(DateTimeOffset value)
    {
        if (value == default) throw new CustomException("Purchase date is required.");
        return value.UtcDateTime;
    }

    private static (int TotalProducts, decimal SubTotal, decimal Discount, decimal Tax, decimal NetTotal) CalculateTotals(
        IReadOnlyCollection<PurchaseItemEntity> items,
        decimal discount,
        decimal tax)
    {
        if (discount < 0 || tax < 0) throw new CustomException("Discount and tax cannot be negative.");
        var subTotal = decimal.Round(items.Sum(item => item.LineTotal), 2);
        discount = decimal.Round(discount, 2, MidpointRounding.AwayFromZero);
        tax = decimal.Round(tax, 2, MidpointRounding.AwayFromZero);
        if (discount > subTotal) throw new CustomException("Discount cannot exceed the subtotal.");
        var netTotal = decimal.Round(subTotal - discount + tax, 2, MidpointRounding.AwayFromZero);
        return (items.Sum(item => item.Quantity), subTotal, discount, tax, netTotal);
    }

    private static PurchaseDto MapToDto(PurchaseEntity purchase)
    {
        return new PurchaseDto
        {
            Id = purchase.Id,
            SupplierId = purchase.SupplierId,
            SupplierName = purchase.SupplierName,
            PurchaseDate = new DateTimeOffset(DateTime.SpecifyKind(purchase.PurchaseDate, DateTimeKind.Utc)),
            TotalProducts = purchase.TotalProducts,
            SubTotal = purchase.SubTotal,
            Discount = purchase.Discount,
            Tax = purchase.Tax,
            NetTotal = purchase.NetTotal,
            RowVersion = purchase.RowVersion,
            Items = purchase.Items.Select(item => new PurchaseItemDto
            {
                Id = item.Id,
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                Unit = item.Unit,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                LineTotal = item.LineTotal,
            }).ToList(),
        };
    }
}