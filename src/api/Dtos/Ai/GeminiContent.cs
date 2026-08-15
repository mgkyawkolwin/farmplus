namespace FarmPlus.Api.Dtos.Ai;

using System.Text.Json.Serialization;

public class GeminiContent
{
    [JsonPropertyName("parts")]
    public List<GeminiTextPart> Parts { get; set; } = new();
}