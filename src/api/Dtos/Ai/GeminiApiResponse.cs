using System.Text.Json;
using System.Text.Json.Serialization;

namespace FarmPlus.Api.Dtos.Ai;

public class GeminiApiResponse
{
    [JsonPropertyName("candidates")]
    public List<GeminiCandidate>? Candidates { get; set; }

    [JsonPropertyName("response")]
    public JsonElement? Response { get; set; }

    [JsonPropertyName("text")]
    public string? Text { get; set; }
}