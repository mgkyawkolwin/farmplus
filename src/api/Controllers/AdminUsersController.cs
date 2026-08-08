using System.IdentityModel.Tokens.Jwt;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.AdminUsers;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;
using FarmPlus.Api.Caching;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AdminUsersController : BaseController
{
    private readonly IAdminUserService _adminUserService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(IAdminUserService adminUserService, ILogger<AdminUsersController> logger) : base(logger)
    {
        _adminUserService = adminUserService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAdminUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            foreach (var header in Request.Headers)
            {
                _logger.LogInformation("Incoming Header -> Key: {Key}, Value: {Value}", header.Key, header.Value);
            }
            // Log all cookies received in the request
            foreach (var cookie in Request.Cookies)
            {
                _logger.LogInformation("Incoming Cookie -> Key: {Key}, Value: {Value}", cookie.Key, cookie.Value);
            }
            _logger.LogDebug("CALLED: GetAdminUsers(page={Page}, pageSize={PageSize})", page, pageSize);
            var result = await _adminUserService.GetAdminUsersAsync(page, pageSize);
            return Ok(new { Success = true, Data = result });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAdminUserById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetAdminUserById(id={Id})", id);
            var user = await _adminUserService.GetAdminUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { Success = false, Message = "Admin user not found." });
            }
            return Ok(new { Success = true, Data = user });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateAdminUser([FromBody] CreateAdminUserDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateAdminUser(request={Request})", request);
            var currentUserId = GetCurrentUserId() ?? throw new CustomException("Invalid session user.");
            var user = await _adminUserService.CreateAdminUserAsync(request, currentUserId);
            return Ok(new { Success = true, Data = user });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAdminUser(Guid id, [FromBody] UpdateAdminUserDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateAdminUser(id={Id}, request={Request})", id, request);
            var currentUserId = GetCurrentUserId() ?? throw new CustomException("Invalid session user.");
            var user = await _adminUserService.UpdateAdminUserAsync(id, request, currentUserId);
            return Ok(new { Success = true, Data = user });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAdminUser(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteAdminUser(id={Id})", id);
            await _adminUserService.DeleteAdminUserAsync(id);
            return Ok(new { Success = true, Message = "Admin user deleted successfully." });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
