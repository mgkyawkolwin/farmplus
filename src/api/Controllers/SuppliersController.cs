using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Suppliers;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;
using System.Text.Json;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class SuppliersController : BaseController
{
    private readonly ISupplierService _supplierService;
    private readonly ILogger<SuppliersController> _logger;

    public SuppliersController(ISupplierService supplierService, ILogger<SuppliersController> logger) : base(logger)
    {
        _supplierService = supplierService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetSuppliers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? supplierName = null)
    {
        try
        {
            _logger.LogDebug("CALLED: GetSuppliers(page={Page}, pageSize={PageSize}, supplierName={SupplierName})", page, pageSize, supplierName ?? "null");

            var result = await _supplierService.GetSuppliersAsync(page, pageSize, supplierName);
            _logger.LogTrace("Count : {Count}", result.Items.Count());
            _logger.LogTrace("Supplier: {Supplier}", JsonSerializer.Serialize(result.Items.FirstOrDefault()));

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
    public async Task<IActionResult> GetSupplierById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetSupplierById(id={Id})", id);
            var supplier = await _supplierService.GetSupplierByIdAsync(id);
            _logger.LogTrace("Supplier: {Supplier}", JsonSerializer.Serialize(supplier));

            return Ok(new { Success = true, Data = supplier });
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
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateSupplier(request={Request})", request);

            var supplierDto = await _supplierService.CreateSupplierAsync(request);
            _logger.LogTrace("Created Supplier: {Supplier}", supplierDto);
            return Ok(new { Success = true, Data = supplierDto });
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
    public async Task<IActionResult> UpdateSupplier(Guid id, [FromBody] UpdateSupplierRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateSupplier(id={Id}, request={Request})", id, request);

            var supplier = await _supplierService.UpdateSupplierAsync(id, request);
            _logger.LogTrace("Updated Supplier: {Supplier}", supplier);
            return Ok(new { Success = true, Data = supplier });
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
    public async Task<IActionResult> UploadSupplierLogo(Guid id, IFormFile file)
    {
        try
        {
            _logger.LogDebug("CALLED: UploadSupplierLogo(id={Id})", id);
            var supplier = await _supplierService.UploadSupplierLogoAsync(id, file);
            _logger.LogTrace("Updated Supplier Logo: {Supplier}", supplier);
            return Ok(new { Success = true, Data = supplier });
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
    public async Task<IActionResult> DeleteSupplier(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteSupplier(id={Id})", id);
            await _supplierService.DeleteSupplierAsync(id);
            return Ok(new { Success = true, Message = "Supplier deleted successfully." });
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
