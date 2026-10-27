namespace FarmPlus.Api.Dtos.Messages;

public sealed record CreatedMessageDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int RecipientCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}