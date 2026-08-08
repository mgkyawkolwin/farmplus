using System.Globalization;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.FluentUI.AspNetCore.Components;
using Microsoft.JSInterop;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.Services.AddScoped(sp => new HttpClient 
{ 
    BaseAddress = new Uri("https://farmplusapi.bitsbytes.solutions") 
});

// builder.Services.AddSingleton<IToastService, ToastService>();
// builder.Services.AddSingleton<IDialogService, DialogService>();
builder.Services.AddFluentUIComponents();
builder.Services.AddLocalization(options =>
{
    options.ResourcesPath = "";
});



var host = builder.Build();

// 1. Read the culture cookie using JS Interop
var js = host.Services.GetRequiredService<IJSRuntime>();
var cookieHeader = await js.InvokeAsync<string>("eval", "document.cookie");

string? selectedCulture = null;

if (!string.IsNullOrEmpty(cookieHeader))
{
    // Search for .AspNetCore.Culture cookie value (e.g., c=my-MM|uic=my-MM)
    var cultureCookie = cookieHeader
        .Split("; ")
        .FirstOrDefault(c => c.StartsWith(".AspNetCore.Culture="));

    if (cultureCookie != null)
    {
        var value = Uri.UnescapeDataString(cultureCookie.Split('=')[1]);
        // Extract culture from "c=my-MM|uic=my-MM"
        var cultureMatch = System.Text.RegularExpressions.Regex.Match(value, @"c=([a-zA-Z\-]+)");
        if (cultureMatch.Success)
        {
            selectedCulture = cultureMatch.Groups[1].Value;
        }
    }
}

// 2. Fallback to default if no cookie exists
selectedCulture ??= "en-US";

// 3. Set the active Culture on the WebAssembly runtime threads
var cultureInfo = new CultureInfo(selectedCulture);
CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;

await host.RunAsync();
