using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Units;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Mappings;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface IUnitService
{
    Task<PaginatedResultDto<UnitDto>> GetUnitsAsync(int page, int pageSize, string? unit = null);
    Task<UnitDto?> GetUnitByIdAsync(Guid id);
    Task<UnitDto> CreateUnitAsync(CreateUnitRequestDto request, Guid currentUserId);
    Task<UnitDto?> UpdateUnitAsync(Guid id, UpdateUnitRequestDto request, Guid currentUserId);
    Task<bool> DeleteUnitAsync(Guid id);
}

public class UnitService : IUnitService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<UnitService> _logger;

    public UnitService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<UnitService> logger)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<UnitDto>> GetUnitsAsync(int page, int pageSize, string? unit = null)
    {
        _logger.LogDebug("CALLED: GetUnitsAsync(page={Page}, pageSize={PageSize}, unit={Unit})", page, pageSize, unit ?? "null");
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Units.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(unit))
        {
            query = query.Where(u => u.Unit.ToLower().Contains(unit, StringComparison.OrdinalIgnoreCase));
        }

        query = query.OrderBy(u => u.Unit);
        var total = await query.CountAsync();

        var units = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var unitDtos = units.MapToDtoList();
        return new PaginatedResultDto<UnitDto>(unitDtos, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<UnitDto?> GetUnitByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetUnitByIdAsync(id={Id})", id);
        var unit = await _dbContext.Units.AsNoTracking().SingleOrDefaultAsync(u => u.Id == id);
        return unit?.MapToDto();
    }

    public async Task<UnitDto> CreateUnitAsync(CreateUnitRequestDto request, Guid currentUserId)
    {
        _logger.LogDebug("CALLED: CreateUnitAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "Unit", request.Unit);
        ValidationHelper.ValidateNull(_localizer, "IsActive", request.IsActive);

        var normalizedUnit = request.Unit!.Trim();
        var unitExists = await _dbContext.Units.AnyAsync(u => u.Unit.ToLower() == normalizedUnit.ToLower());
        if (unitExists)
        {
            throw new CustomException("A unit with this name already exists.");
        }

        var unit = new UnitEntity
        {
            Unit = normalizedUnit,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };

        _dbContext.Units.Add(unit);
        await _dbContext.SaveChangesAsync();

        return unit.MapToDto();
    }

    public async Task<UnitDto?> UpdateUnitAsync(Guid id, UpdateUnitRequestDto request, Guid currentUserId)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateUnitAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredString(_localizer, "Unit", request.Unit);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);
            ValidationHelper.ValidateNull(_localizer, "IsActive", request.IsActive);

            var unit = await _dbContext.Units.SingleOrDefaultAsync(u => u.Id == id) ?? throw new CustomException("Unit not found.");

            var normalizedUnit = request.Unit!;
            var unitExists = await _dbContext.Units.AnyAsync(u => u.Id != id && u.Unit.ToLower() == normalizedUnit.ToLower());
            if (unitExists)
            {
                throw new CustomException("A unit with this name already exists.");
            }

            unit.Unit = normalizedUnit;
            unit.IsActive = request.IsActive ?? unit.IsActive;
            _dbContext.Entry(unit).Property(u => u.RowVersion).OriginalValue = request.RowVersion;
            unit.UpdatedAtUtc = DateTime.UtcNow;
            unit.UpdatedById = currentUserId;
            await _dbContext.SaveChangesAsync();

            return unit.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task<bool> DeleteUnitAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteUnitAsync(id={Id})", id);
        var unit = await _dbContext.Units.SingleOrDefaultAsync(u => u.Id == id) ?? throw new CustomException("Unit not found.");
        _dbContext.Units.Remove(unit);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
