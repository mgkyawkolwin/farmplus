namespace FarmPlus.Api.Dtos.Telegram;
using System.Text.Json.Serialization;
public sealed record Update
{
    [JsonPropertyName("message")]
    public Message? Message { get; set; }
    [JsonPropertyName("update_id")]
    public long UpdateId { get; set; }
}