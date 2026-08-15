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
    private readonly IAiApiClient _aiApiClient;

    public ChatController(ILogger<ChatController> logger, IAiApiClient aiApiClient) : base(logger)
    {
        _logger = logger;
        _aiApiClient = aiApiClient;
    }

    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] string message)
    {
        try
        {
            _logger.LogDebug("CALLED: Chat(message={Message})", message);
            var responseText = await _aiApiClient.SendRequestAsync(message, CancellationToken.None);
            return Ok(new { Success = true, Data = responseText });
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
