namespace FarmPlus.AdminClient.Dtos.Users;

public sealed record UserDto
{
    public Guid Id { get; init; }
    public string? UserName { get; init; }
    public string? DisplayName { get; init; }
    public string? Email { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
    public double? Rating { get; init; }
    public int? RatingCount { get; init; }
    public string? ProfilePictureUrl { get; init; }
}
