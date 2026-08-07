using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.Services.AddScoped(sp => new HttpClient 
{ 
    BaseAddress = new Uri("https://127.0.0.1:5555/api/") 
});

await builder.Build().RunAsync();
