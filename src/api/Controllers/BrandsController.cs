using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Brands;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;
using System.Text.Json;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class BrandsController : BaseController
{
    private readonly IBrandService _brandService;
    private readonly ILogger<BrandsController> _logger;

    public BrandsController(IBrandService brandService, ILogger<BrandsController> logger) : base(logger)
    {
        _brandService = brandService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetBrands([FromQuery] GetBrandsRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: GetBrands(request={Request})", request);

            var result = await _brandService.GetBrandsAsync(request);
            _logger.LogTrace("Count : {Count}", result.Items.Count());
            _logger.LogTrace("Brand: {Brand}", JsonSerializer.Serialize(result.Items.FirstOrDefault()));

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
    public async Task<IActionResult> GetBrandById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetBrandById(id={Id})", id);
            var brand = await _brandService.GetBrandByIdAsync(id);
            _logger.LogTrace("Brand: {Brand}", JsonSerializer.Serialize(brand));

            return Ok(new { Success = true, Data = brand });
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
    public async Task<IActionResult> CreateBrand([FromBody] CreateBrandRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateBrand(request={Request})", request);

            var brandDto = await _brandService.CreateBrandAsync(request, GetCurrentUserId() ?? throw new UnauthorizedAccessException("User is not authenticated."));
            _logger.LogTrace("Created Brand: {Brand}", brandDto);
            return Ok(new { Success = true, Data = brandDto });
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
    public async Task<IActionResult> UpdateBrand(Guid id, [FromBody] UpdateBrandRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateBrand(id={Id}, request={Request})", id, request);

            var brand = await _brandService.UpdateBrandAsync(id, request, GetCurrentUserId() ?? throw new UnauthorizedAccessException("User is not authenticated."));
            _logger.LogTrace("Updated Brand: {Brand}", brand);
            return Ok(new { Success = true, Data = brand });
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
    public async Task<IActionResult> DeleteBrand(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteBrand(id={Id})", id);
            await _brandService.DeleteBrandAsync(id);
            return Ok(new { Success = true, Message = "Brand deleted successfully." });
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
