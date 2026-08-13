using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Brands;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Mappings;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface IBrandService
{
    Task<PaginatedResultDto<BrandDto>> GetBrandsAsync(GetBrandsRequestDto request);
    Task<BrandDto?> GetBrandByIdAsync(Guid id);
    Task<BrandDto> CreateBrandAsync(CreateBrandRequestDto request);
    Task<BrandDto?> UpdateBrandAsync(Guid id, UpdateBrandRequestDto request);
    Task DeleteBrandAsync(Guid id);
}

public class BrandService : IBrandService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<BrandService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public BrandService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<BrandService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<BrandDto>> GetBrandsAsync(GetBrandsRequestDto request)
    {
        _logger.LogDebug("CALLED: GetBrandsAsync(request={Request})", request);
        var page = PaginationHelper.NormalizePage(request.Page);
        var pageSize = PaginationHelper.NormalizePageSize(request.PageSize);

        var query = _dbContext.Brands.AsNoTracking();

        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }

        if (!string.IsNullOrWhiteSpace(request.Brand))
        {
            query = query.Where(b => b.Brand.ToLower().Contains(request.Brand.ToLower()));
        }

        query = query.OrderBy(b => b.Brand);
        var total = await query.CountAsync();
        var brands = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        var brandDtos = brands.MapToDtoList();
        return new PaginatedResultDto<BrandDto>(brandDtos, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<BrandDto?> GetBrandByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetBrandByIdAsync(id={Id})", id);

        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
        }

        var query = _dbContext.Brands.AsNoTracking().Where(b => b.Id == id);

        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }

        var brand = await query.SingleOrDefaultAsync();
        return brand?.MapToDto();
    }

    public async Task<BrandDto> CreateBrandAsync(CreateBrandRequestDto request)
    {
        _logger.LogDebug("CALLED: CreateBrandAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "Brand", request.Brand);
        ValidationHelper.ValidateNull(_localizer, "IsActive", request.IsActive);

        var normalizedBrand = request.Brand!.Trim();
        var brandExists = await _dbContext.Brands.AnyAsync(b => b.Brand.ToLower() == normalizedBrand.ToLower());
        if (brandExists)
        {
            throw new CustomException("A brand with this name already exists.");
        }

        var brand = new BrandEntity
        {
            Brand = normalizedBrand,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            MainTenantId = Guid.Parse(_currentUserService.TenantId!)
        };

        _dbContext.Brands.Add(brand);
        await _dbContext.SaveChangesAsync();

        return brand.MapToDto();
    }

    public async Task<BrandDto?> UpdateBrandAsync(Guid id, UpdateBrandRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateBrandAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredString(_localizer, "Brand", request.Brand);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);
            ValidationHelper.ValidateNull(_localizer, "IsActive", request.IsActive);

            var brand = await _dbContext.Brands
            .SingleOrDefaultAsync(b => b.Id == id && b.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Brand not found.");

            var normalizedBrand = request.Brand!;
            var brandExists = await _dbContext.Brands.AnyAsync(b => b.Id != id && b.Brand.ToLower() == normalizedBrand.ToLower());
            if (brandExists)
            {
                throw new CustomException("A brand with this name already exists.");
            }

            brand.Brand = normalizedBrand;
            brand.IsActive = request.IsActive ?? brand.IsActive;
            _dbContext.Entry(brand).Property(b => b.RowVersion).OriginalValue = request.RowVersion;
            brand.UpdatedAtUtc = DateTime.UtcNow;
            brand.UpdatedById = Guid.Parse(_currentUserService.UserId!);
            await _dbContext.SaveChangesAsync();

            return brand.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task DeleteBrandAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteBrandAsync(id={Id})", id);
        var brand = await _dbContext.Brands.SingleOrDefaultAsync(b => b.Id == id && b.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Brand not found.");
        _dbContext.Brands.Remove(brand);
        await _dbContext.SaveChangesAsync();
    }
}
