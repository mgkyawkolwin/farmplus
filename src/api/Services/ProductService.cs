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
    Task<ProductDto> CreateProductAsync(CreateProductRequestDto request);
    Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequestDto request);
    Task DeleteProductAsync(Guid id);
}

public class ProductService : IProductService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<ProductService> _logger;
    private readonly ICurrentUserService _currentUserService;

    public ProductService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<ProductService> logger, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<PaginatedResultDto<ProductDto>> GetProductsAsync(int page, int pageSize)
    {
        _logger.LogDebug("CALLED: GetProductsAsync(page={Page}, pageSize={PageSize})", page, pageSize);
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Products.AsNoTracking();
        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }
        var total = await query.CountAsync();

        var products = await query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var productDtos = products.MapToDtoList();
        return new PaginatedResultDto<ProductDto>(productDtos, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetProductByIdAsync(id={Id})", id);
        var query = _dbContext.Products.AsNoTracking();
        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }
        var product = await query.SingleOrDefaultAsync(p => p.Id == id);
        return product?.MapToDto();
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductRequestDto request)
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
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            MainTenantId = Guid.Parse(_currentUserService.TenantId!),
        };

        _dbContext.Products.Add(product);
        await _dbContext.SaveChangesAsync();

        return product.MapToDto();
    }

    public async Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateProductAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);

            var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id && p.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Product not found.");

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

            product.Description = request.Description!.Trim();
            product.Brand = request.Brand!.Trim();
            product.Category = request.Category!.Trim();
            product.Unit = request.Unit!.Trim();
            product.PurchasePrice = request.PurchasePrice!.Value;
            product.SalePrice = request.SalePrice!.Value;
            product.CurrentStock = request.CurrentStock!.Value;
            product.MinimumStock = request.MinimumStock!.Value;

            _dbContext.Entry(product).Property(p => p.RowVersion).OriginalValue = request.RowVersion;
            product.UpdatedAtUtc = DateTime.UtcNow;
            product.UpdatedById = Guid.Parse(_currentUserService.UserId!);
            await _dbContext.SaveChangesAsync();

            return product.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task DeleteProductAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteProductAsync(id={Id})", id);
        var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id && p.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Product not found.");
        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync();
    }
}
