using System.Text.Json.Serialization;

namespace FarmPlus.Api.Dtos.Ai;

public class CommonAPIRequestPayload
{
    [JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;

    [JsonPropertyName("prompt")]
    public string Prompt { get; set; } = string.Empty;

    [JsonPropertyName("stream")]
    public bool? Stream { get; set; }

    [JsonPropertyName("think")]
    public bool? Think { get; set; }

    [JsonPropertyName("system_instruction")]
    public GeminiInstruction? SystemInstruction { get; set; }

    [JsonPropertyName("contents")]
    public List<GeminiContent> Contents { get; set; } = [];

    public CommonAPIRequestPayload Clone()
    {
        var json = System.Text.Json.JsonSerializer.Serialize(this);
        return System.Text.Json.JsonSerializer.Deserialize<CommonAPIRequestPayload>(json)
            ?? new CommonAPIRequestPayload();
    }
}