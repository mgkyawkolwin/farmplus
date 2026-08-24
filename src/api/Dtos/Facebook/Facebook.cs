using System.Text.Json.Serialization;

namespace FarmPlus.Api.Dtos.Facebook;

public record FacebookWebhookPayload(
    [property: JsonPropertyName("object")] string? Object,
    [property: JsonPropertyName("entry")] List<FacebookEntry>? Entry
);

public record FacebookEntry(
    [property: JsonPropertyName("id")] string? Id,
    [property: JsonPropertyName("time")] long Time,
    [property: JsonPropertyName("messaging")] List<FacebookMessaging>? Messaging
);

public record FacebookMessaging(
    [property: JsonPropertyName("sender")] FacebookUser? Sender,
    [property: JsonPropertyName("recipient")] FacebookUser? Recipient,
    [property: JsonPropertyName("timestamp")] long Timestamp,
    [property: JsonPropertyName("message")] FacebookMessage? Message
);

public record FacebookUser(
    [property: JsonPropertyName("id")] string? Id
);

public record FacebookMessage(
    [property: JsonPropertyName("mid")] string? Mid,
    [property: JsonPropertyName("text")] string? Text
);