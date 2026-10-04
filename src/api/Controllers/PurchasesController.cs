using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Purchases;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PurchasesController : BaseController
{
    private readonly IPurchaseService _purchaseService;
    private readonly ILogger<PurchasesController> _logger;

    public PurchasesController(IPurchaseService purchaseService, ILogger<PurchasesController> logger) : base(logger)
    {
        _purchaseService = purchaseService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetPurchases([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _purchaseService.GetPurchasesAsync(page, pageSize);
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
            _logger.LogError(ex, "Failed to retrieve purchases.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPurchaseById(Guid id)
    {
        try
        {
            var purchase = await _purchaseService.GetPurchaseByIdAsync(id);
            return purchase is null
                ? NotFound(new { Success = false, Message = "Purchase not found." })
                : Ok(new { Success = true, Data = purchase });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve purchase {PurchaseId}.", id);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreatePurchase([FromBody] CreatePurchaseRequestDto request)
    {
        try
        {
            var purchase = await _purchaseService.CreatePurchaseAsync(request);
            return Ok(new { Success = true, Data = purchase });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create purchase.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePurchase(Guid id, [FromBody] UpdatePurchaseRequestDto request)
    {
        try
        {
            var purchase = await _purchaseService.UpdatePurchaseAsync(id, request);
            return Ok(new { Success = true, Data = purchase });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update purchase {PurchaseId}.", id);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePurchase(Guid id)
    {
        try
        {
            await _purchaseService.DeletePurchaseAsync(id);
            return Ok(new { Success = true, Message = "Purchase deleted successfully." });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete purchase {PurchaseId}.", id);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}