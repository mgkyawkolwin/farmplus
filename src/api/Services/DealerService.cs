using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Dealers;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Mappings;
using FarmPlus.Api.Utilities;
using FarmPlus.Api.Models;
using Microsoft.Extensions.Options;

namespace FarmPlus.Api.Services;

public interface IDealerService
{
    Task<PaginatedResultDto<DealerDto>> GetDealersAsync(int page, int pageSize, string? dealerName = null);
    Task<DealerDto?> GetDealerByIdAsync(Guid id);
    Task<DealerDto> CreateDealerAsync(CreateDealerRequestDto request);
    Task<DealerDto?> UpdateDealerAsync(Guid id, UpdateDealerRequestDto request);
    Task<DealerDto?> UploadDealerLogoAsync(Guid id, IFormFile file);
    Task DeleteDealerAsync(Guid id);
}

public class DealerService : IDealerService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<DealerService> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStorageService _storageService;

    public DealerService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<DealerService> logger, ICurrentUserService currentUserService, IStorageService storageService)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
        _storageService = storageService;
    }

    public async Task<PaginatedResultDto<DealerDto>> GetDealersAsync(int page, int pageSize, string? dealerName = null)
    {
        _logger.LogDebug("CALLED: GetDealersAsync(page={Page}, pageSize={PageSize}, dealerName={DealerName})", page, pageSize, dealerName ?? "null");
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Dealers.AsNoTracking();
        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }

        if (!string.IsNullOrWhiteSpace(dealerName))
        {
            query = query.Where(d => d.DealerName.ToLower().Contains(dealerName, StringComparison.OrdinalIgnoreCase));
        }

        query = query.OrderBy(d => d.DealerName);
        var total = await query.CountAsync();

        var dealers = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dealerDtos = await Task.WhenAll(dealers.Select(MapDealerToDtoAsync));
        return new PaginatedResultDto<DealerDto>(dealerDtos.ToList(), page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<DealerDto?> GetDealerByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetDealerByIdAsync(id={Id})", id);
        var query = _dbContext.Dealers.AsNoTracking();
        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }
        var dealer = await query.SingleOrDefaultAsync(d => d.Id == id);
        return dealer == null ? null : await MapDealerToDtoAsync(dealer);
    }

    public async Task<DealerDto> CreateDealerAsync(CreateDealerRequestDto request)
    {
        _logger.LogDebug("CALLED: CreateDealerAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "DealerName", request.DealerName);
        ValidationHelper.ValidateNull(_localizer, "IsRequired", request.IsActive);

        var normalizedName = request.DealerName!.Trim();
        var dealerExists = await _dbContext.Dealers.AnyAsync(d => d.DealerName.ToLower() == normalizedName.ToLower() && d.MainTenantId == Guid.Parse(_currentUserService.TenantId!));
        if (dealerExists)
        {
            throw new CustomException("A dealer with this name already exists.");
        }

        var dealer = new DealerEntity
        {
            DealerName = normalizedName,
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
            MainTenantId = Guid.Parse(_currentUserService.TenantId!),
        };

        _dbContext.Dealers.Add(dealer);
        await _dbContext.SaveChangesAsync();

        return await MapDealerToDtoAsync(dealer);
    }

    public async Task<DealerDto?> UpdateDealerAsync(Guid id, UpdateDealerRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateDealerAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredString(_localizer, "DealerName", request.DealerName);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);
            ValidationHelper.ValidateNull(_localizer, "IsRequired", request.IsActive);

            var dealer = await _dbContext.Dealers.SingleOrDefaultAsync(d => d.Id == id && d.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Dealer not found.");

            var normalizedName = request.DealerName!;
            var dealerExists = await _dbContext.Dealers.AnyAsync(d => d.Id != id && d.DealerName.ToLower() == normalizedName.ToLower() && d.MainTenantId == Guid.Parse(_currentUserService.TenantId!));
            if (dealerExists)
            {
                throw new CustomException("A dealer with this name already exists.");
            }

            dealer.DealerName = normalizedName;
            dealer.Email = request.Email;
            dealer.PhoneNumber = request.PhoneNumber;
            dealer.Address = request.Address;
            dealer.StateDivision = request.StateDivision;
            dealer.City = request.City;
            dealer.Country = request.Country;
            if (request.ClearLogoUrl == true)
            {
                dealer.LogoUrl = null;
            }
            else if (request.LogoUrl != null && !Uri.IsWellFormedUriString(request.LogoUrl, UriKind.Absolute))
            {
                dealer.LogoUrl = request.LogoUrl;
            }
            dealer.IsActive = request.IsActive ?? dealer.IsActive;
            _dbContext.Entry(dealer).Property(d => d.RowVersion).OriginalValue = request.RowVersion;
            dealer.UpdatedAtUtc = DateTime.UtcNow;
            dealer.UpdatedById = Guid.Parse(_currentUserService.UserId!);
            await _dbContext.SaveChangesAsync();

            return dealer.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    private async Task<DealerDto> MapDealerToDtoAsync(DealerEntity entity)
    {
        var dto = entity.MapToDto();
        if (!string.IsNullOrWhiteSpace(dto.LogoUrl) && !Uri.IsWellFormedUriString(dto.LogoUrl, UriKind.Absolute))
        {
            dto.LogoUrl = _storageService.BuildObjectUrl(dto.LogoUrl);
        }

        return dto;
    }

    public async Task<DealerDto?> UploadDealerLogoAsync(Guid id, IFormFile file)
    {
        _logger.LogDebug("CALLED: UploadDealerLogoAsync(id={Id}, file={FileName})", id, file?.FileName);
        if (file == null || file.Length == 0)
        {
            throw new CustomException(_localizer[$"Template.Required", "logo file"]);
        }

        var dealer = await _dbContext.Dealers.SingleOrDefaultAsync(d => d.Id == id && d.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Dealer not found.");

        var objectName = await _storageService.UploadFileAsync(file);
        dealer.LogoUrl = objectName;
        dealer.UpdatedAtUtc = DateTime.UtcNow;
        dealer.UpdatedById = Guid.Parse(_currentUserService.UserId!);
        await _dbContext.SaveChangesAsync();

        return await MapDealerToDtoAsync(dealer);
    }

    public async Task DeleteDealerAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteDealerAsync(id={Id})", id);
        var dealer = await _dbContext.Dealers.SingleOrDefaultAsync(d => d.Id == id && d.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Dealer not found.");
        _dbContext.Dealers.Remove(dealer);
        await _dbContext.SaveChangesAsync();
    }
}
