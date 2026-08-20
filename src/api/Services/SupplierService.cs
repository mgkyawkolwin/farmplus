using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Suppliers;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Mappings;
using FarmPlus.Api.Utilities;
using FarmPlus.Api.Models;
using Microsoft.Extensions.Options;

namespace FarmPlus.Api.Services;

public interface ISupplierService
{
    Task<PaginatedResultDto<SupplierDto>> GetSuppliersAsync(int page, int pageSize, string? supplierName = null);
    Task<SupplierDto?> GetSupplierByIdAsync(Guid id);
    Task<SupplierDto> CreateSupplierAsync(CreateSupplierRequestDto request);
    Task<SupplierDto?> UpdateSupplierAsync(Guid id, UpdateSupplierRequestDto request);
    Task<SupplierDto?> UploadSupplierLogoAsync(Guid id, IFormFile file);
    Task DeleteSupplierAsync(Guid id);
}

public class SupplierService : ISupplierService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<SupplierService> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStorageService _storageService;

    public SupplierService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<SupplierService> logger, ICurrentUserService currentUserService, IStorageService storageService)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
        _storageService = storageService;
    }

    public async Task<PaginatedResultDto<SupplierDto>> GetSuppliersAsync(int page, int pageSize, string? supplierName = null)
    {
        _logger.LogDebug("CALLED: GetSuppliersAsync(page={Page}, pageSize={PageSize}, supplierName={SupplierName})", page, pageSize, supplierName ?? "null");
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Suppliers.AsNoTracking();
        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }

        if (!string.IsNullOrWhiteSpace(supplierName))
        {
            query = query.Where(s => s.SupplierName.ToLower().Contains(supplierName, StringComparison.OrdinalIgnoreCase));
        }

        query = query.OrderBy(s => s.SupplierName);
        var total = await query.CountAsync();

        var suppliers = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var supplierDtos = await Task.WhenAll(suppliers.Select(MapSupplierToDtoAsync));
        return new PaginatedResultDto<SupplierDto>(supplierDtos.ToList(), page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<SupplierDto?> GetSupplierByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetSupplierByIdAsync(id={Id})", id);
        var query = _dbContext.Suppliers.AsNoTracking();
        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }
        var supplier = await query.SingleOrDefaultAsync(s => s.Id == id);
        return supplier == null ? null : await MapSupplierToDtoAsync(supplier);
    }

    public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierRequestDto request)
    {
        _logger.LogDebug("CALLED: CreateSupplierAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "SupplierName", request.SupplierName);
        ValidationHelper.ValidateNull(_localizer, "IsActive", request.IsActive);

        var normalizedName = request.SupplierName!.Trim();
        var supplierExists = await _dbContext.Suppliers.AnyAsync(s => s.SupplierName.ToLower() == normalizedName.ToLower() && s.MainTenantId == Guid.Parse(_currentUserService.TenantId!));
        if (supplierExists)
        {
            throw new CustomException("A supplier with this name already exists.");
        }

        var supplier = new SupplierEntity
        {
            SupplierName = normalizedName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            StateDivision = request.StateDivision,
            City = request.City,
            Country = request.Country,
            LogoUrl = request.LogoUrl,
            IsActive = request.IsActive ?? false,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            MainTenantId = Guid.Parse(_currentUserService.TenantId!)
        };

        _dbContext.Suppliers.Add(supplier);
        await _dbContext.SaveChangesAsync();

        return await MapSupplierToDtoAsync(supplier);
    }

    public async Task<SupplierDto?> UpdateSupplierAsync(Guid id, UpdateSupplierRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateSupplierAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredString(_localizer, "SupplierName", request.SupplierName);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);
            ValidationHelper.ValidateNull(_localizer, "IsRequired", request.IsActive);

            var supplier = await _dbContext.Suppliers.SingleOrDefaultAsync(s => s.Id == id && s.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Supplier not found.");

            var normalizedName = request.SupplierName!;
            var supplierExists = await _dbContext.Suppliers.AnyAsync(s => s.Id != id && s.SupplierName.ToLower() == normalizedName.ToLower() && s.MainTenantId == Guid.Parse(_currentUserService.TenantId!));
            if (supplierExists)
            {
                throw new CustomException("A supplier with this name already exists.");
            }

            supplier.SupplierName = normalizedName;
            supplier.Email = request.Email;
            supplier.PhoneNumber = request.PhoneNumber;
            supplier.Address = request.Address;
            supplier.StateDivision = request.StateDivision;
            supplier.City = request.City;
            supplier.Country = request.Country;
            supplier.LogoUrl = request.LogoUrl;
            supplier.IsActive = request.IsActive ?? supplier.IsActive;
            _dbContext.Entry(supplier).Property(s => s.RowVersion).OriginalValue = request.RowVersion;
            supplier.UpdatedAtUtc = DateTime.UtcNow;
            supplier.UpdatedById = Guid.Parse(_currentUserService.UserId!);
            await _dbContext.SaveChangesAsync();

            return await MapSupplierToDtoAsync(supplier);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task<SupplierDto?> UploadSupplierLogoAsync(Guid id, IFormFile file)
    {
        _logger.LogDebug("CALLED: UploadSupplierLogoAsync(id={Id}, file={FileName})", id, file?.FileName);
        if (file == null || file.Length == 0)
        {
            throw new CustomException(_localizer[$"Template.Required", "logo file"]);
        }

        var supplier = await _dbContext.Suppliers.SingleOrDefaultAsync(s => s.Id == id && s.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Supplier not found.");

        var objectName = await _storageService.UploadFileAsync(file);
        supplier.LogoUrl = objectName;
        supplier.UpdatedAtUtc = DateTime.UtcNow;
        supplier.UpdatedById = Guid.Parse(_currentUserService.UserId!);
        await _dbContext.SaveChangesAsync();

        return await MapSupplierToDtoAsync(supplier);
    }

    private async Task<SupplierDto> MapSupplierToDtoAsync(SupplierEntity entity)
    {
        var dto = entity.MapToDto();
        if (!string.IsNullOrWhiteSpace(dto.LogoUrl) && !Uri.IsWellFormedUriString(dto.LogoUrl, UriKind.Absolute))
        {
            dto.LogoUrl = _storageService.BuildObjectUrl(dto.LogoUrl);
        }

        return dto;
    }

    public async Task DeleteSupplierAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteSupplierAsync(id={Id})", id);
        var supplier = await _dbContext.Suppliers.SingleOrDefaultAsync(s => s.Id == id && s.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Supplier not found.");
        _dbContext.Suppliers.Remove(supplier);
        await _dbContext.SaveChangesAsync();
    }
}
