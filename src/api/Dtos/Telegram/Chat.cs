namespace FarmPlus.Api.Dtos.Telegram;
using System.Text.Json.Serialization;

public sealed record Chat
{
    [JsonPropertyName("text")]
    public string? Text { get; init; }
    [JsonPropertyName("id")]
    public long Id { get; init; }
}