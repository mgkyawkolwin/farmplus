using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Cluspedia.FarmPlus.Api.Data;
using Cluspedia.FarmPlus.Api.Dtos;
using Cluspedia.FarmPlus.Api.Dtos.Categories;
using Cluspedia.FarmPlus.Api.Entities;
using Cluspedia.FarmPlus.Api.Exceptions;
using Cluspedia.FarmPlus.Api.I18N;
using Cluspedia.FarmPlus.Api.Utilities;

namespace Cluspedia.FarmPlus.Api.Services;

public interface ICategoryService
{
    Task<PaginatedResultDto<CategoryEntity>> GetCategoriesAsync(int page, int pageSize);
    Task<CategoryEntity?> GetCategoryByIdAsync(Guid id);
    Task<CategoryEntity> CreateCategoryAsync(CreateCategoryRequestDto request, Guid currentUserId);
    Task<CategoryEntity?> UpdateCategoryAsync(Guid id, UpdateCategoryRequestDto request, Guid currentUserId);
    Task<bool> DeleteCategoryAsync(Guid id);
}

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<CategoryService> logger)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<CategoryEntity>> GetCategoriesAsync(int page, int pageSize)
    {
        _logger.LogDebug("CALLED: GetCategoriesAsync(page={Page}, pageSize={PageSize})", page, pageSize);
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Categories.AsNoTracking().OrderBy(c => c.Category);
        var total = await query.CountAsync();

        var categories = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResultDto<CategoryEntity>(categories, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<CategoryEntity?> GetCategoryByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetCategoryByIdAsync(id={Id})", id);
        return await _dbContext.Categories.AsNoTracking().SingleOrDefaultAsync(c => c.Id == id);
    }

    public async Task<CategoryEntity> CreateCategoryAsync(CreateCategoryRequestDto request, Guid currentUserId)
    {
        _logger.LogDebug("CALLED: CreateCategoryAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "Category", request.Category);

        var normalizedCategory = request.Category.Trim();
        var categoryExists = await _dbContext.Categories.AnyAsync(c => c.Category.ToLower() == normalizedCategory.ToLower());
        if (categoryExists)
        {
            throw new CustomException("A category with this name already exists.");
        }

        var category = new CategoryEntity
        {
            Category = normalizedCategory,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };

        _dbContext.Categories.Add(category);
        await _dbContext.SaveChangesAsync();

        return category;
    }

    public async Task<CategoryEntity?> UpdateCategoryAsync(Guid id, UpdateCategoryRequestDto request, Guid currentUserId)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateCategoryAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);

            var category = await _dbContext.Categories.SingleOrDefaultAsync(c => c.Id == id) ?? throw new CustomException("Category not found.");

            if (!string.IsNullOrWhiteSpace(request.Category))
            {
                var normalizedCategory = request.Category.Trim();
                var categoryExists = await _dbContext.Categories.AnyAsync(c => c.Id != id && c.Category.ToLower() == normalizedCategory.ToLower());
                if (categoryExists)
                {
                    throw new CustomException("A category with this name already exists.");
                }

                category.Category = normalizedCategory;
            }

            _dbContext.Entry(category).Property(c => c.RowVersion).OriginalValue = request.RowVersion;
            category.UpdatedAtUtc = DateTime.UtcNow;
            category.UpdatedById = currentUserId;
            await _dbContext.SaveChangesAsync();

            return category;
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task<bool> DeleteCategoryAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteCategoryAsync(id={Id})", id);
        var category = await _dbContext.Categories.SingleOrDefaultAsync(c => c.Id == id) ?? throw new CustomException("Category not found.");
        _dbContext.Categories.Remove(category);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
