using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cluspedia.FarmPlus.Api.Dtos.Customers;
using Cluspedia.FarmPlus.Api.Exceptions;
using Cluspedia.FarmPlus.Api.Services;

namespace Cluspedia.FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CustomersController : BaseController
{
    private readonly ICustomerService _customerService;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ICustomerService customerService, ILogger<CustomersController> logger) : base(logger)
    {
        _customerService = customerService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? name = null, [FromQuery] bool? isActive = null)
    {
        try
        {
            _logger.LogDebug("CALLED: GetCustomers(page={Page}, pageSize={PageSize}, name={Name}, isActive={IsActive})", page, pageSize, name ?? "null", isActive);

            var result = await _customerService.GetCustomersAsync(page, pageSize, name, isActive);

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
    public async Task<IActionResult> GetCustomerById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetCustomerById(id={Id})", id);
            var customer = await _customerService.GetCustomerByIdAsync(id);
            if (customer == null)
            {
                return NotFound(new { Success = false, Message = "Customer not found." });
            }

            return Ok(new { Success = true, Data = customer });
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
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateCustomer(request={Request})", request);

            var customerEntity = await _customerService.CreateCustomerAsync(request, GetCurrentUserId() ?? Guid.Empty);
            return Ok(new { Success = true, Data = customerEntity });
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
    public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] UpdateCustomerRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateCustomer(id={Id}, request={Request})", id, request);

            var customer = await _customerService.UpdateCustomerAsync(id, request, GetCurrentUserId() ?? Guid.Empty);
            if (customer == null)
            {
                return NotFound(new { Success = false, Message = "Customer not found." });
            }

            return Ok(new { Success = true, Data = customer });
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
    public async Task<IActionResult> DeleteCustomer(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteCustomer(id={Id})", id);
            var deleted = await _customerService.DeleteCustomerAsync(id);
            return Ok(new { Success = true, Message = "Customer deleted successfully." });
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
