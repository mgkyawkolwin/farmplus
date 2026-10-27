namespace FarmPlus.Api.Dtos.Messages;

public sealed record MessageInboxDto
{
    public Guid Id { get; set; }
    public Guid MessageId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string MessageText { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public DateTime SentAtUtc { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAtUtc { get; set; }
}