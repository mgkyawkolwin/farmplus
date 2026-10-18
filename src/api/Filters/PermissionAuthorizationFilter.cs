using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FarmPlus.Api.Constants;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos.Sales;
using FarmPlus.Api.Services;

namespace FarmPlus.Api.Filters;

public sealed class PermissionAuthorizationFilter : IAsyncActionFilter
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public PermissionAuthorizationFilter(AppDbContext dbContext, ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.HttpContext.GetEndpoint()?.Metadata.GetMetadata<IAllowAnonymous>() is not null ||
            _currentUserService.IsAdmin ||
            IsMainTenantUser())
        {
            await next();
            return;
        }

        if (context.ActionDescriptor is not ControllerActionDescriptor action ||
            context.HttpContext.User.Identity?.IsAuthenticated != true)
        {
            await next();
            return;
        }

        var permissionKeys = ResolvePageKeys(action.ControllerName, action.ActionName, context.HttpContext.Request.Method, context.ActionArguments);
        if (permissionKeys is null || !Guid.TryParse(_currentUserService.UserId, out var userId))
        {
            await next();
            return;
        }

        var roleId = await _dbContext.Users.AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.RoleId)
            .SingleOrDefaultAsync();
        var hasPermission = roleId.HasValue && await _dbContext.RolePermissions.AsNoTracking()
            .AnyAsync(permission => permission.RoleId == roleId.Value &&
                (permissionKeys.Contains(permission.PermissionKey) || permission.PermissionKey == "*"));

        if (!hasPermission)
        {
            context.Result = new ObjectResult(new { Success = false, Message = "You do not have permission to access this page." })
            {
                StatusCode = StatusCodes.Status403Forbidden,
            };
            return;
        }

        await next();
    }

    private bool IsMainTenantUser() =>
        Guid.TryParse(_currentUserService.UserId, out var userId) &&
        Guid.TryParse(_currentUserService.TenantId, out var tenantId) &&
        userId == tenantId;

    private static string[]? ResolvePageKeys(string controller, string action, string method, IDictionary<string, object?> arguments)
    {
        var pageKey = ResolvePageKey(controller, action, method, arguments);
        if (pageKey is null) return null;

        var keys = new HashSet<string>(StringComparer.Ordinal) { pageKey };
        var pageSize = arguments.FirstOrDefault(argument => argument.Key.Equals("pageSize", StringComparison.OrdinalIgnoreCase)).Value;
        if (!method.Equals("GET", StringComparison.OrdinalIgnoreCase)) return [.. keys];

        if (controller == "Roles" && action == "GetRoles")
        {
            keys.UnionWith(["/users/new", "/users/edit", "/rolepermissions"]);
        }
        if (controller == "Sales" && action == "GetDashboard") keys.Add("/home/sales");
        if (controller == "Dealers" && action == "GetDealerById") keys.Add("/dealers/sales");
        if (controller == "Products" && action == "GetProducts")
        {
            keys.UnionWith(["/sales/new", "/dealers/sales", "/purchases/new"]);
        }
        if (controller is "Categories" or "Brands" or "Units")
        {
            keys.UnionWith(["/products/new", "/products/edit"]);
        }
        if (pageSize is not int size) return [.. keys];

        if (size >= 200)
        {
            var dashboard = controller switch
            {
                "Customers" => "/customers/dashboard",
                "Dealers" => "/dealers/dashboard",
                "Products" => "/products/dashboard",
                "Purchases" => "/purchases/dashboard",
                "Suppliers" => "/suppliers/dashboard",
                _ => null,
            };
            if (dashboard is not null) keys.Add(dashboard);
        }
        if (controller == "Purchases" && action == "GetPurchases" && size >= 200)
        {
            keys.Add("/home/purchases");
        }

        if (controller == "Dealers" && size >= 500)
        {
            keys.Add("/reports/dealers/dashboard");
        }
        if (controller == "Suppliers" && size >= 500)
        {
            keys.Add("/reports/suppliers/dashboard");
        }
        if (controller == "Purchases" && size >= 500)
        {
            keys.UnionWith(["/reports/suppliers/dashboard", "/reports/purchases/dashboard"]);
        }
        if (controller == "Sales" && size >= 500)
        {
            keys.UnionWith([
                "/reports/customers/dashboard",
                "/reports/dealers/dashboard",
                "/reports/sales/dashboard",
            ]);
        }

        if (controller == "Products" && size >= 100)
        {
            keys.UnionWith([
                "/reports/products/dashboard",
                "/reports/inventories/dashboard",
                "/inventory/dashboard",
                "/inventory/list",
                "/inventory/adjustment",
                "/products/dashboard",
                "/dealers/sales",
                "/purchases/new",
            ]);
        }
        else if (controller == "Suppliers" && size >= 1000)
        {
            keys.Add("/purchases/new");
        }

        return [.. keys];
    }

    private static string? ResolvePageKey(string controller, string action, string method, IDictionary<string, object?> arguments)
    {
        if (controller.Equals("Auth", StringComparison.OrdinalIgnoreCase) ||
            (controller.Equals("RolePermissions", StringComparison.OrdinalIgnoreCase) && action.Equals("GetCurrentPermissions", StringComparison.OrdinalIgnoreCase)))
        {
            return null;
        }

        if (controller.Equals("Home", StringComparison.OrdinalIgnoreCase)) return "/home/dashboard";
        if (controller.Equals("Chat", StringComparison.OrdinalIgnoreCase)) return "/chat/chat";
        if (controller.Equals("RolePermissions", StringComparison.OrdinalIgnoreCase)) return "/rolepermissions";
        if (controller.Equals("Messages", StringComparison.OrdinalIgnoreCase)) return "/messages/list";
        if (controller.Equals("Shops", StringComparison.OrdinalIgnoreCase) &&
            action.Equals("GetShops", StringComparison.OrdinalIgnoreCase) &&
            method.Equals("GET", StringComparison.OrdinalIgnoreCase)) return null;

        if (controller.Equals("Products", StringComparison.OrdinalIgnoreCase))
        {
            if (action.Equals("GetInventoryMovements", StringComparison.OrdinalIgnoreCase)) return "/reports/inventories/dashboard";
            if (action.Equals("Transfer", StringComparison.OrdinalIgnoreCase)) return "/products/transfer";
            if (action is "StockIn" or "StockOut" or "Damage") return "/inventory/adjustment";
            if (action is "GetShopStock" or "GetStockMovements") return "/inventory/view";
        }

        if (controller.Equals("Sales", StringComparison.OrdinalIgnoreCase))
        {
            if (action.Equals("CreateSale", StringComparison.OrdinalIgnoreCase) &&
                arguments.Values.OfType<CreateSaleRequestDto>().Any(request => request.DealerId.HasValue))
            {
                return "/dealers/sales";
            }
            if (action.Contains("Payment", StringComparison.OrdinalIgnoreCase) ||
                action.Contains("Void", StringComparison.OrdinalIgnoreCase)) return "/sales/view";
        }

        var module = controller switch
        {
            "Users" => "users",
            "Roles" => "roles",
            "Customers" => "customers",
            "Dealers" => "dealers",
            "Suppliers" => "suppliers",
            "Products" => "products",
            "Sales" => "sales",
            "Purchases" => "purchases",
            "Units" => "units",
            "Categories" => "categories",
            "Brands" => "brands",
            "Shops" => "shops",
            _ => null,
        };
        if (module is null) return "/__unmapped";

        if (action.Contains("Dashboard", StringComparison.OrdinalIgnoreCase)) return $"/{module}/dashboard";
        if (action.Contains("Payments", StringComparison.OrdinalIgnoreCase))
        {
            return module == "dealers" ? "/dealers/history" : $"/{module}/payments";
        }
        if (action.Contains("Sales", StringComparison.OrdinalIgnoreCase) && module is "customers" or "dealers")
        {
            return module == "dealers" ? "/dealers/history" : "/customers/sales";
        }
        if (action.Contains("Purchases", StringComparison.OrdinalIgnoreCase) && module == "suppliers") return "/suppliers/purchases";
        if (action.Equals("GetMe", StringComparison.OrdinalIgnoreCase) ||
            action.Contains("Password", StringComparison.OrdinalIgnoreCase) ||
            action.Contains("ProfilePicture", StringComparison.OrdinalIgnoreCase)) return "/profile";
        if (action.Contains("ById", StringComparison.OrdinalIgnoreCase))
        {
            var detailPage = module switch
            {
                "users" => "edit",
                "roles" => "edit",
                "categories" => "categories",
                "brands" => "brands",
                "units" => "units",
                "shops" => "shops",
                _ => "view",
            };
            return $"/{module}/{detailPage}";
        }

        var operationPage = method.ToUpperInvariant() switch
        {
            "POST" => "new",
            "PUT" or "PATCH" => "edit",
            "DELETE" => "list",
            _ => "list",
        };
        return module switch
        {
            "dealers" when operationPage == "list" => "/dealers/dealers",
            "categories" => "/categories/categories",
            "brands" => "/brands/brands",
            "units" => "/units/units",
            "shops" => "/shops/shops",
            _ => $"/{module}/{operationPage}",
        };
    }
}