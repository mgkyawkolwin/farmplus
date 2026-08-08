using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
// using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.FluentUI.AspNetCore.Components;
// using Microsoft.IdentityModel.Tokens;
// using Microsoft.OpenApi.Models;

using Pomelo.EntityFrameworkCore.MySql;

using FarmPlus.Admin.Components;
// using FarmPlus.Api.Data;
// using FarmPlus.Api.Entities;
// using FarmPlus.Api.Dtos.Users;
// using FarmPlus.Api.Dtos.AdminUsers;
// using FarmPlus.Api.Models;
// using FarmPlus.Api.Services;
using Microsoft.AspNetCore.Localization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped(sp => new HttpClient 
{ 
    BaseAddress = new Uri("https://farmplusapi.bitsbytes.solutions")  // new Uri("https://127.0.0.1:5555/api/") 
});

builder.Services.AddLocalization(options => options.ResourcesPath = "");

// Configure supported cultures
var supportedCultures = new[] { "en-US", "mm-MY" };
var localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture(supportedCultures[0])
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);


// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();


// Custom Services

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
// var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
//     ?? throw new InvalidOperationException("JwtSettings section is missing from configuration.");
// var googleAuthSettings = builder.Configuration.GetSection("GoogleAuth").Get<GoogleAuthSettings>()
//     ?? throw new InvalidOperationException("GoogleAuth section is missing from configuration.");
// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseMySql(connectionString, ServerVersion.Parse("8.0.32-mysql")));

// builder.Services.AddAuthentication(options =>
// {
//     options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//     options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
// })
// .AddJwtBearer(options =>
// {
//     options.RequireHttpsMetadata = false;
//     options.SaveToken = true;
//     options.TokenValidationParameters = new TokenValidationParameters
//     {
//         ValidateIssuer = true,
//         ValidateAudience = true,
//         ValidateIssuerSigningKey = true,
//         ValidateLifetime = true,
//         ValidIssuer = jwtSettings.Issuer,
//         ValidAudience = jwtSettings.Audience,
//         IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
//     };
// });

builder.Services.AddFluentUIComponents();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/auth/signin";
        options.AccessDeniedPath = "/auth/signin";
        options.Cookie.Name = ".farmplus.auth";
        // options.Cookie.Domain = ".bitsbytes.solutions";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // Use Secure cookies if the request is HTTPS
    });
builder.Services.AddAuthorization();
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddLocalization(options => options.ResourcesPath = "");
// builder.Services.AddSingleton(jwtSettings);
// builder.Services.AddSingleton(googleAuthSettings);
// builder.Services.AddScoped<IAuthService, AuthService>();
// builder.Services.AddScoped<IPasswordHasher<UserEntity>, PasswordHasher<UserEntity>>();
// builder.Services.AddScoped<IPasswordHasher<AdminUserEntity>, PasswordHasher<AdminUserEntity>>();


// builder.Services.AddSingleton<ToastService>();
// builder.Services.AddSingleton<DialogService>();
builder.Services.AddFluentUIComponents();

var app = builder.Build();

app.UseRequestLocalization(localizationOptions);
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();

app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(FarmPlus.AdminClient._Imports).Assembly);


app.MapGet("/Culture/Set", (string culture, string redirectUri, HttpContext httpContext) =>
{
    Console.WriteLine($"Culture set to: {culture}, Redirect URI: {redirectUri}");
    if (!string.IsNullOrEmpty(culture))
    {
        var cookieValue = CookieRequestCultureProvider.MakeCookieValue(new RequestCulture(culture));

        httpContext.Response.Cookies.Append(
            CookieRequestCultureProvider.DefaultCookieName,
            cookieValue,
            new CookieOptions { Expires = DateTimeOffset.UtcNow.AddYears(1), IsEssential = true }
        );
    }

    // Convert absolute URLs back to local relative paths, or fallback to "/"
    string target = "/";
    
    if (!string.IsNullOrEmpty(redirectUri))
    {
        // Uri.TryCreate extracts just the Path and Query if a full absolute URL was passed
        if (Uri.TryCreate(redirectUri, UriKind.RelativeOrAbsolute, out var parsedUri))
        {
            target = parsedUri.IsAbsoluteUri ? parsedUri.PathAndQuery : redirectUri;
        }
    }

    // Standard Redirect safely accepts both local and absolute URLs
    return Results.Redirect(target);
});

app.Run();
