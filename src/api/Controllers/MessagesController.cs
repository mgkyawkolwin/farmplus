using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Dtos.Messages;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Services;

namespace FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly ILogger<MessagesController> _logger;

    public MessagesController(IMessageService messageService, ILogger<MessagesController> logger)
    {
        _messageService = messageService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetMessages([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _messageService.GetMessagesAsync(page, pageSize);
            return Ok(new
            {
                Success = true,
                Data = new
                {
                    Items = result.Items,
                    Page = result.Page,
                    PageSize = result.PageSize,
                    TotalCount = result.Total,
                    TotalPages = result.TotalPages,
                },
            });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve the current user's messages.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        try
        {
            return Ok(new { Success = true, Data = new { UnreadCount = await _messageService.GetUnreadCountAsync() } });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve unread message count.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{customerMessageId:guid}")]
    public async Task<IActionResult> GetMessage(Guid customerMessageId)
    {
        try
        {
            var message = await _messageService.GetMessageAsync(customerMessageId);
            return message == null
                ? NotFound(new { Success = false, Message = "Message was not found." })
                : Ok(new { Success = true, Data = message });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve message {CustomerMessageId}.", customerMessageId);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPatch("{customerMessageId:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid customerMessageId)
    {
        try
        {
            await _messageService.MarkReadAsync(customerMessageId);
            return Ok(new { Success = true, Message = "Message marked as read." });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark message {CustomerMessageId} as read.", customerMessageId);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPatch("{customerMessageId:guid}/unread")]
    public async Task<IActionResult> MarkUnread(Guid customerMessageId)
    {
        try
        {
            await _messageService.MarkUnreadAsync(customerMessageId);
            return Ok(new { Success = true, Message = "Message marked as unread." });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark message {CustomerMessageId} as unread.", customerMessageId);
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateMessage([FromBody] CreateMessageRequestDto request)
    {
        try
        {
            var message = await _messageService.CreateMessageAsync(request);
            return Ok(new { Success = true, Data = message });
        }
        catch (CustomException ex)
        {
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send a message.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}