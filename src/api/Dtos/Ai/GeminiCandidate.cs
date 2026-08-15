using System.Text.Json.Serialization;

namespace FarmPlus.Api.Dtos.Ai;

public class GeminiCandidate
    {
        [JsonPropertyName("text")]
        public string? Text { get; set; }

        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }
    }

    