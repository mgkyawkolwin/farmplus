namespace FarmPlus.Api.Dtos.Ai;

public class ModelSettings
{
    // Per-model URL and payload config for downstream API.
    public string Model { get; set; } = string.Empty;
    public string AgentAPIUrl { get; set; } = string.Empty;

    // Optional headers for the downstream API.
    public Dictionary<string, string>? Headers { get; set; }

    // Base payload to send in API request; model-specific values can be merged with runtime values.
    public CommonAPIRequestPayload? Payload { get; set; }
}

