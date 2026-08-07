using FarmPlus.Admin.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using BlazorWasm;
using Cluspedia.FarmPlus.Api.Dtos;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Localization;
using Microsoft.FluentUI.AspNetCore.Components;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");


builder.Services.AddLocalization(options => options.ResourcesPath = "");

builder.Services.AddSingleton<ToastService>();
builder.Services.AddSingleton<DialogService>();
builder.Services.AddFluentUIComponents();

builder.Services.AddHttpContextAccessor();

// builder.Services.AddHttpClient();
// builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
//     .AddCookie(options =>
//     {
//         options.LoginPath = "/auth/signin";
//         options.AccessDeniedPath = "/auth/signin";
//         options.Cookie.Name = "bikerhub.admin.auth";
//         options.Cookie.HttpOnly = true;
//         options.Cookie.SameSite = SameSiteMode.Lax;
//         options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
//     });
// builder.Services.AddAuthorization();
// builder.Services.AddCascadingAuthenticationState();
// builder.Services.AddCascadingValue(sp => 
//     sp.GetRequiredService<IHttpContextAccessor>().HttpContext);

// Add services to the container.
// builder.Services.AddRazorComponents()
//     .AddInteractiveServerComponents();

// Localization configuration
var supportedCultures = new[] { "en-US", "my-MM" };
var localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture(supportedCultures[0])
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

var apiBaseUrl = builder.Configuration["ApiBaseUrl"]?.Trim();
if (string.IsNullOrWhiteSpace(apiBaseUrl))
{
    apiBaseUrl = builder.HostEnvironment.BaseAddress;
}

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(apiBaseUrl) });
builder.Services.AddScoped<BikerHub.Services.IAdminUserService, BikerHub.Services.AdminUserService>();
builder.Services.AddScoped<BikerHub.Services.IUserService, BikerHub.Services.UserService>();
builder.Services.AddScoped<BikerHub.Services.IAuthService, BikerHub.Services.AuthService>();

var app = builder.Build();
await app.RunAsync();

