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

namespace FarmPlus.Api.Services;

public interface ISupplierService
{
    Task<PaginatedResultDto<SupplierDto>> GetSuppliersAsync(int page, int pageSize, string? supplierName = null);
    Task<SupplierDto?> GetSupplierByIdAsync(Guid id);
    Task<SupplierDto> CreateSupplierAsync(CreateSupplierRequestDto request, Guid currentUserId);
    Task<SupplierDto?> UpdateSupplierAsync(Guid id, UpdateSupplierRequestDto request, Guid currentUserId);
    Task<bool> DeleteSupplierAsync(Guid id);
}

public class SupplierService : ISupplierService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<SupplierService> _logger;

    public SupplierService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<SupplierService> logger)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<SupplierDto>> GetSuppliersAsync(int page, int pageSize, string? supplierName = null)
    {
        _logger.LogDebug("CALLED: GetSuppliersAsync(page={Page}, pageSize={PageSize}, supplierName={SupplierName})", page, pageSize, supplierName ?? "null");
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Suppliers.AsNoTracking();

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

        var supplierDtos = suppliers.MapToDtoList();
        return new PaginatedResultDto<SupplierDto>(supplierDtos, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<SupplierDto?> GetSupplierByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetSupplierByIdAsync(id={Id})", id);
        var supplier = await _dbContext.Suppliers.AsNoTracking().SingleOrDefaultAsync(s => s.Id == id);
        return supplier?.MapToDto();
    }

    public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierRequestDto request, Guid currentUserId)
    {
        _logger.LogDebug("CALLED: CreateSupplierAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "SupplierName", request.SupplierName);
        ValidationHelper.ValidateNull(_localizer, "IsRequired", request.IsRequired);

        var normalizedName = request.SupplierName!.Trim();
        var supplierExists = await _dbContext.Suppliers.AnyAsync(s => s.SupplierName.ToLower() == normalizedName.ToLower());
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
            IsRequired = request.IsRequired ?? false,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };

        _dbContext.Suppliers.Add(supplier);
        await _dbContext.SaveChangesAsync();

        return supplier.MapToDto();
    }

    public async Task<SupplierDto?> UpdateSupplierAsync(Guid id, UpdateSupplierRequestDto request, Guid currentUserId)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateSupplierAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredString(_localizer, "SupplierName", request.SupplierName);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);
            ValidationHelper.ValidateNull(_localizer, "IsRequired", request.IsRequired);

            var supplier = await _dbContext.Suppliers.SingleOrDefaultAsync(s => s.Id == id) ?? throw new CustomException("Supplier not found.");

            var normalizedName = request.SupplierName!;
            var supplierExists = await _dbContext.Suppliers.AnyAsync(s => s.Id != id && s.SupplierName.ToLower() == normalizedName.ToLower());
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
            supplier.IsRequired = request.IsRequired ?? supplier.IsRequired;
            _dbContext.Entry(supplier).Property(s => s.RowVersion).OriginalValue = request.RowVersion;
            supplier.UpdatedAtUtc = DateTime.UtcNow;
            supplier.UpdatedById = currentUserId;
            await _dbContext.SaveChangesAsync();

            return supplier.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task<bool> DeleteSupplierAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteSupplierAsync(id={Id})", id);
        var supplier = await _dbContext.Suppliers.SingleOrDefaultAsync(s => s.Id == id) ?? throw new CustomException("Supplier not found.");
        _dbContext.Suppliers.Remove(supplier);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
