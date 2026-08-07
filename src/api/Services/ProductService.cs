using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Products;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Mappings;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface IProductService
{
    Task<PaginatedResultDto<ProductDto>> GetProductsAsync(int page, int pageSize);
    Task<ProductDto?> GetProductByIdAsync(Guid id);
    Task<ProductDto> CreateProductAsync(CreateProductRequestDto request, Guid currentUserId);
    Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequestDto request, Guid currentUserId);
    Task<bool> DeleteProductAsync(Guid id);
}

public class ProductService : IProductService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<ProductService> _logger;

    public ProductService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<ProductService> logger)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<ProductDto>> GetProductsAsync(int page, int pageSize)
    {
        _logger.LogDebug("CALLED: GetProductsAsync(page={Page}, pageSize={PageSize})", page, pageSize);
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Products.AsNoTracking().OrderBy(p => p.Name);
        var total = await query.CountAsync();

        var products = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var productDtos = products.MapToDtoList();
        return new PaginatedResultDto<ProductDto>(productDtos, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetProductByIdAsync(id={Id})", id);
        var product = await _dbContext.Products.AsNoTracking().SingleOrDefaultAsync(p => p.Id == id);
        return product?.MapToDto();
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductRequestDto request, Guid currentUserId)
    {
        _logger.LogDebug("CALLED: CreateProductAsync(request={Request})", request);
        
        ValidationHelper.ValidateRequiredString(_localizer, "Name", request.Name);
        ValidationHelper.ValidateRequiredString(_localizer, "Description", request.Description);
        ValidationHelper.ValidateRequiredString(_localizer, "Brand", request.Brand);
        ValidationHelper.ValidateRequiredString(_localizer, "Category", request.Category);
        ValidationHelper.ValidateRequiredString(_localizer, "Unit", request.Unit);
        ValidationHelper.ValidateNull(_localizer, "PurchasePrice", request.PurchasePrice);
        ValidationHelper.ValidateNull(_localizer, "SalePrice", request.SalePrice);
        ValidationHelper.ValidateNull(_localizer, "CurrentStock", request.CurrentStock);
        ValidationHelper.ValidateNull(_localizer, "MinimumStock", request.MinimumStock);

        var normalizedName = request.Name.Trim();
        var productExists = await _dbContext.Products.AnyAsync(p => p.Name.ToLower() == normalizedName.ToLower());
        if (productExists)
        {
            throw new CustomException("A product with this name already exists.");
        }

        var product = new ProductEntity
        {
            Name = normalizedName,
            Description = request.Description.Trim(),
            Brand = request.Brand.Trim(),
            Category = request.Category.Trim(),
            Unit = request.Unit.Trim(),
            PurchasePrice = request.PurchasePrice ?? throw new CustomException("PurchasePrice is required."),
            SalePrice = request.SalePrice ?? throw new CustomException("SalePrice is required."),
            CurrentStock = request.CurrentStock ?? throw new CustomException("CurrentStock is required."),
            MinimumStock = request.MinimumStock ?? throw new CustomException("MinimumStock is required."),
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };

        _dbContext.Products.Add(product);
        await _dbContext.SaveChangesAsync();

        return product.MapToDto();
    }

    public async Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequestDto request, Guid currentUserId)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateProductAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);

            var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id) ?? throw new CustomException("Product not found.");

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                var normalizedName = request.Name.Trim();
                var productExists = await _dbContext.Products.AnyAsync(p => p.Id != id && p.Name.ToLower() == normalizedName.ToLower());
                if (productExists)
                {
                    throw new CustomException("A product with this name already exists.");
                }

                product.Name = normalizedName;
            }

            if (!string.IsNullOrWhiteSpace(request.Description))
            {
                product.Description = request.Description.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Brand))
            {
                product.Brand = request.Brand.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Category))
            {
                product.Category = request.Category.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.Unit))
            {
                product.Unit = request.Unit.Trim();
            }

            if (request.PurchasePrice.HasValue)
            {
                product.PurchasePrice = request.PurchasePrice.Value;
            }

            if (request.SalePrice.HasValue)
            {
                product.SalePrice = request.SalePrice.Value;
            }

            if (request.CurrentStock.HasValue)
            {
                product.CurrentStock = request.CurrentStock.Value;
            }

            if (request.MinimumStock.HasValue)
            {
                product.MinimumStock = request.MinimumStock.Value;
            }

            _dbContext.Entry(product).Property(p => p.RowVersion).OriginalValue = request.RowVersion;
            product.UpdatedAtUtc = DateTime.UtcNow;
            product.UpdatedById = currentUserId;
            await _dbContext.SaveChangesAsync();

            return product.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteProductAsync(id={Id})", id);
        var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id) ?? throw new CustomException("Product not found.");
        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
