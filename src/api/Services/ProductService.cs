using Microsoft.AspNetCore.Http;
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
using FarmPlus.Api.Services;
using FarmPlus.Api.Models;
using Microsoft.Extensions.Options;

namespace FarmPlus.Api.Services;

public interface IProductService
{
    Task<PaginatedResultDto<ProductDto>> GetProductsAsync(int page, int pageSize);
    Task<ProductDto?> GetProductByIdAsync(Guid id);
    Task<ProductDto> CreateProductAsync(CreateProductRequestDto request);
    Task<ProductDto?> UpdateProductAsync(Guid id, UpdateProductRequestDto request);
    Task<ProductDto?> UploadProductCoverImageAsync(Guid id, IFormFile file);
    Task<ProductDto?> UploadProductMediaAsync(Guid id, IFormFile file);
    Task<ProductDto?> DeleteProductMediaAsync(Guid productId, Guid mediaId);
    Task<int> GetShopStockAsync(Guid id, Guid shopId);
    Task<ProductDto> AdjustStockAsync(Guid id, StockAdjustmentRequestDto request, bool isStockIn);
    Task<ProductDto> RecordDamageAsync(Guid id, StockAdjustmentRequestDto request);
    Task TransferStockAsync(Guid id, StockTransferRequestDto request);
    Task<PaginatedResultDto<StockMovementDto>> GetStockMovementsAsync(Guid id, int page, int pageSize);
    Task DeleteProductAsync(Guid id);
}

public class ProductService : IProductService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<ProductService> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStorageService _storageService;
    private readonly IShopStockService _shopStock;
    private readonly IStockMovementService _stockMovement;

    public ProductService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<ProductService> logger, ICurrentUserService currentUserService, IStorageService storageService, IShopStockService shopStock, IStockMovementService stockMovement)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
        _storageService = storageService;
        _shopStock = shopStock;
        _stockMovement = stockMovement;
    }

    public async Task<PaginatedResultDto<ProductDto>> GetProductsAsync(int page, int pageSize)
    {
        _logger.LogDebug("CALLED: GetProductsAsync(page={Page}, pageSize={PageSize})", page, pageSize);
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Products.AsNoTracking();
        if (_currentUserService.IsAdmin == false)
        {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId))
            {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }
        var total = await query.CountAsync();

        var productsWithMedia = await query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .GroupJoin(_dbContext.Medias.AsNoTracking(),
                p => p.Id,
                m => m.OwnerId,
                (product, medias) => new { product, medias })
            .ToListAsync();

        var productDtos = await Task.WhenAll(productsWithMedia.Select(async item =>
        {
            var dto = item.product.MapToDto();
            dto.CoverImageUrl = await ResolveObjectUrlAsync(dto.CoverImageUrl);
            dto.Medias = await MapMediaListAsync(item.medias);
            return dto;
        }));

        await ApplyShopStockAsync(productDtos);

        return new PaginatedResultDto<ProductDto>(productDtos.ToList(), page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetProductByIdAsync(id={Id})", id);
        var query = _dbContext.Products.AsNoTracking();
        if (_currentUserService.IsAdmin == false)
        {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId))
            {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }
        var productWithMedia = await query
            .Where(p => p.Id == id)
            .GroupJoin(_dbContext.Medias.AsNoTracking(),
                p => p.Id,
                m => m.OwnerId,
                (product, medias) => new { product, medias })
            .SingleOrDefaultAsync();

        if (productWithMedia == null)
        {
            return null;
        }

        var dto = productWithMedia.product.MapToDto();
        dto.CoverImageUrl = await ResolveObjectUrlAsync(dto.CoverImageUrl);
        dto.Medias = await MapMediaListAsync(productWithMedia.medias);
        await ApplyShopStockAsync([dto]);
        return dto;
    }

    public async Task<int> GetShopStockAsync(Guid id, Guid shopId)
    {
        await GetManagedProductAsync(id);
        await GetManagedShopAsync(shopId);
        return (await _shopStock.GetQuantitiesAsync(shopId, [id])).GetValueOrDefault(id);
    }

    public async Task<ProductDto> AdjustStockAsync(Guid id, StockAdjustmentRequestDto request, bool isStockIn)
    {
        if (request.Quantity <= 0) throw new CustomException("Quantity must be greater than zero.");
        var product = await GetManagedProductAsync(id);
        var shop = await _shopStock.RequireCurrentShopAsync();
        var userId = Guid.Parse(_currentUserService.UserId!);
        await _stockMovement.RecordAsync(shop.Id, id, isStockIn ? request.Quantity : -request.Quantity,
            isStockIn ? "Stock In" : "Stock Out", request.Remark, userId, product.MainTenantId);
        await _dbContext.SaveChangesAsync();
        var dto = product.MapToDto();
        dto.CurrentStock = await GetShopStockAsync(id, shop.Id);
        return dto;
    }

    public async Task<ProductDto> RecordDamageAsync(Guid id, StockAdjustmentRequestDto request)
    {
        if (request.Quantity <= 0) throw new CustomException("Quantity must be greater than zero.");
        var product = await GetManagedProductAsync(id);
        var shop = await _shopStock.RequireCurrentShopAsync();
        var userId = Guid.Parse(_currentUserService.UserId!);
        await _stockMovement.RecordAsync(shop.Id, id, -request.Quantity, "Damage", request.Remark, userId, product.MainTenantId);
        await _dbContext.SaveChangesAsync();
        var dto = product.MapToDto();
        dto.CurrentStock = await GetShopStockAsync(id, shop.Id);
        return dto;
    }

    public async Task TransferStockAsync(Guid id, StockTransferRequestDto request)
    {
        if (request.Quantity <= 0) throw new CustomException("Quantity must be greater than zero.");
        if (request.FromShopId == request.ToShopId) throw new CustomException("Select two different shops.");
        var product = await GetManagedProductAsync(id);
        await GetManagedShopAsync(request.FromShopId);
        await GetManagedShopAsync(request.ToShopId);
        var userId = Guid.Parse(_currentUserService.UserId!);
        await _stockMovement.RecordAsync(request.FromShopId, id, -request.Quantity, "Transfer Out", request.Remark, userId, product.MainTenantId);
        await _stockMovement.RecordAsync(request.ToShopId, id, request.Quantity, "Transfer In", request.Remark, userId, product.MainTenantId);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<PaginatedResultDto<StockMovementDto>> GetStockMovementsAsync(Guid id, int page, int pageSize)
    {
        await GetManagedProductAsync(id);
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);
        var query = _dbContext.StockMovements.AsNoTracking().Where(movement => movement.ProductId == id);
        if (_currentUserService.ShopId is { } shopId) query = query.Where(movement => movement.ShopId == shopId);
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(movement => movement.CreatedAtUtc).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(movement => new StockMovementDto { Id = movement.Id, Quantity = movement.Quantity, Type = movement.Type, Remark = movement.Remark, CreatedAtUtc = movement.CreatedAtUtc }).ToListAsync();
        return new PaginatedResultDto<StockMovementDto>(items, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductRequestDto request)
    {
        _logger.LogDebug("CALLED: CreateProductAsync(request={Request})", request);

        ValidationHelper.ValidateRequiredString(_localizer, "Name", request.Name);
        ValidationHelper.ValidateRequiredString(_localizer, "Description", request.Description);
        ValidationHelper.ValidateRequiredString(_localizer, "Brand", request.Brand);
        ValidationHelper.ValidateRequiredString(_localizer, "Category", request.Category);
        ValidationHelper.ValidateRequiredString(_localizer, "Unit", request.Unit);
        ValidationHelper.ValidateNull(_localizer, "SalePrice", request.SalePrice);
        ValidationHelper.ValidateNull(_localizer, "CurrentStock", request.CurrentStock);
        ValidationHelper.ValidateNull(_localizer, "MinimumStock", request.MinimumStock);

        var normalizedName = request.Name!.Trim();
        var normalizedDescription = request.Description!.Trim();
        var normalizedBrand = request.Brand!.Trim();
        var normalizedCategory = request.Category!.Trim();
        var normalizedUnit = request.Unit!.Trim();

        // Initial stock is stored against the selected shop, so a shop is needed when stock is entered.
        var stockShop = request.CurrentStock!.Value > 0 ? await _shopStock.RequireCurrentShopAsync() : null;

        var productExists = await _dbContext.Products.AnyAsync(p => p.Name.ToLower() == normalizedName.ToLower() && p.MainTenantId == Guid.Parse(_currentUserService.TenantId!));
        if (productExists)
        {
            throw new CustomException("A product with this name already exists.");
        }

        var product = new ProductEntity
        {
            Name = normalizedName,
            Description = normalizedDescription,
            Brand = normalizedBrand,
            Category = normalizedCategory,
            Unit = normalizedUnit,
            SalePrice = request.SalePrice ?? throw new CustomException("SalePrice is required."),
            CurrentStock = 0,
            MinimumStock = request.MinimumStock ?? throw new CustomException("MinimumStock is required."),
            IsActive = request.IsActive ?? true,
            CoverImageUrl = request.CoverImageUrl,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            MainTenantId = Guid.Parse(_currentUserService.TenantId!),
        };

        _dbContext.Products.Add(product);
        if (stockShop is not null)
        {
            await _shopStock.SetAsync(stockShop.Id, product.Id, request.CurrentStock!.Value, Guid.Parse(_currentUserService.UserId!), product.MainTenantId);
        }
        await _dbContext.SaveChangesAsync();

        if (request.Medias != null && request.Medias.Any())
        {
            var medias = request.Medias.Select(media => new MediaEntity
            {
                ObjectName = media.ObjectName,
                MediaType = media.MediaType,
                OwnerId = product.Id,
                Size = media.Size,
                MainTenantId = product.MainTenantId,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedById = Guid.Parse(_currentUserService.UserId!),
                UpdatedAtUtc = DateTime.UtcNow,
                UpdatedById = Guid.Parse(_currentUserService.UserId!),
            });

            _dbContext.Medias.AddRange(medias);
            await _dbContext.SaveChangesAsync();
        }

        var dto = product.MapToDto();
        dto.CoverImageUrl = await ResolveObjectUrlAsync(dto.CoverImageUrl);
        dto.CurrentStock = stockShop is null ? 0 : request.CurrentStock!.Value;
        if (request.Medias != null)
        {
            var tasks = request.Medias.Select(async media => new ProductMediaDto
            {
                Id = null,
                ObjectName = media.ObjectName,
                MediaType = media.MediaType,
                Size = media.Size,
                Url = string.IsNullOrWhiteSpace(media.ObjectName)
                    ? null
                    : await ResolveObjectUrlAsync(media.ObjectName)
            });

            dto.Medias = (await Task.WhenAll(tasks)).ToList();
        }
        else
        {
            dto.Medias = new List<ProductMediaDto>();
        }

        return dto;
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
                var productExists = await _dbContext.Products.AnyAsync(p => p.Id != id && p.Name.ToLower() == normalizedName.ToLower() && p.MainTenantId == Guid.Parse(_currentUserService.TenantId!));
                if (productExists)
                {
                    throw new CustomException("A product with this name already exists.");
                }

                product.Name = normalizedName;
            }

            if (request.Description != null)
            {
                product.Description = request.Description.Trim();
            }

            if (request.Brand != null)
            {
                product.Brand = request.Brand.Trim();
            }

            if (request.Category != null)
            {
                product.Category = request.Category.Trim();
            }

            if (request.Unit != null)
            {
                product.Unit = request.Unit.Trim();
            }

            if (request.SalePrice.HasValue)
            {
                product.SalePrice = request.SalePrice.Value;
            }

            if (request.CurrentStock.HasValue && (_currentUserService.ShopId.HasValue || request.CurrentStock.Value != 0))
            {
                // Stock is kept per shop: write the quantity to the selected shop, not the product row.
                var stockShop = await _shopStock.RequireCurrentShopAsync();
                await _shopStock.SetAsync(stockShop.Id, product.Id, request.CurrentStock.Value, Guid.Parse(_currentUserService.UserId!), product.MainTenantId);
            }

            if (request.MinimumStock.HasValue)
            {
                product.MinimumStock = request.MinimumStock.Value;
            }

            if (request.IsActive.HasValue)
            {
                product.IsActive = request.IsActive.Value;
            }

            if (request.CoverImageUrl != null)
            {
                product.CoverImageUrl = request.CoverImageUrl;
            }

            if (request.Medias != null)
            {
                var existingMedias = await _dbContext.Medias.Where(m => m.OwnerId == product.Id).ToListAsync();
                if (existingMedias.Any())
                {
                    _dbContext.Medias.RemoveRange(existingMedias);
                }

                var newMedias = request.Medias.Select(media => new MediaEntity
                {
                    ObjectName = media.ObjectName,
                    MediaType = media.MediaType,
                    OwnerId = product.Id,
                    Size = media.Size,
                    MainTenantId = product.MainTenantId,
                    CreatedAtUtc = DateTime.UtcNow,
                    CreatedById = Guid.Parse(_currentUserService.UserId!),
                    UpdatedAtUtc = DateTime.UtcNow,
                    UpdatedById = Guid.Parse(_currentUserService.UserId!),
                });

                _dbContext.Medias.AddRange(newMedias);
            }

            _dbContext.Entry(product).Property(p => p.RowVersion).OriginalValue = request.RowVersion;
            product.RowVersion = Guid.NewGuid();
            product.UpdatedAtUtc = DateTime.UtcNow;
            product.UpdatedById = Guid.Parse(_currentUserService.UserId!);
            await _dbContext.SaveChangesAsync();

            var dto = product.MapToDto();
            dto.CoverImageUrl = await ResolveObjectUrlAsync(dto.CoverImageUrl);
            await ApplyShopStockAsync([dto]);
            if (request.Medias != null)
            {
                var tasks = request.Medias.Select(async media => new ProductMediaDto
                {
                    Id = null,
                    ObjectName = media.ObjectName,
                    MediaType = media.MediaType,
                    Size = media.Size,
                    Url = string.IsNullOrWhiteSpace(media.ObjectName)
                        ? null
                        : await ResolveObjectUrlAsync(media.ObjectName)
                });

                dto.Medias = (await Task.WhenAll(tasks)).ToList();
            }
            else
            {
                dto.Medias = await MapMediaListAsync(await _dbContext.Medias.Where(m => m.OwnerId == product.Id).ToListAsync());
            }

            return dto;
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task<ProductDto?> UploadProductCoverImageAsync(Guid id, IFormFile file)
    {
        _logger.LogDebug("CALLED: UploadProductCoverImageAsync(id={Id}, file={FileName})", id, file?.FileName);
        if (file == null || file.Length == 0)
        {
            throw new CustomException(_localizer[$"Template.Required", "cover image file"]);
        }

        var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id && p.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Product not found.");

        var objectName = await _storageService.UploadFileAsync(file);
        product.CoverImageUrl = objectName;
        product.UpdatedAtUtc = DateTime.UtcNow;
        product.UpdatedById = Guid.Parse(_currentUserService.UserId!);
        await _dbContext.SaveChangesAsync();

        var dto = product.MapToDto();
        dto.CoverImageUrl = await ResolveObjectUrlAsync(dto.CoverImageUrl);
        dto.Medias = await MapMediaListAsync(await _dbContext.Medias.Where(m => m.OwnerId == product.Id).ToListAsync());
        await ApplyShopStockAsync([dto]);
        return dto;
    }

    public async Task<ProductDto?> UploadProductMediaAsync(Guid id, IFormFile file)
    {
        _logger.LogDebug("CALLED: UploadProductMediaAsync(id={Id}, file={FileName})", id, file?.FileName);
        if (file == null || file.Length == 0)
        {
            throw new CustomException(_localizer[$"Template.Required", "product media file"]);
        }

        var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id && p.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Product not found.");

        var objectName = await _storageService.UploadFileAsync(file);
        var media = new MediaEntity
        {
            ObjectName = objectName,
            MediaType = file.ContentType ?? string.Empty,
            OwnerId = product.Id,
            Size = file.Length,
            MainTenantId = product.MainTenantId,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
        };

        _dbContext.Medias.Add(media);
        await _dbContext.SaveChangesAsync();

        var dto = product.MapToDto();
        dto.CoverImageUrl = await ResolveObjectUrlAsync(dto.CoverImageUrl);
        dto.Medias = await MapMediaListAsync(await _dbContext.Medias.Where(m => m.OwnerId == product.Id).ToListAsync());
        await ApplyShopStockAsync([dto]);
        return dto;
    }

    public async Task<ProductDto?> DeleteProductMediaAsync(Guid productId, Guid mediaId)
    {
        _logger.LogDebug("CALLED: DeleteProductMediaAsync(productId={ProductId}, mediaId={MediaId})", productId, mediaId);
        var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == productId && p.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Product not found.");

        var media = await _dbContext.Medias.SingleOrDefaultAsync(m => m.Id == mediaId && m.OwnerId == productId && m.MainTenantId == product.MainTenantId) ?? throw new CustomException("Product media not found.");

        if (!string.IsNullOrWhiteSpace(media.ObjectName))
        {
            try
            {
                await _storageService.DeleteObjectAsync(media.ObjectName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete storage object for media {MediaId}", mediaId);
            }
        }

        _dbContext.Medias.Remove(media);
        product.UpdatedAtUtc = DateTime.UtcNow;
        product.UpdatedById = Guid.Parse(_currentUserService.UserId!);
        await _dbContext.SaveChangesAsync();

        var dto = product.MapToDto();
        dto.CoverImageUrl = await ResolveObjectUrlAsync(dto.CoverImageUrl);
        dto.Medias = await MapMediaListAsync(await _dbContext.Medias.Where(m => m.OwnerId == product.Id).ToListAsync());
        await ApplyShopStockAsync([dto]);
        return dto;
    }

    private async Task<string?> ResolveObjectUrlAsync(string? objectName)
    {
        if (string.IsNullOrWhiteSpace(objectName))
        {
            return null;
        }

        return _storageService.BuildObjectUrl(objectName);
    }

    private async Task<ProductEntity> GetManagedProductAsync(Guid id)
        {
            var query = _dbContext.Products.AsQueryable();
            if (!_currentUserService.IsAdmin)
            {
                if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) throw new CustomException("Tenant ID is missing for the current user.");
                query = query.Where(product => product.MainTenantId == tenantId);
            }
            return await query.SingleOrDefaultAsync(product => product.Id == id) ?? throw new CustomException("Product not found.");
        }

        private async Task GetManagedShopAsync(Guid shopId)
        {
            var query = _dbContext.Shops.AsQueryable();
            if (!_currentUserService.IsAdmin)
            {
                if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) throw new CustomException("Tenant ID is missing for the current user.");
                query = query.Where(shop => shop.MainTenantId == tenantId);
            }
            if (!await query.AnyAsync(shop => shop.Id == shopId)) throw new CustomException("Shop not found.");
        }

    private async Task<List<ProductMediaDto>> MapMediaListAsync(IEnumerable<MediaEntity> medias)
    {
        var result = new List<ProductMediaDto>();
        foreach (var media in medias)
        {
            result.Add(new ProductMediaDto
            {
                Id = media.Id,
                ObjectName = media.ObjectName,
                MediaType = media.MediaType,
                Size = media.Size,
                Url = string.IsNullOrWhiteSpace(media.ObjectName) ? null : await ResolveObjectUrlAsync(media.ObjectName)
            });
        }

        return result;
    }

    public async Task DeleteProductAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteProductAsync(id={Id})", id);
        var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id && p.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Product not found.");
        _dbContext.ShopStocks.RemoveRange(await _dbContext.ShopStocks.Where(stock => stock.ProductId == id).ToListAsync());
        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync();
    }

    /// <summary>Replaces each product's stock with the quantity held in the currently selected shop (0 when no shop is selected).</summary>
    private async Task ApplyShopStockAsync(IReadOnlyCollection<ProductDto> dtos)
    {
        if (dtos.Count == 0) return;
        if (_currentUserService.ShopId is not { } shopId)
        {
            foreach (var dto in dtos) dto.CurrentStock = 0;
            return;
        }

        var quantities = await _shopStock.GetQuantitiesAsync(shopId, dtos.Select(dto => dto.Id).ToList());
        foreach (var dto in dtos) dto.CurrentStock = quantities.GetValueOrDefault(dto.Id);
    }
}
