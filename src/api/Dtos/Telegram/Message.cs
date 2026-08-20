namespace FarmPlus.Api.Dtos.Telegram;
using System.Text.Json.Serialization;
public sealed record Message
{
    [JsonPropertyName("chat")]
    public Chat? Chat { get; set; }
    [JsonPropertyName("message_id")]
    public long MessageId { get; set; }
    [JsonPropertyName("text")]
    public string? Text { get; set; }
}