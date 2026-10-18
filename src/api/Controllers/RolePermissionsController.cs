using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.RolePermissions;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class RolePermissionsController : ControllerBase
{
    private readonly IRolePermissionService _rolePermissionService;
    private readonly ILogger<RolePermissionsController> _logger;

    public RolePermissionsController(IRolePermissionService rolePermissionService, ILogger<RolePermissionsController> logger)
    {
        _rolePermissionService = rolePermissionService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetCatalog()
    {
        try
        {
            return Ok(new { Success = true, Data = await _rolePermissionService.GetCatalogAsync() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve the permission catalog.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentPermissions()
    {
        try
        {
            return Ok(new { Success = true, Data = await _rolePermissionService.GetCurrentPermissionsAsync() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve current user permissions.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{roleId:guid}")]
    public async Task<IActionResult> GetRolePermissions(Guid roleId)
    {
        try
        {
            return Ok(new { Success = true, Data = new { PermissionKeys = await _rolePermissionService.GetRolePermissionKeysAsync(roleId) } });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve permissions for role {RoleId}.", roleId);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPut("{roleId:guid}")]
    public async Task<IActionResult> UpdateRolePermissions(Guid roleId, [FromBody] UpdateRolePermissionsRequestDto request)
    {
        try
        {
            await _rolePermissionService.UpdateRolePermissionsAsync(roleId, request.PermissionKeys);
            return Ok(new { Success = true, Message = "Role permissions updated successfully." });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update permissions for role {RoleId}.", roleId);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}