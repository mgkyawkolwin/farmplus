using System.Text.Json.Serialization;

namespace FarmPlus.Api.Dtos.Ai;

public class GeminiTextPart
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}