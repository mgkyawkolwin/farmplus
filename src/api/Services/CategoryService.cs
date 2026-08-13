using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Categories;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Mappings;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface ICategoryService
{
    Task<PaginatedResultDto<CategoryDto>> GetCategoriesAsync(int page, int pageSize, string? category = null);
    Task<CategoryDto?> GetCategoryByIdAsync(Guid id);
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequestDto request);
    Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryRequestDto request);
    Task DeleteCategoryAsync(Guid id);
}

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<CategoryService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public CategoryService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<CategoryService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<CategoryDto>> GetCategoriesAsync(int page, int pageSize, string? category = null)
    {
        _logger.LogDebug("CALLED: GetCategoriesAsync(page={Page}, pageSize={PageSize}, category={Category})", page, pageSize, category ?? "null");
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);
        
        var query = _dbContext.Categories.AsNoTracking();
        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(c => c.Category.ToLower().Contains(category, StringComparison.OrdinalIgnoreCase));
        }

        query = query.OrderBy(c => c.Category);
        var total = await query.CountAsync();

        var categories = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var categoryDtos = categories.MapToDtoList();
        return new PaginatedResultDto<CategoryDto>(categoryDtos, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetCategoryByIdAsync(id={Id})", id);
        var query = _dbContext.Categories.AsNoTracking();
        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }

        var category = await query.SingleOrDefaultAsync(c => c.Id == id);
        return category?.MapToDto();
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequestDto request)
    {
        _logger.LogDebug("CALLED: CreateCategoryAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "Category", request.Category);
        ValidationHelper.ValidateNull(_localizer, "IsActive", request.IsActive);

        var normalizedCategory = request.Category.Trim();
        var categoryExists = await _dbContext.Categories.AnyAsync(c => c.Category.ToLower() == normalizedCategory.ToLower() && c.MainTenantId == Guid.Parse(_currentUserService.TenantId!));
        if (categoryExists)
        {
            throw new CustomException("A category with this name already exists.");
        }

        var category = new CategoryEntity
        {
            Category = normalizedCategory,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            MainTenantId = Guid.Parse(_currentUserService.TenantId!),
        };

        _dbContext.Categories.Add(category);
        await _dbContext.SaveChangesAsync();

        return category.MapToDto();
    }

    public async Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateCategoryAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredString(_localizer, "Category", request.Category);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);
            ValidationHelper.ValidateNull(_localizer, "IsActive", request.IsActive);

            var category = await _dbContext.Categories.SingleOrDefaultAsync(c => c.Id == id && c.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Category not found.");

            var normalizedCategory = request.Category!;
            var categoryExists = await _dbContext.Categories.AnyAsync(c => c.Id != id && c.Category.ToLower() == normalizedCategory.ToLower() && c.MainTenantId == Guid.Parse(_currentUserService.TenantId!));
            if (categoryExists)
            {
                throw new CustomException("A category with this name already exists.");
            }

            category.Category = normalizedCategory;
            category.IsActive = request.IsActive ?? category.IsActive;
            _dbContext.Entry(category).Property(c => c.RowVersion).OriginalValue = request.RowVersion;
            category.UpdatedAtUtc = DateTime.UtcNow;
            category.UpdatedById = Guid.Parse(_currentUserService.UserId!);
            await _dbContext.SaveChangesAsync();

            return category.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task DeleteCategoryAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteCategoryAsync(id={Id})", id);
        var category = await _dbContext.Categories.SingleOrDefaultAsync(c => c.Id == id && c.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Category not found.");
        _dbContext.Categories.Remove(category);
        await _dbContext.SaveChangesAsync();
    }
}
