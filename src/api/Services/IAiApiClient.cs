namespace FarmPlus.Api.Services;

public interface IAiApiClient : IDisposable
{
    public delegate Task OnAiApiStreamResponseReceived(string rawApiResponse);

    Task<string?> SendRequestAsync(
        string prompt,
        CancellationToken cancellationToken,
        OnAiApiStreamResponseReceived? streamResponseReceivedCallback = null);
}