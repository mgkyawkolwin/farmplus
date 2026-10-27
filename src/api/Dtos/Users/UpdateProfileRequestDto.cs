namespace FarmPlus.Api.Dtos.Users;

public sealed record UpdateProfileRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? NationalId { get; set; }
    public string? PassportNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
}
