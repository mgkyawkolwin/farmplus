using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Dealers;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;
using System.Text.Json;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DealersController : BaseController
{
    private readonly IDealerService _dealerService;
    private readonly ILogger<DealersController> _logger;

    public DealersController(IDealerService dealerService, ILogger<DealersController> logger) : base(logger)
    {
        _dealerService = dealerService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetDealers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? dealerName = null)
    {
        try
        {
            _logger.LogDebug("CALLED: GetDealers(page={Page}, pageSize={PageSize}, dealerName={DealerName})", page, pageSize, dealerName ?? "null");

            var result = await _dealerService.GetDealersAsync(page, pageSize, dealerName);
            _logger.LogTrace("Count : {Count}", result.Items.Count());
            _logger.LogTrace("Dealer: {Dealer}", JsonSerializer.Serialize(result.Items.FirstOrDefault()));

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
    public async Task<IActionResult> GetDealerById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetDealerById(id={Id})", id);
            var dealer = await _dealerService.GetDealerByIdAsync(id);
            _logger.LogTrace("Dealer: {Dealer}", JsonSerializer.Serialize(dealer));

            return Ok(new { Success = true, Data = dealer });
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
    public async Task<IActionResult> CreateDealer([FromBody] CreateDealerRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateDealer(request={Request})", request);

            var dealerDto = await _dealerService.CreateDealerAsync(request);
            _logger.LogTrace("Created Dealer: {Dealer}", dealerDto);
            return Ok(new { Success = true, Data = dealerDto });
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
    public async Task<IActionResult> UpdateDealer(Guid id, [FromBody] UpdateDealerRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateDealer(id={Id}, request={Request})", id, request);

            var dealer = await _dealerService.UpdateDealerAsync(id, request);
            _logger.LogTrace("Updated Dealer: {Dealer}", dealer);
            return Ok(new { Success = true, Data = dealer });
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

    [HttpPatch("{id:guid}/logo")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDealerLogo(Guid id, IFormFile file)
    {
        try
        {
            _logger.LogDebug("CALLED: UploadDealerLogo(id={Id})", id);
            var dealer = await _dealerService.UploadDealerLogoAsync(id, file);
            _logger.LogTrace("Updated Dealer Logo: {Dealer}", dealer);
            return Ok(new { Success = true, Data = dealer });
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
    public async Task<IActionResult> DeleteDealer(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteDealer(id={Id})", id);
            await _dealerService.DeleteDealerAsync(id);
            return Ok(new { Success = true, Message = "Dealer deleted successfully." });
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
