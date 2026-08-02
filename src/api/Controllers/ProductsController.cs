using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cluspedia.FarmPlus.Api.Dtos.Products;
using Cluspedia.FarmPlus.Api.Exceptions;
using Cluspedia.FarmPlus.Api.Services;
using System.Text.Json;

namespace Cluspedia.FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ProductsController : BaseController
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger) : base(logger)
    {
        _productService = productService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogDebug("CALLED: GetProducts(page={Page}, pageSize={PageSize})", page, pageSize);

            var result = await _productService.GetProductsAsync(page, pageSize);
            _logger.LogTrace("Count : {Count}", result.Items.Count());
            _logger.LogTrace("Product: {Product}", JsonSerializer.Serialize(result.Items.FirstOrDefault()));

            return Ok(new
            {
                Success = true,
                Data = new
                {
                    Items = result.Items,
                    Page = result.Page,
                    PageSize = result.PageSize,
                    TotalCount = result.Total,
                    TotalPages = result.TotalPages
                }
            });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProductById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetProductById(id={Id})", id);
            var product = await _productService.GetProductByIdAsync(id);
            _logger.LogTrace("Product: {Product}", JsonSerializer.Serialize(product));
            return Ok(new { Success = true, Data = product });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateProduct(request={Request})", request);
            var productEntity = await _productService.CreateProductAsync(request, GetCurrentUserId() ?? throw new UnauthorizedAccessException("User is not authenticated."));
            _logger.LogTrace("Created Product: {Product}", JsonSerializer.Serialize(productEntity));
            return Ok(new { Success = true, Data = productEntity });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateProduct(id={Id}, request={Request})", id, request);
            var product = await _productService.UpdateProductAsync(id, request, GetCurrentUserId() ?? throw new UnauthorizedAccessException("User is not authenticated."));
            _logger.LogTrace("Updated Product: {Product}", JsonSerializer.Serialize(product));
            return Ok(new { Success = true, Data = product });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteProduct(id={Id})", id);
            var deleted = await _productService.DeleteProductAsync(id);
            _logger.LogTrace("Deleted Product: {Product}", JsonSerializer.Serialize(deleted));
            return Ok(new { Success = true, Message = "Product deleted successfully." });
        }
        catch (CustomException ex)
        {
            _logger.LogWarning("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
