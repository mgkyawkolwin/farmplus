using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Units;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;
using System.Text.Json;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UnitsController : BaseController
{
    private readonly IUnitService _unitService;
    private readonly ILogger<UnitsController> _logger;

    public UnitsController(IUnitService unitService, ILogger<UnitsController> logger) : base(logger)
    {
        _unitService = unitService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetUnits([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? unit = null)
    {
        try
        {
            _logger.LogDebug("CALLED: GetUnits(page={Page}, pageSize={PageSize}, unit={Unit})", page, pageSize, unit ?? "null");

            var result = await _unitService.GetUnitsAsync(page, pageSize, unit);
            _logger.LogTrace("Count : {Count}", result.Items.Count());
            _logger.LogTrace("Unit: {Unit}", JsonSerializer.Serialize(result.Items.FirstOrDefault()));

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
    public async Task<IActionResult> GetUnitById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetUnitById(id={Id})", id);
            var unit = await _unitService.GetUnitByIdAsync(id);
            _logger.LogTrace("Unit: {Unit}", JsonSerializer.Serialize(unit));

            return Ok(new { Success = true, Data = unit });
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
    public async Task<IActionResult> CreateUnit([FromBody] CreateUnitRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateUnit(request={Request})", request);

            var unitDto = await _unitService.CreateUnitAsync(request, GetCurrentUserId() ?? throw new UnauthorizedAccessException("User is not authenticated."));
            _logger.LogTrace("Created Unit: {Unit}", unitDto);
            return Ok(new { Success = true, Data = unitDto });
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
    public async Task<IActionResult> UpdateUnit(Guid id, [FromBody] UpdateUnitRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateUnit(id={Id}, request={Request})", id, request);

            var unit = await _unitService.UpdateUnitAsync(id, request, GetCurrentUserId() ?? throw new UnauthorizedAccessException("User is not authenticated."));
            _logger.LogTrace("Updated Unit: {Unit}", unit);
            return Ok(new { Success = true, Data = unit });
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
    public async Task<IActionResult> DeleteUnit(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteUnit(id={Id})", id);
            await _unitService.DeleteUnitAsync(id);
            return Ok(new { Success = true, Message = "Unit deleted successfully." });
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
