using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Ai;
using Microsoft.Extensions.Options;

namespace FarmPlus.Api.Services;

public class GeminiApiClient : IAiApiClient
{
    private readonly ComponentSettings _settings;
    private readonly ILogger<GeminiApiClient> _logger;
    private readonly HttpClient _httpClient;
    private readonly GeminiApiRequestPayload? _apiPayload;
    private readonly ModelSettings? _modelSetting;

    public GeminiApiClient(IOptions<ComponentSettings> options, ILogger<GeminiApiClient> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _settings = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger.LogDebug("ComponentSettings loaded: {@Settings}", JsonSerializer.Serialize(_settings));
        _modelSetting = _settings.Models.FirstOrDefault(m => m.Model.Equals(_settings.DefaultModel, StringComparison.OrdinalIgnoreCase));
        _logger.LogDebug("Model-specific settings for model {Model}: {@ModelSetting}", _settings.DefaultModel, JsonSerializer.Serialize(_modelSetting));

        // build typed payload if available
        if (_modelSetting?.Payload != null)
        {
            _apiPayload = JsonSerializer.Deserialize<GeminiApiRequestPayload>(JsonSerializer.Serialize(_modelSetting.Payload), new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        _logger.LogDebug("Model-specific API payload for model {Model}: {@ApiPayload}", _settings.DefaultModel, JsonSerializer.Serialize(_apiPayload));
        if (_apiPayload == null) throw new InvalidOperationException("API payload is required for GeminiAPIClient but was not found or could not be deserialized.");

        var timeoutMs = _settings.DefaultTimeoutMs > 0 ? _settings.DefaultTimeoutMs : 30000;
        _httpClient = new HttpClient { Timeout = TimeSpan.FromMilliseconds(timeoutMs) };

        _logger.LogInformation("GeminiApiClient initialized for model {Model} with timeout {TimeoutMs}ms", _modelSetting?.Model ?? _settings.DefaultModel, timeoutMs);
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }

    public GeminiApiRequestPayload PreparePayload(string prompt)
    {
        var requestPayload = _apiPayload?.Clone() ?? new GeminiApiRequestPayload();

        string baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
        string filePath = Path.Combine(baseDirectory, "system-prompt.txt");

        var systemInstructionText = File.ReadAllText(filePath).Trim();
        requestPayload.SystemInstruction = new GeminiInstruction
        {
            Parts =
            [
                new GeminiTextPart { Text = systemInstructionText }
            ]
        };

        var content = new GeminiContent
        {
            Parts =
            [
                new GeminiTextPart { Text = prompt }
            ]
        };

        requestPayload.Contents.Clear();
        requestPayload.Contents.Add(content);

        return requestPayload;
    }

    public async Task<string?> SendRequestAsync(
        string prompt,
        CancellationToken cancellationToken,
        IAiApiClient.OnAiApiStreamResponseReceived? streamResponseReceivedCallback = null)
    {
        var requestPayload = PreparePayload(prompt);
        _logger.LogDebug("Prepared request payload for model {Model}: {@RequestPayload}", _settings.DefaultModel, JsonSerializer.Serialize(requestPayload));

        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, _modelSetting?.AgentAPIUrl)
        {
            Content = JsonContent.Create(requestPayload, mediaType: null, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            })
        };

        requestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        if (_modelSetting?.Headers != null)
        {
            foreach (var h in _modelSetting.Headers)
            {
                requestMessage.Headers.TryAddWithoutValidation(h.Key, h.Value);
            }
        }

        using var apiResponse = await _httpClient.SendAsync(requestMessage, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

        if (!apiResponse.IsSuccessStatusCode)
        {
            var errorText = await apiResponse.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("[GeminiAPIHandler] API responded with error {StatusCode}: {ErrorText}", (int)apiResponse.StatusCode, errorText);
            throw new HttpRequestException($"Unable to call Gemini API ({(int)apiResponse.StatusCode}): {errorText}");
        }

        var apiResponseContent = await apiResponse.Content.ReadAsStringAsync(cancellationToken);
        _logger.LogDebug("[GeminiAPIHandler] raw API response length {Length}", apiResponseContent.Length);
        _logger.LogDebug("[GeminiAPIHandler] raw API response content: {ApiResponseContent}", apiResponseContent.Length > 500 ? apiResponseContent.Substring(0, 500) + "..." : apiResponseContent);

        if (streamResponseReceivedCallback != null)
        {
            // we currently do not support incremental streaming for Gemini; invoke once for compatibility
            //await streamResponseReceivedCallback(apiResponseContent);
        }

        var extractedResponse = ExtractResponseText(apiResponseContent);
        _logger.LogDebug("[GeminiAPIHandler] extracted response text: {ResponseText}", extractedResponse.Length > 500 ? extractedResponse.Substring(0, 500) + "..." : extractedResponse);

        //var parsedApiResponse = ParseApiResponse(extractedResponse);
        return extractedResponse;
    }

    private string ExtractResponseText(string apiResponseContent)
    {
        _logger.LogTrace("Extracting response text from raw API response content");
        _logger.LogDebug("Raw API response content: {ApiResponseContent}", apiResponseContent.Length > 500 ? apiResponseContent.Substring(0, 500) + "..." : apiResponseContent);
        if (string.IsNullOrWhiteSpace(apiResponseContent))
        {
            return string.Empty;
        }

        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var parsed = JsonSerializer.Deserialize<GeminiApiResponse>(apiResponseContent, options);
            _logger.LogDebug("Parsed API response into GeminiApiResponse object: {@ParsedResponse}", parsed);
            if (parsed != null)
            {
                var sb = new StringBuilder();

                if (parsed.Candidates != null && parsed.Candidates.Count > 0)
                {
                    foreach (var candidate in parsed.Candidates)
                    {
                        if (candidate?.Content?.Parts != null && candidate.Content.Parts.Count > 0)
                        {
                            foreach (var part in candidate.Content.Parts)
                            {
                                if (!string.IsNullOrWhiteSpace(part?.Text))
                                    sb.Append(part.Text);
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(candidate?.Text))
                        {
                            sb.Append(candidate.Text);
                        }
                    }

                    if (sb.Length > 0)
                    {
                        _logger.LogDebug("Extracted response text from candidates content and text fields: {ExtractedText}", sb.Length > 500 ? sb.ToString().Substring(0, 500) + "..." : sb.ToString());
                        return sb.ToString();
                    }
                }

                if (!string.IsNullOrWhiteSpace(parsed.Text))
                {
                    _logger.LogDebug("Extracted response text from parsed.Text: {ExtractedText}", parsed.Text.Length > 500 ? parsed.Text.Substring(0, 500) + "..." : parsed.Text);
                    return parsed.Text;
                }

                if (parsed.Response.HasValue)
                {
                    var responseElement = parsed.Response.Value;
                    if (responseElement.ValueKind == JsonValueKind.String)
                    {
                        _logger.LogDebug("Extracted response text from parsed.Response as string: {ExtractedText}", responseElement.GetString()?.Length > 500 ? responseElement.GetString()?.Substring(0, 500) + "..." : responseElement.GetString());
                        return responseElement.GetString() ?? string.Empty;
                    }

                    _logger.LogDebug("Extracted response text from parsed.Response as raw JSON: {ExtractedText}", responseElement.GetRawText().Length > 500 ? responseElement.GetRawText().Substring(0, 500) + "..." : responseElement.GetRawText());
                    return responseElement.GetRawText();
                }
            }

            var rawString = JsonSerializer.Deserialize<string>(apiResponseContent, options);
            if (!string.IsNullOrEmpty(rawString))
            {
                _logger.LogDebug("Extracted response text from raw string: {ExtractedText}", rawString.Length > 500 ? rawString.Substring(0, 500) + "..." : rawString);
                return rawString;
            }

            return apiResponseContent;
        }
        catch (JsonException)
        {
            return apiResponseContent;
        }
    }

    // private ApiClientResponse? ParseApiResponse(string responseText)
    // {
    //     _logger.LogTrace("CALLED: ParseApiResponse()");
    //     if (string.IsNullOrWhiteSpace(responseText))
    //     {
    //         throw new InvalidOperationException("AI response is empty");
    //     }

    //     var cleaned = responseText.Trim()
    //         .Replace("```json", string.Empty, StringComparison.OrdinalIgnoreCase)
    //         .Replace("```", string.Empty, StringComparison.OrdinalIgnoreCase)
    //         .Trim();

    //     var apiResponse = JsonSerializer.Deserialize<ApiClientResponse>(cleaned, new JsonSerializerOptions
    //     {
    //         PropertyNameCaseInsensitive = true,
    //         AllowTrailingCommas = true
    //     });

    //     _logger.LogDebug("Parsed API Response: {@ApiResponse}", JsonSerializer.Serialize(apiResponse));

    //     return apiResponse;
    // }
}