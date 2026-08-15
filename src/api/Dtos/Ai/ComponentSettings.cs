namespace FarmPlus.Api.Dtos.Ai;

public class ComponentSettings
{
    public string DefaultModel { get; set; } = string.Empty;
    public string DefaultModelHandler { get; set; } = string.Empty;
    public int DefaultTimeoutMs { get; set; } = 10000;
    public string SchemaPath { get; set; } = string.Empty;

    // Changed from Dictionary to List to match the JSON array [ ]
    public List<ModelSettings> Models { get; set; } = new();
}