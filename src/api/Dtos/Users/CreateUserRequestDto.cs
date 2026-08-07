namespace FarmPlus.Api.Dtos.Users;

public sealed record CreateUserRequestDto
{
    public string? UserName { get; set; }
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
}
