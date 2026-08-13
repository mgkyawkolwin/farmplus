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
    Task DeleteProductAsync(Guid id);
}

public class ProductService : IProductService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<ProductService> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStorageService _storageService;

    public ProductService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<ProductService> logger, ICurrentUserService currentUserService, IStorageService storageService)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
        _storageService = storageService;
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
        return dto;
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

        var normalizedName = request.Name!.Trim();
        var normalizedDescription = request.Description!.Trim();
        var normalizedBrand = request.Brand!.Trim();
        var normalizedCategory = request.Category!.Trim();
        var normalizedUnit = request.Unit!.Trim();

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
            PurchasePrice = request.PurchasePrice ?? throw new CustomException("PurchasePrice is required."),
            SalePrice = request.SalePrice ?? throw new CustomException("SalePrice is required."),
            CurrentStock = request.CurrentStock ?? throw new CustomException("CurrentStock is required."),
            MinimumStock = request.MinimumStock ?? throw new CustomException("MinimumStock is required."),
            CoverImageUrl = request.CoverImageUrl,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            MainTenantId = Guid.Parse(_currentUserService.TenantId!),
        };

        _dbContext.Products.Add(product);
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
            product.UpdatedAtUtc = DateTime.UtcNow;
            product.UpdatedById = Guid.Parse(_currentUserService.UserId!);
            await _dbContext.SaveChangesAsync();

            var dto = product.MapToDto();
            dto.CoverImageUrl = await ResolveObjectUrlAsync(dto.CoverImageUrl);
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
        return dto;
    }

    private async Task<string?> ResolveObjectUrlAsync(string? objectName)
    {
        if (string.IsNullOrWhiteSpace(objectName))
        {
            return null;
        }

        return await _storageService.GetPresignedUrlAsync(objectName);
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
        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync();
    }
}
