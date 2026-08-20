using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

using FarmPlus.Api.Data;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Models;
using FarmPlus.Api.Services;
using FarmPlus.Api.Filters;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using FarmPlus.Api.Caching;
using FarmPlus.Api.Dtos.Ai;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JwtSettings section is missing from configuration.");
var googleAuthSettings = builder.Configuration.GetSection("GoogleAuth").Get<GoogleAuthSettings>()
    ?? throw new InvalidOperationException("GoogleAuth section is missing from configuration.");

builder.Services.AddHttpClient(); // Register IHttpClientFactory for dependency injection

// Caching
builder.Services.AddOutputCache(options =>
{
    options.AddPolicy(CachePolicyKeys.StrictPerUserCache, policy =>
    {
        policy.Expire(TimeSpan.FromMinutes(5))
              .SetVaryByQuery("*")
              .VaryByValue((context) =>
              {
                  // 1. Get the unique User ID from JWT Claims (e.g., ClaimTypes.NameIdentifier or "sub")
                  var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                               ?? context.User?.FindFirst("sub")?.Value;

                  // 2. If unauthenticated, fallback to IP address or bypass
                  if (string.IsNullOrEmpty(userId))
                  {
                      userId = context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
                  }

                  // Returns key-value entry that gets appended to the unique Cache Key
                  return new KeyValuePair<string, string>("user_id", userId);
              });
    });
});

// Localization
builder.Services.AddLocalization(options => options.ResourcesPath = "");

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton(googleAuthSettings);

// Minio settings and storage service
var minioSettings = builder.Configuration.GetSection("Minio").Get<MinioSettings>() ?? throw new InvalidOperationException("Minio section is missing from configuration.");
Console.WriteLine($"Minio Settings: {JsonSerializer.Serialize(minioSettings)}");
if (minioSettings is not null)
{
    builder.Services.Configure<MinioSettings>(builder.Configuration.GetSection("Minio"));
    builder.Services.AddScoped<IStorageService, MinioStorageService>();
}
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "SmartScheme";// JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = "SmartScheme";// JwtBearerDefaults.AuthenticationScheme;
}).AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.Cookie.Name = ".farmplus.auth";
    // options.Cookie.Domain = ".mydomain.com"; // Shared domain
    options.Cookie.SameSite = SameSiteMode.None; // Allow cross-origin requests
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // Use Secure cookies if the request is HTTPS

    // Prevent API from returning a 302 Redirect to a login page for unauthorized API requests
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
})
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
    };
})// 3. Smart Policy Scheme that routes dynamically based on incoming request
.AddPolicyScheme("SmartScheme", "Bearer or Cookie", options =>
{
    options.ForwardDefaultSelector = context =>
    {
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        
        // If request has 'Authorization: Bearer xxx', authenticate via JWT
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return JwtBearerDefaults.AuthenticationScheme;
        }

        // Otherwise, attempt to authenticate via Cookie
        return CookieAuthenticationDefaults.AuthenticationScheme;
    };
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.SetIsOriginAllowed(origin => 
        {
            // Allow any origin for public/mobile requests, 
            // but explicitly validate web origins if needed
            return true; 
        })
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
});


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Farm Plus API", Version = "v1" });
    
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT bearer token in the format: Bearer {token}",
    });

    // UPDATED FOR SWASHBUCKLE v10+:
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.Parse("8.0.32-mysql")));
builder.Services.AddHttpContextAccessor();


builder.Services.Configure<ComponentSettings>(builder.Configuration.GetSection("Ai"));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IBrandService, BrandService>();
builder.Services.AddScoped<IUnitService, UnitService>();
builder.Services.AddScoped<IDealerService, DealerService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IPasswordHasher<UserEntity>, PasswordHasher<UserEntity>>();
builder.Services.AddScoped<IPasswordHasher<AdminUserEntity>, PasswordHasher<AdminUserEntity>>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAiApiClient, GeminiApiClient>();
builder.Services.AddScoped<ISupplierService, SupplierService>();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    // This prevents MVC from automatically returning 400 before your action runs
    options.SuppressModelStateInvalidFilter = true;
});
builder.Services.Configure<JsonOptions>(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

var app = builder.Build();

// Localization
var supportedCultures = new[] { "en-US", "my-MM" };
var localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture(supportedCultures[0])
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

app.UseRequestLocalization(localizationOptions);

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    app.UseSwagger();
    app.UseSwaggerUI();
}

// Configure the HTTP request pipeline.
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// app.MapStaticAssets();
app.MapControllers();

// app.MapControllerRoute(
//     name: "default",
//     pattern: "{controller=Home}/{action=Index}/{id?}")
//     .WithStaticAssets();

app.Run();
