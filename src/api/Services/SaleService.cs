using Microsoft.EntityFrameworkCore;
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
}

public class SaleService : ISaleService
{
    private const string WalkInCustomerName = "Walk-in Customer";
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public SaleService(AppDbContext dbContext, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<SaleDashboardDto> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var todayStart = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);
        var tomorrowStart = todayStart.AddDays(1);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var sales = GetTenantSales().AsNoTracking();

        return new SaleDashboardDto
        {
            TodaySales = await sales
                .Where(sale => sale.SaleDate >= todayStart && sale.SaleDate < tomorrowStart)
                .SumAsync(sale => (decimal?)sale.NetTotal) ?? 0m,
            ThisMonthSales = await sales
                .Where(sale => sale.SaleDate >= monthStart && sale.SaleDate < tomorrowStart)
                .SumAsync(sale => (decimal?)sale.NetTotal) ?? 0m,
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
                    Tax = sale.Tax,
                    NetTotal = sale.NetTotal,
                })
                .ToListAsync(),
        };
    }

    public async Task<PaginatedResultDto<SaleDto>> GetSalesAsync(int page, int pageSize)
    {
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);
        var query = GetTenantSales().AsNoTracking();
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
                Tax = sale.Tax,
                NetTotal = sale.NetTotal,
            })
            .ToListAsync();

        return new PaginatedResultDto<SaleDto>(sales, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<SaleDto?> GetSaleByIdAsync(Guid id)
    {
        var sale = await GetTenantSales().AsNoTracking().SingleOrDefaultAsync(item => item.Id == id);
        return sale is null ? null : MapToDto(sale);
    }

    public async Task<SaleDto> CreateSaleAsync(CreateSaleRequestDto request)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            throw new CustomException("At least one product is required.");
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
        foreach (var requestItem in request.Items)
        {
            var product = products[requestItem.ProductId];
            if (product.CurrentStock < requestItem.Quantity)
            {
                throw new CustomException($"Insufficient stock for {product.Name}. Available: {product.CurrentStock}.");
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

            product.CurrentStock -= requestItem.Quantity;
            product.RowVersion = Guid.NewGuid();
            product.UpdatedAtUtc = DateTime.UtcNow;
            product.UpdatedById = userId;
        }

        var subTotal = decimal.Round(lines.Sum(line => line.LineTotal), 2, MidpointRounding.AwayFromZero);
        var tax = decimal.Round(lines.Sum(line => line.TaxTotal), 2, MidpointRounding.AwayFromZero);
        var sale = new SaleEntity
        {
            CustomerId = request.CustomerId,
            CustomerName = customerName,
            SaleDate = DateTime.UtcNow,
            TotalProducts = lines.Sum(line => line.Quantity),
            SubTotal = subTotal,
            Tax = tax,
            NetTotal = decimal.Round(subTotal + tax, 2, MidpointRounding.AwayFromZero),
            Items = lines,
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

        return MapToDto(sale);
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
            Tax = sale.Tax,
            NetTotal = sale.NetTotal,
        };
    }
}