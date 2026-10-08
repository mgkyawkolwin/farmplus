using Microsoft.EntityFrameworkCore;
using FarmPlus.Api.Constants;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Sales;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface ISaleService
{
    Task<SaleDashboardDto> GetDashboardAsync();
    Task<PaginatedResultDto<SaleDto>> GetSalesAsync(int page, int pageSize);
    Task<SaleDto?> GetSaleByIdAsync(Guid id);
    Task<SaleDto> CreateSaleAsync(CreateSaleRequestDto request);
    Task<SaleDto> UpdateSaleAsync(Guid id, UpdateSaleRequestDto request);
    Task<SaleDto> VoidSaleAsync(Guid id, VoidSaleRequestDto request);
    Task<SaleDto> AddPaymentAsync(Guid id, AddSalePaymentRequestDto request);
}

public class SaleService : ISaleService
{
    private const string WalkInCustomerName = "Walk-in Customer";
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStorageService _storageService;
    private readonly IShopStockService _shopStock;

    public SaleService(AppDbContext dbContext, ICurrentUserService currentUserService, IStorageService storageService, IShopStockService shopStock)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _storageService = storageService;
        _shopStock = shopStock;
    }

    public async Task<SaleDashboardDto> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var todayStart = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);
        var tomorrowStart = todayStart.AddDays(1);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var sales = FilterByCurrentShop(GetTenantSales()).AsNoTracking();
        var activeSales = sales.Where(sale => sale.Status != SaleStatus.Voided);

        return new SaleDashboardDto
        {
            TodaySales = await activeSales
                .Where(sale => sale.SaleDate >= todayStart && sale.SaleDate < tomorrowStart)
                .SumAsync(sale => (decimal?)sale.NetTotal) ?? 0m,
            ThisMonthSales = await activeSales
                .Where(sale => sale.SaleDate >= monthStart && sale.SaleDate < tomorrowStart)
                .SumAsync(sale => (decimal?)sale.NetTotal) ?? 0m,
            UnpaidSales = await activeSales.CountAsync(sale => sale.Balance > 0),
            UnpaidAmount = await activeSales
                .Where(sale => sale.Balance > 0)
                .SumAsync(sale => (decimal?)sale.Balance) ?? 0m,
            TotalProducts = await GetTenantProducts().AsNoTracking().CountAsync(),
            TotalCustomers = await GetTenantCustomers().AsNoTracking().CountAsync(),
            RecentSales = await sales
                .OrderByDescending(sale => sale.SaleDate)
                .ThenByDescending(sale => sale.CreatedAtUtc)
                .Take(10)
                .Select(sale => new SaleDto
                {
                    Id = sale.Id,
                    CustomerId = sale.CustomerId,
                    CustomerName = sale.CustomerName,
                    SaleDate = new DateTimeOffset(DateTime.SpecifyKind(sale.SaleDate, DateTimeKind.Utc)),
                    TotalProducts = sale.TotalProducts,
                    SubTotal = sale.SubTotal,
                    TaxRate = sale.TaxRate,
                    Tax = sale.Tax,
                    Discount = sale.Discount,
                    NetTotal = sale.NetTotal,
                    PaidAmount = sale.PaidAmount,
                    Balance = sale.Balance,
                    Status = sale.Status,
                })
                .ToListAsync(),
        };
    }

    public async Task<PaginatedResultDto<SaleDto>> GetSalesAsync(int page, int pageSize)
    {
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);
        var query = FilterByCurrentShop(GetTenantSales()).AsNoTracking();
        var total = await query.CountAsync();
        var sales = await query
            .OrderByDescending(sale => sale.SaleDate)
            .ThenByDescending(sale => sale.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(sale => new SaleDto
            {
                Id = sale.Id,
                CustomerId = sale.CustomerId,
                CustomerName = sale.CustomerName,
                SaleDate = new DateTimeOffset(DateTime.SpecifyKind(sale.SaleDate, DateTimeKind.Utc)),
                TotalProducts = sale.TotalProducts,
                SubTotal = sale.SubTotal,
                TaxRate = sale.TaxRate,
                Tax = sale.Tax,
                Discount = sale.Discount,
                NetTotal = sale.NetTotal,
                PaidAmount = sale.PaidAmount,
                Balance = sale.Balance,
                Status = sale.Status,
            })
            .ToListAsync();

        return new PaginatedResultDto<SaleDto>(sales, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<SaleDto?> GetSaleByIdAsync(Guid id)
    {
        var sale = await GetTenantSales().AsNoTracking()
            .Include(item => item.Items)
            .Include(item => item.Payments)
            .SingleOrDefaultAsync(item => item.Id == id);
        return sale is null ? null : await BuildDetailAsync(sale);
    }

    public async Task<SaleDto> CreateSaleAsync(CreateSaleRequestDto request)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            throw new CustomException("At least one product is required.");
        }
        if (request.TaxRate < 0 || request.Discount < 0 || request.PaidAmount < 0)
        {
            throw new CustomException("Tax rate, discount, and paid amount cannot be negative.");
        }
        if (request.Items.Any(item => item.ProductId == Guid.Empty || item.Quantity <= 0))
        {
            throw new CustomException("Each sale line must have a valid product and positive quantity.");
        }
        if (request.Items.Select(item => item.ProductId).Distinct().Count() != request.Items.Count)
        {
            throw new CustomException("A product can only appear once in a sale.");
        }

        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();
        var shop = await _shopStock.RequireCurrentShopAsync();
        var customerName = WalkInCustomerName;
        if (request.CustomerId.HasValue)
        {
            var customer = await GetTenantCustomers().SingleOrDefaultAsync(item => item.Id == request.CustomerId.Value)
                ?? throw new CustomException("Customer not found.");
            customerName = customer.Name;
        }

        var productIds = request.Items.Select(item => item.ProductId).ToArray();
        var products = await GetTenantProducts()
            .Where(product => productIds.Contains(product.Id))
            .ToDictionaryAsync(product => product.Id);
        if (products.Count != productIds.Length)
        {
            throw new CustomException("One or more products could not be found in the current tenant.");
        }

        var lines = new List<SaleItemEntity>(request.Items.Count);
        var onHandQuantities = await _shopStock.GetQuantitiesAsync(shop.Id, productIds);
        foreach (var requestItem in request.Items)
        {
            var product = products[requestItem.ProductId];
            var onHand = onHandQuantities.GetValueOrDefault(product.Id);
            if (onHand < requestItem.Quantity)
            {
                throw new CustomException($"Insufficient stock for {product.Name} in {shop.Name}. Available: {onHand}.");
            }
            if (product.SalePrice < 0 || product.TaxRate < 0)
            {
                throw new CustomException($"Invalid price or tax rate for {product.Name}.");
            }

            var unitPrice = decimal.Round(product.SalePrice, 2, MidpointRounding.AwayFromZero);
            var lineTotal = decimal.Round(requestItem.Quantity * unitPrice, 2, MidpointRounding.AwayFromZero);
            var taxTotal = decimal.Round(lineTotal * product.TaxRate / 100m, 2, MidpointRounding.AwayFromZero);
            lines.Add(new SaleItemEntity
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Unit = product.Unit,
                Quantity = requestItem.Quantity,
                UnitPrice = unitPrice,
                TaxRate = product.TaxRate,
                LineTotal = lineTotal,
                TaxTotal = taxTotal,
            });

            if (!await _shopStock.TryAdjustAsync(shop.Id, product.Id, -requestItem.Quantity, userId, tenantId))
            {
                throw new CustomException($"Insufficient stock for {product.Name} in {shop.Name}. Available: {onHand}.");
            }
        }

        var subTotal = decimal.Round(lines.Sum(line => line.LineTotal), 2, MidpointRounding.AwayFromZero);
        var taxRate = decimal.Round(request.TaxRate, 2, MidpointRounding.AwayFromZero);
        var discount = decimal.Round(request.Discount, 2, MidpointRounding.AwayFromZero);
        if (discount > subTotal)
        {
            throw new CustomException("Discount cannot exceed the subtotal.");
        }
        var tax = decimal.Round(subTotal * taxRate / 100m, 2, MidpointRounding.AwayFromZero);
        var netTotal = decimal.Round(subTotal - discount + tax, 2, MidpointRounding.AwayFromZero);
        var paidAmount = decimal.Round(request.PaidAmount, 2, MidpointRounding.AwayFromZero);
        var balance = decimal.Round(netTotal - paidAmount, 2, MidpointRounding.AwayFromZero);

        var sale = new SaleEntity
        {
            CustomerId = request.CustomerId,
            CustomerName = customerName,
            ShopId = shop.Id,
            SaleDate = DateTime.UtcNow,
            TotalProducts = lines.Sum(line => line.Quantity),
            SubTotal = subTotal,
            TaxRate = taxRate,
            Tax = tax,
            Discount = discount,
            NetTotal = netTotal,
            PaidAmount = paidAmount,
            Balance = balance,
            Items = lines,
            Payments = paidAmount > 0
                ? [new SalePaymentEntity
                {
                    Amount = paidAmount,
                    BalanceBefore = netTotal,
                    BalanceAfter = balance,
                    MainTenantId = tenantId,
                    CreatedById = userId,
                    UpdatedById = userId,
                }]
                : [],
            MainTenantId = tenantId,
            CreatedById = userId,
            UpdatedById = userId,
        };

        _dbContext.Sales.Add(sale);
        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException("Stock changed while this sale was being recorded. Refresh stock and try again.");
        }

        return await BuildDetailAsync(sale);
    }

    public async Task<SaleDto> UpdateSaleAsync(Guid id, UpdateSaleRequestDto request)
    {
        if (request.TaxRate < 0 || request.TaxRate > 100)
        {
            throw new CustomException("Tax rate must be between 0 and 100.");
        }
        if (request.Discount < 0)
        {
            throw new CustomException("Discount cannot be negative.");
        }

        var sale = await LoadSaleForUpdateAsync(id);
        EnsureNotVoided(sale);

        var taxRate = decimal.Round(request.TaxRate, 2, MidpointRounding.AwayFromZero);
        var discount = decimal.Round(request.Discount, 2, MidpointRounding.AwayFromZero);
        if (discount > sale.SubTotal)
        {
            throw new CustomException("Discount cannot exceed the subtotal.");
        }

        var tax = decimal.Round(sale.SubTotal * taxRate / 100m, 2, MidpointRounding.AwayFromZero);
        var netTotal = decimal.Round(sale.SubTotal - discount + tax, 2, MidpointRounding.AwayFromZero);
        if (netTotal < sale.PaidAmount)
        {
            throw new CustomException("Net total cannot be less than the amount already paid.");
        }

        sale.TaxRate = taxRate;
        sale.Tax = tax;
        sale.Discount = discount;
        sale.NetTotal = netTotal;
        sale.Balance = decimal.Round(netTotal - sale.PaidAmount, 2, MidpointRounding.AwayFromZero);
        Touch(sale, GetCurrentUserId());

        await SaveSaleChangesAsync();
        return await BuildDetailAsync(sale);
    }

    public async Task<SaleDto> VoidSaleAsync(Guid id, VoidSaleRequestDto request)
    {
        var reason = request.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new CustomException("A void reason is required.");
        }
        if (reason.Length > 500)
        {
            throw new CustomException("Void reason cannot exceed 500 characters.");
        }

        var sale = await LoadSaleForUpdateAsync(id);
        EnsureNotVoided(sale);

        var userId = GetCurrentUserId();
        if (sale.ShopId is { } saleShopId)
        {
            var voidTenantId = GetCurrentTenantId();
            foreach (var item in sale.Items)
            {
                await _shopStock.TryAdjustAsync(saleShopId, item.ProductId, item.Quantity, userId, voidTenantId);
            }
        }

        sale.Status = SaleStatus.Voided;
        sale.VoidReason = reason;
        sale.VoidedAtUtc = DateTime.UtcNow;
        sale.VoidedById = userId;
        Touch(sale, userId);

        await SaveSaleChangesAsync();
        return await BuildDetailAsync(sale);
    }

    public async Task<SaleDto> AddPaymentAsync(Guid id, AddSalePaymentRequestDto request)
    {
        var amount = decimal.Round(request.Amount, 2, MidpointRounding.AwayFromZero);
        if (amount <= 0)
        {
            throw new CustomException("Payment amount must be greater than zero.");
        }

        var sale = await LoadSaleForUpdateAsync(id);
        EnsureNotVoided(sale);
        if (sale.Balance <= 0)
        {
            throw new CustomException("This sale has no outstanding balance.");
        }
        if (amount > sale.Balance)
        {
            throw new CustomException("Payment cannot exceed the current balance.");
        }

        var userId = GetCurrentUserId();
        var balanceBefore = sale.Balance;
        sale.PaidAmount = decimal.Round(sale.PaidAmount + amount, 2, MidpointRounding.AwayFromZero);
        sale.Balance = decimal.Round(balanceBefore - amount, 2, MidpointRounding.AwayFromZero);
        Touch(sale, userId);

        _dbContext.SalePayments.Add(new SalePaymentEntity
        {
            SaleId = sale.Id,
            Amount = amount,
            BalanceBefore = balanceBefore,
            BalanceAfter = sale.Balance,
            MainTenantId = sale.MainTenantId,
            CreatedById = userId,
            UpdatedById = userId,
        });

        await SaveSaleChangesAsync();
        return await BuildDetailAsync(sale);
    }

    private async Task<SaleEntity> LoadSaleForUpdateAsync(Guid id)
    {
        return await GetTenantSales()
            .Include(item => item.Items)
            .Include(item => item.Payments)
            .SingleOrDefaultAsync(item => item.Id == id)
            ?? throw new CustomException("Sale not found.");
    }

    private static void EnsureNotVoided(SaleEntity sale)
    {
        if (sale.Status == SaleStatus.Voided)
        {
            throw new CustomException("This sale has been voided.");
        }
    }

    private static void Touch(SaleEntity sale, Guid userId)
    {
        sale.RowVersion = Guid.NewGuid();
        sale.UpdatedAtUtc = DateTime.UtcNow;
        sale.UpdatedById = userId;
    }

    private async Task SaveSaleChangesAsync()
    {
        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException("This sale was modified by someone else. Refresh and try again.");
        }
    }

    private async Task<SaleDto> BuildDetailAsync(SaleEntity sale)
    {
        var dto = MapToDto(sale);

        var userNames = await ResolveUserNamesAsync(
            new Guid?[] { sale.CreatedById, sale.UpdatedById, sale.VoidedById }
                .Concat(sale.Payments.Select(payment => (Guid?)payment.CreatedById)));
        string? NameOf(Guid? userId) => userId.HasValue && userNames.TryGetValue(userId.Value, out var name) ? name : null;

        dto.CreatedByName = NameOf(sale.CreatedById);
        dto.UpdatedByName = NameOf(sale.UpdatedById);
        dto.VoidedByName = NameOf(sale.VoidedById);
        dto.Payments = sale.Payments
            .OrderBy(payment => payment.CreatedAtUtc)
            .Select(payment => new SalePaymentDto
            {
                Id = payment.Id,
                Amount = payment.Amount,
                BalanceBefore = payment.BalanceBefore,
                BalanceAfter = payment.BalanceAfter,
                PaidAt = ToUtcOffset(payment.CreatedAtUtc),
                ReceivedByName = NameOf(payment.CreatedById),
            })
            .ToList();

        await AttachProductImagesAsync(dto);
        return dto;
    }

    private async Task<Dictionary<Guid, string>> ResolveUserNamesAsync(IEnumerable<Guid?> userIds)
    {
        var ids = userIds.Where(id => id.HasValue && id.Value != Guid.Empty).Select(id => id!.Value).Distinct().ToList();
        var names = new Dictionary<Guid, string>();
        if (ids.Count == 0) return names;

        var users = await _dbContext.Users.AsNoTracking()
            .Where(user => ids.Contains(user.Id))
            .Select(user => new { user.Id, user.DisplayName })
            .ToListAsync();
        foreach (var user in users) names[user.Id] = user.DisplayName;

        var missing = ids.Where(id => !names.ContainsKey(id)).ToList();
        if (missing.Count > 0)
        {
            var admins = await _dbContext.AdminUsers.AsNoTracking()
                .Where(admin => missing.Contains(admin.Id))
                .Select(admin => new { admin.Id, admin.UserName })
                .ToListAsync();
            foreach (var admin in admins) names[admin.Id] = admin.UserName;
        }

        return names;
    }

    private static DateTimeOffset ToUtcOffset(DateTime value)
    {
        return new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc));
    }

    private async Task AttachProductImagesAsync(SaleDto sale)
    {
        var productIds = sale.Items.Select(item => item.ProductId).Distinct().ToList();
        if (productIds.Count == 0) return;

        var covers = await _dbContext.Products.AsNoTracking()
            .Where(product => productIds.Contains(product.Id))
            .Select(product => new { product.Id, product.CoverImageUrl })
            .ToDictionaryAsync(product => product.Id, product => product.CoverImageUrl);

        foreach (var item in sale.Items)
        {
            if (covers.TryGetValue(item.ProductId, out var cover) && !string.IsNullOrWhiteSpace(cover))
            {
                item.ProductImageUrl = _storageService.BuildObjectUrl(cover);
            }
        }
    }

    private IQueryable<SaleEntity> FilterByCurrentShop(IQueryable<SaleEntity> query)
    {
        return _currentUserService.ShopId is { } shopId ? query.Where(sale => sale.ShopId == shopId) : query;
    }

    private IQueryable<SaleEntity> GetTenantSales()
    {
        var query = _dbContext.Sales.AsQueryable();
        if (_currentUserService.IsAdmin) return query;
        return query.Where(sale => sale.MainTenantId == GetCurrentTenantId());
    }

    private IQueryable<ProductEntity> GetTenantProducts()
    {
        var query = _dbContext.Products.AsQueryable();
        if (_currentUserService.IsAdmin) return query;
        return query.Where(product => product.MainTenantId == GetCurrentTenantId());
    }

    private IQueryable<CustomerEntity> GetTenantCustomers()
    {
        var query = _dbContext.Customers.AsQueryable();
        if (_currentUserService.IsAdmin) return query;
        return query.Where(customer => customer.MainTenantId == GetCurrentTenantId());
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

    private static SaleDto MapToDto(SaleEntity sale)
    {
        return new SaleDto
        {
            Id = sale.Id,
            CustomerId = sale.CustomerId,
            CustomerName = sale.CustomerName,
            SaleDate = new DateTimeOffset(DateTime.SpecifyKind(sale.SaleDate, DateTimeKind.Utc)),
            TotalProducts = sale.TotalProducts,
            SubTotal = sale.SubTotal,
            TaxRate = sale.TaxRate,
            Tax = sale.Tax,
            Discount = sale.Discount,
            NetTotal = sale.NetTotal,
            PaidAmount = sale.PaidAmount,
            Balance = sale.Balance,
            Status = sale.Status,
            VoidReason = sale.VoidReason,
            VoidedAt = sale.VoidedAtUtc.HasValue ? ToUtcOffset(sale.VoidedAtUtc.Value) : null,
            CreatedAt = ToUtcOffset(sale.CreatedAtUtc),
            UpdatedAt = ToUtcOffset(sale.UpdatedAtUtc),
            Items = sale.Items.Select(line => new SaleItemDto
            {
                ProductId = line.ProductId,
                ProductName = line.ProductName,
                Unit = line.Unit,
                Quantity = line.Quantity,
                UnitPrice = line.UnitPrice,
                TaxRate = line.TaxRate,
                TaxTotal = line.TaxTotal,
                LineTotal = line.LineTotal,
            }).ToList(),
        };
    }
}