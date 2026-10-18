namespace FarmPlus.Api.Dtos.Messages;

public sealed record CreateMessageRequestDto
{
    public string? MessageText { get; set; }
    public string? Audience { get; set; }
    public Guid? TargetUserId { get; set; }
}