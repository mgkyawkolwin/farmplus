using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Categories;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;
using System.Text.Json;
using FarmPlus.Api.Dtos.Telegram;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : BaseController
{
    private readonly ILogger<ChatController> _logger;
    private readonly IAiApiClient _aiApiClient;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public ChatController(ILogger<ChatController> logger, IAiApiClient aiApiClient, IConfiguration configuration, IHttpClientFactory httpClientFactory) : base(logger)
    {
        _logger = logger;
        _aiApiClient = aiApiClient;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    [Authorize]
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

    [HttpPost("telegram-webhook")]
    public async Task<IActionResult> TelegramWebHook([FromBody] Update update)
    {
        try
        {
            _logger.LogDebug("CALLED: TelegramWebHook(message={Message})", update);
            _logger.LogDebug("Received message from Telegram: {Message}", JsonSerializer.Serialize(update));
            var responseText = await _aiApiClient.SendRequestAsync(update?.Message?.Text ?? "Empty user message. Don't reply anything.", CancellationToken.None);
            _logger.LogDebug("Response from AI API: {ResponseText}", responseText);
            var telegramEndPoint = $"https://api.telegram.org/bot{_configuration["TelegramBotApiKey"]}/sendMessage";
            var responsePayload = new
            {
                chat_id = update?.Message?.Chat?.Id,
                text = responseText
            };
            var httpClient = _httpClientFactory.CreateClient();
            var response = await httpClient.PostAsJsonAsync(telegramEndPoint, responsePayload);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to send message to Telegram. Status: {Status}, Body: {Body}", response.StatusCode, errorContent);
            }
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
