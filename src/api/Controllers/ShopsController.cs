using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Shops;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ShopsController : BaseController
{
    private readonly IShopService _shopService;
    private readonly ILogger<ShopsController> _logger;

    public ShopsController(IShopService shopService, ILogger<ShopsController> logger) : base(logger)
    {
        _shopService = shopService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetShops([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? name = null)
    {
        try
        {
            var result = await _shopService.GetShopsAsync(page, pageSize, name);
            return Ok(new
            {
                Success = true,
                Data = new
                {
                    Items = result.Items,
                    Page = result.Page,
                    PageSize = result.PageSize,
                    TotalCount = result.Total,
                    TotalPages = result.TotalPages,
                },
            });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve shops.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetShopById(Guid id)
    {
        try
        {
            var shop = await _shopService.GetShopByIdAsync(id);
            return shop is null
                ? NotFound(new { Success = false, Message = "Shop not found." })
                : Ok(new { Success = true, Data = shop });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve shop {ShopId}.", id);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    public Task<IActionResult> CreateShop([FromBody] CreateShopRequestDto request) =>
        ExecuteAsync(async () => (object?)await _shopService.CreateShopAsync(request), "create shop");

    [HttpPut("{id:guid}")]
    public Task<IActionResult> UpdateShop(Guid id, [FromBody] UpdateShopRequestDto request) =>
        ExecuteAsync(async () => (object?)await _shopService.UpdateShopAsync(id, request), "update shop");

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteShop(Guid id)
    {
        try
        {
            await _shopService.DeleteShopAsync(id);
            return Ok(new { Success = true, Message = "Shop deleted successfully." });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete shop {ShopId}.", id);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    private async Task<IActionResult> ExecuteAsync(Func<Task<object?>> action, string description)
    {
        try
        {
            return Ok(new { Success = true, Data = await action() });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to {Action}.", description);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
