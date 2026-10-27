namespace FarmPlus.Api.Dtos.Users;

public sealed record ResetUserPasswordRequestDto
{
    public string NewPassword { get; set; } = string.Empty;
}