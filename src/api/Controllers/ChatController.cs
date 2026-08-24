using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Categories;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;
using System.Text.Json;
using FarmPlus.Api.Dtos.Telegram;
using FarmPlus.Api.Dtos.Facebook;

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

    [HttpGet("webhook")]
    public IActionResult VerifyWebhook(
        [FromQuery(Name = "hub.mode")] string hubMode,
        [FromQuery(Name = "hub.verify_token")] string verifyToken,
        [FromQuery(Name = "hub.challenge")] string challenge)
    {
        _logger.LogDebug("CALLED: VerifyWebhook(hubMode={HubMode}, verifyToken={VerifyToken}, challenge={Challenge})", hubMode, verifyToken, challenge);
        var expectedVerifyToken = _configuration["Facebook:VerifyToken"];

        _logger.LogInformation("Webhook verification requested with token: {Token}", verifyToken);

        if (hubMode == "subscribe" && verifyToken == expectedVerifyToken)
        {
            _logger.LogInformation("Webhook successfully verified.");
            // Facebook expects raw text string of the hub.challenge back with 200 OK
            return Ok(challenge); 
        }

        _logger.LogWarning("Webhook verification failed. Token mismatch.");
        return Unauthorized();
    }

    /// <summary>
    /// POST Endpoint: Receives incoming messages from Facebook Messenger users
    /// </summary>
    [HttpPost("webhook")]
    public async Task<IActionResult> ReceiveMessage([FromBody] FacebookWebhookPayload payload)
    {
        try
        {
            // Verify this event comes from a page subscription
            _logger.LogDebug("CALLED: ReceiveMessage(payload={Payload})", payload);
            _logger.LogDebug("Received Facebook webhook payload: {Payload}", JsonSerializer.Serialize(payload));
            if (payload.Object != "page")
            {
                return NotFound();
            }

            if (payload.Entry == null) return Ok();

            foreach (var entry in payload.Entry)
            {
                if (entry.Messaging == null) continue;

                foreach (var messagingEvent in entry.Messaging)
                {
                    var senderId = messagingEvent.Sender?.Id;
                    var userText = messagingEvent.Message?.Text;

                    // Skip echo messages or events without text
                    if (string.IsNullOrEmpty(senderId) || string.IsNullOrEmpty(userText))
                    {
                        continue;
                    }

                    _logger.LogInformation("Facebook Message from {SenderId}: {Text}", senderId, userText);

                    // Get response from AI client
                    var aiResponse = await _aiApiClient.SendRequestAsync(userText, CancellationToken.None);

                    // Reply back to Facebook Messenger
                    await SendFacebookMessageAsync(senderId, aiResponse);
                }
            }

            // Always return 200 OK to Meta immediately
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Facebook webhook event.");
            return Ok(); // Return 200 OK so Facebook does not disable the webhook
        }
    }
    
    private async Task SendFacebookMessageAsync(string recipientId, string messageText)
    {
        _logger.LogDebug("CALLED: SendFacebookMessageAsync(recipientId={RecipientId}, messageText={MessageText})", recipientId, messageText);
        var pageAccessToken = _configuration["Facebook:PageAccessToken"];
        var endpoint = $"https://graph.facebook.com/v19.0/me/messages?access_token={pageAccessToken}";

        var requestBody = new
        {
            recipient = new { id = recipientId },
            message = new { text = messageText?.Length > 2000 ? messageText.Substring(0, 2000) : messageText } // Facebook has a character limit for messages
        };

        var httpClient = _httpClientFactory.CreateClient();
        var response = await httpClient.PostAsJsonAsync(endpoint, requestBody);

        if (!response.IsSuccessStatusCode)
        {
            var errorDetails = await response.Content.ReadAsStringAsync();
            _logger.LogError("Facebook Send API Error: {Status} - {Body}", response.StatusCode, errorDetails);
        }
    }
}
