using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Shops;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Mappings;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface IShopService
{
    Task<PaginatedResultDto<ShopDto>> GetShopsAsync(int page, int pageSize, string? name = null);
    Task<ShopDto?> GetShopByIdAsync(Guid id);
    Task<ShopDto> CreateShopAsync(CreateShopRequestDto request);
    Task<ShopDto?> UpdateShopAsync(Guid id, UpdateShopRequestDto request);
    Task DeleteShopAsync(Guid id);
}

public class ShopService : IShopService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<ShopService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public ShopService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<ShopService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<ShopDto>> GetShopsAsync(int page, int pageSize, string? name = null)
    {
        _logger.LogDebug("CALLED: GetShopsAsync(page={Page}, pageSize={PageSize}, name={Name})", page, pageSize, name ?? "null");
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = GetTenantShops().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(name))
        {
            var term = name.Trim();
            query = query.Where(shop => shop.Name.Contains(term));
        }

        query = query.OrderBy(shop => shop.Name);
        var total = await query.CountAsync();
        var shops = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResultDto<ShopDto>(
            shops.Select(shop => shop.MapToDto()).ToList(),
            page,
            pageSize,
            total,
            PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<ShopDto?> GetShopByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetShopByIdAsync(id={Id})", id);
        var shop = await GetTenantShops().AsNoTracking().SingleOrDefaultAsync(item => item.Id == id);
        return shop?.MapToDto();
    }

    public async Task<ShopDto> CreateShopAsync(CreateShopRequestDto request)
    {
        _logger.LogDebug("CALLED: CreateShopAsync(name={Name})", request.Name);
        ValidationHelper.ValidateRequiredString(_localizer, "Name", request.Name);
        var email = NormalizeOptional(request.Email);
        if (email is not null)
        {
            ValidationHelper.ValidateEmail(_localizer, "Email", email);
        }

        var tenantId = GetCurrentTenantId();
        var userId = GetCurrentUserId();
        var name = request.Name!.Trim();
        if (await GetTenantShops().AnyAsync(shop => shop.Name.ToLower() == name.ToLower()))
        {
            throw new CustomException("A shop with this name already exists.");
        }

        var shop = new ShopEntity
        {
            Name = name,
            Address = NormalizeOptional(request.Address),
            City = NormalizeOptional(request.City),
            StateDivision = NormalizeOptional(request.StateDivision),
            Country = NormalizeOptional(request.Country),
            PostalCode = NormalizeOptional(request.PostalCode),
            Phone = NormalizeOptional(request.Phone),
            Email = email,
            MainTenantId = tenantId,
            CreatedById = userId,
            UpdatedById = userId,
        };

        _dbContext.Shops.Add(shop);
        await _dbContext.SaveChangesAsync();
        return shop.MapToDto();
    }

    public async Task<ShopDto?> UpdateShopAsync(Guid id, UpdateShopRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateShopAsync(id={Id})", id);
            ValidationHelper.ValidateRequiredString(_localizer, "Name", request.Name);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);
            var email = NormalizeOptional(request.Email);
            if (email is not null)
            {
                ValidationHelper.ValidateEmail(_localizer, "Email", email);
            }

            var shop = await GetTenantShops().SingleOrDefaultAsync(item => item.Id == id)
                ?? throw new CustomException("Shop not found.");

            var name = request.Name!.Trim();
            if (await GetTenantShops().AnyAsync(item => item.Id != id && item.Name.ToLower() == name.ToLower()))
            {
                throw new CustomException("A shop with this name already exists.");
            }

            shop.Name = name;
            shop.Address = NormalizeOptional(request.Address);
            shop.City = NormalizeOptional(request.City);
            shop.StateDivision = NormalizeOptional(request.StateDivision);
            shop.Country = NormalizeOptional(request.Country);
            shop.PostalCode = NormalizeOptional(request.PostalCode);
            shop.Phone = NormalizeOptional(request.Phone);
            shop.Email = email;
            _dbContext.Entry(shop).Property(item => item.RowVersion).OriginalValue = request.RowVersion;
            shop.RowVersion = Guid.NewGuid();
            shop.UpdatedAtUtc = DateTime.UtcNow;
            shop.UpdatedById = GetCurrentUserId();
            await _dbContext.SaveChangesAsync();

            return shop.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task DeleteShopAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteShopAsync(id={Id})", id);
        var shop = await GetTenantShops().SingleOrDefaultAsync(item => item.Id == id)
            ?? throw new CustomException("Shop not found.");
        _dbContext.Shops.Remove(shop);
        await _dbContext.SaveChangesAsync();
    }

    private IQueryable<ShopEntity> GetTenantShops()
    {
        var query = _dbContext.Shops.AsQueryable();
        if (_currentUserService.IsAdmin) return query;
        var tenantId = GetCurrentTenantId();
        return query.Where(shop => shop.MainTenantId == tenantId);
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

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
