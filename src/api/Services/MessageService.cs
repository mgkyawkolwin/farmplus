using Microsoft.EntityFrameworkCore;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Messages;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface IMessageService
{
    Task<CreatedMessageDto> CreateMessageAsync(CreateMessageRequestDto request);
    Task<PaginatedResultDto<MessageInboxDto>> GetMessagesAsync(int page, int pageSize);
    Task<MessageInboxDto?> GetMessageAsync(Guid customerMessageId);
    Task<int> GetUnreadCountAsync();
    Task MarkReadAsync(Guid customerMessageId);
    Task MarkUnreadAsync(Guid customerMessageId);
}

public class MessageService : IMessageService
{
    private const string SingleAudience = "Single";
    private const string BroadcastAudience = "Broadcast";
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public MessageService(AppDbContext dbContext, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<CreatedMessageDto> CreateMessageAsync(CreateMessageRequestDto request)
    {
        if (!_currentUserService.IsAdmin)
        {
            throw new CustomException("Only an admin can send messages.");
        }
        if (!Guid.TryParse(_currentUserService.UserId, out var adminUserId))
        {
            throw new CustomException("Invalid admin session.");
        }
        if (!await _dbContext.AdminUsers.AsNoTracking().AnyAsync(adminUser => adminUser.Id == adminUserId))
        {
            throw new CustomException("Admin user was not found.");
        }

        var title = request.Title?.Trim();
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new CustomException("Message title is required.");
        }
        if (title.Length > 200)
        {
            throw new CustomException("Message title cannot exceed 200 characters.");
        }

        var text = request.MessageText?.Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new CustomException("Message text is required.");
        }
        if (text.Length > 4000)
        {
            throw new CustomException("Message text cannot exceed 4000 characters.");
        }

        var audience = request.Audience?.Trim();
        var isBroadcast = string.Equals(audience, BroadcastAudience, StringComparison.OrdinalIgnoreCase);
        var isSingle = string.Equals(audience, SingleAudience, StringComparison.OrdinalIgnoreCase);
        if (!isBroadcast && !isSingle)
        {
            throw new CustomException("Audience must be Single or Broadcast.");
        }
        if (isSingle && !request.TargetUserId.HasValue)
        {
            throw new CustomException("A target user is required for a single-recipient message.");
        }
        if (isBroadcast && request.TargetUserId.HasValue)
        {
            throw new CustomException("A broadcast message cannot specify a target user.");
        }

        var recipients = isBroadcast
            ? await _dbContext.Users.AsNoTracking()
                .Select(user => user.Id)
                .ToListAsync()
            : await _dbContext.Users.AsNoTracking()
                .Where(user => user.Id == request.TargetUserId!.Value)
                .Select(user => user.Id)
                .ToListAsync();
        if (isSingle && recipients.Count == 0)
        {
            throw new CustomException("Target user was not found.");
        }

        var now = DateTime.UtcNow;
        var message = new MessageEntity
        {
            Title = title,
            Audience = isBroadcast ? BroadcastAudience : SingleAudience,
            MessageText = text,
            TargetUserId = isBroadcast ? null : request.TargetUserId,
            CreatedById = adminUserId,
            UpdatedById = adminUserId,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        _dbContext.Messages.Add(message);
        await _dbContext.SaveChangesAsync();

        _dbContext.CustomerMessages.AddRange(recipients.Select(recipient => new CustomerMessageEntity
        {
            MessageId = message.Id,
            UserId = recipient,
            IsRead = false,
            CreatedById = adminUserId,
            UpdatedById = adminUserId,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        }));
        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return new CreatedMessageDto
        {
            Id = message.Id,
            Title = message.Title,
            Audience = message.Audience,
            RecipientCount = recipients.Count,
            CreatedAtUtc = message.CreatedAtUtc,
        };
    }

    public async Task<PaginatedResultDto<MessageInboxDto>> GetMessagesAsync(int page, int pageSize)
    {
        var userId = GetCurrentUserId();
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = from recipient in _dbContext.CustomerMessages.AsNoTracking()
                    join message in _dbContext.Messages.AsNoTracking() on recipient.MessageId equals message.Id
                    where recipient.UserId == userId
                    orderby recipient.CreatedAtUtc descending
                    select new MessageInboxDto
                    {
                        Id = recipient.Id,
                        MessageId = message.Id,
                        Title = message.Title,
                        MessageText = message.MessageText,
                        Audience = message.Audience,
                        SentAtUtc = message.CreatedAtUtc,
                        IsRead = recipient.IsRead,
                        ReadAtUtc = recipient.ReadAtUtc,
                    };

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return new PaginatedResultDto<MessageInboxDto>(items, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public Task<int> GetUnreadCountAsync()
    {
        var userId = GetCurrentUserId();
        return _dbContext.CustomerMessages.AsNoTracking()
            .CountAsync(message => message.UserId == userId && !message.IsRead);
    }

    public async Task<MessageInboxDto?> GetMessageAsync(Guid customerMessageId)
    {
        var userId = GetCurrentUserId();
        return await (
            from recipient in _dbContext.CustomerMessages.AsNoTracking()
            join message in _dbContext.Messages.AsNoTracking() on recipient.MessageId equals message.Id
            where recipient.Id == customerMessageId && recipient.UserId == userId
            select new MessageInboxDto
            {
                Id = recipient.Id,
                MessageId = message.Id,
                Title = message.Title,
                MessageText = message.MessageText,
                Audience = message.Audience,
                SentAtUtc = message.CreatedAtUtc,
                IsRead = recipient.IsRead,
                ReadAtUtc = recipient.ReadAtUtc,
            }
        ).SingleOrDefaultAsync();
    }

    public async Task MarkReadAsync(Guid customerMessageId)
    {
        var userId = GetCurrentUserId();
        var message = await _dbContext.CustomerMessages
            .SingleOrDefaultAsync(item => item.Id == customerMessageId && item.UserId == userId)
            ?? throw new CustomException("Message was not found.");

        if (message.IsRead) return;
        message.IsRead = true;
        message.ReadAtUtc = DateTime.UtcNow;
        message.UpdatedAtUtc = DateTime.UtcNow;
        message.UpdatedById = userId;
        await _dbContext.SaveChangesAsync();
    }

    public async Task MarkUnreadAsync(Guid customerMessageId)
    {
        var userId = GetCurrentUserId();
        var message = await _dbContext.CustomerMessages
            .SingleOrDefaultAsync(item => item.Id == customerMessageId && item.UserId == userId)
            ?? throw new CustomException("Message was not found.");

        if (!message.IsRead) return;
        message.IsRead = false;
        message.ReadAtUtc = null;
        message.UpdatedAtUtc = DateTime.UtcNow;
        message.UpdatedById = userId;
        await _dbContext.SaveChangesAsync();
    }

    private Guid GetCurrentUserId() =>
        Guid.TryParse(_currentUserService.UserId, out var userId)
            ? userId
            : throw new CustomException("Invalid session user.");
}