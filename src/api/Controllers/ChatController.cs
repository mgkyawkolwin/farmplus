using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Categories;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;
using System.Text.Json;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ChatController : BaseController
{
    private readonly ILogger<ChatController> _logger;

    public ChatController(ILogger<ChatController> logger) : base(logger)
    {
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] string message)
    {
        try
        {
            _logger.LogDebug("CALLED: Chat(message={Message})", message);
            return Ok(new { Success = true, Data = $"You said: {message}" });
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
