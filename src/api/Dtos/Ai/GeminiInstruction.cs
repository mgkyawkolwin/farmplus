using System.Text.Json.Serialization;

namespace FarmPlus.Api.Dtos.Ai;

public class GeminiInstruction
{
    [JsonPropertyName("parts")]
    public List<GeminiTextPart> Parts { get; set; } = new();
}