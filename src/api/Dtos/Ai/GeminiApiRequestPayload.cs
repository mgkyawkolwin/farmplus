
using System.Text.Json.Serialization;

namespace FarmPlus.Api.Dtos.Ai;

public class GeminiApiRequestPayload
{
    [JsonPropertyName("system_instruction")]
    public GeminiInstruction? SystemInstruction { get; set; }

    [JsonPropertyName("contents")]
    public List<GeminiContent> Contents { get; set; } = [];

    public GeminiApiRequestPayload Clone()
    {
        var json = System.Text.Json.JsonSerializer.Serialize(this);
        return System.Text.Json.JsonSerializer.Deserialize<GeminiApiRequestPayload>(json) ?? new GeminiApiRequestPayload();
    }
}