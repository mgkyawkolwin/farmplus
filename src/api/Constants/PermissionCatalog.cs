using FarmPlus.Api.Dtos.RolePermissions;

namespace FarmPlus.Api.Constants;

public static class PermissionCatalog
{
    public static IReadOnlyList<PermissionPageDto> Pages { get; } =
    [
        new("/home/dashboard", "Workspace", "Home Dashboard"),
        new("/home/sales", "Workspace", "Sales Overview"),
        new("/home/purchases", "Workspace", "Purchase Overview"),
        new("/home/aichatplaceholder", "Workspace", "AI Assistant"),
        new("/menu", "Workspace", "Menu"),
        new("/profile", "Workspace", "Profile"),
        new("/settings", "Workspace", "Settings"),
        new("/chat/chat", "Workspace", "Chat"),

        new("/users/list", "Users, Roles & Permissions", "Users"),
        new("/users/new", "Users, Roles & Permissions", "New User"),
        new("/users/edit", "Users, Roles & Permissions", "Edit User"),
        new("/roles/list", "Users, Roles & Permissions", "Roles"),
        new("/roles/new", "Users, Roles & Permissions", "New Role"),
        new("/roles/edit", "Users, Roles & Permissions", "Edit Role"),
        new("/rolepermissions", "Users, Roles & Permissions", "Role Permissions"),
        new("/messages/list", "Workspace", "Messages"),

        new("/units/units", "Configuration", "Units"),
        new("/categories/categories", "Configuration", "Categories"),
        new("/brands/brands", "Configuration", "Brands"),
        new("/shops/shops", "Configuration", "Shops"),

        new("/customers/dashboard", "Customers", "Customer Dashboard"),
        new("/customers/list", "Customers", "Customer List"),
        new("/customers/new", "Customers", "New Customer"),
        new("/customers/edit", "Customers", "Edit Customer"),
        new("/customers/view", "Customers", "Customer Details"),
        new("/customers/sales", "Customers", "Customer Sales"),
        new("/customers/payments", "Customers", "Customer Payments"),

        new("/dealers/dashboard", "Dealers", "Dealer Dashboard"),
        new("/dealers/dealers", "Dealers", "Dealer List"),
        new("/dealers/new", "Dealers", "New Dealer"),
        new("/dealers/edit", "Dealers", "Edit Dealer"),
        new("/dealers/view", "Dealers", "Dealer Details"),
        new("/dealers/sales", "Dealers", "New Dealer Sale"),
        new("/dealers/history", "Dealers", "Dealer Sales & Payments"),

        new("/suppliers/dashboard", "Suppliers", "Supplier Dashboard"),
        new("/suppliers/list", "Suppliers", "Supplier List"),
        new("/suppliers/new", "Suppliers", "New Supplier"),
        new("/suppliers/edit", "Suppliers", "Edit Supplier"),
        new("/suppliers/view", "Suppliers", "Supplier Details"),
        new("/suppliers/purchases", "Suppliers", "Supplier Purchases"),

        new("/products/dashboard", "Products", "Product Dashboard"),
        new("/products/list", "Products", "Product List"),
        new("/products/new", "Products", "New Product"),
        new("/products/edit", "Products", "Edit Product"),
        new("/products/view", "Products", "Product Details"),
        new("/products/transfer", "Products", "Transfer Stock"),
        new("/products/gallery-view", "Products", "Product Gallery"),

        new("/inventory/dashboard", "Inventory", "Inventory Dashboard"),
        new("/inventory/list", "Inventory", "Inventory List"),
        new("/inventory/view", "Inventory", "Inventory Details"),
        new("/inventory/adjustment", "Inventory", "Stock Adjustment"),

        new("/sales/dashboard", "Sales", "Sales Dashboard"),
        new("/sales/list", "Sales", "Sales List"),
        new("/sales/new", "Sales", "New Sale"),
        new("/sales/edit", "Sales", "Edit Sale"),
        new("/sales/view", "Sales", "Sale Details"),

        new("/purchases/dashboard", "Purchases", "Purchase Dashboard"),
        new("/purchases/list", "Purchases", "Purchase List"),
        new("/purchases/new", "Purchases", "New Purchase"),
        new("/purchases/edit", "Purchases", "Edit Purchase"),
        new("/purchases/view", "Purchases", "Purchase Details"),

        new("/reports/customers/dashboard", "Reports", "Customer Reports"),
        new("/reports/products/dashboard", "Reports", "Product Reports"),
        new("/reports/dealers/dashboard", "Reports", "Dealer Reports"),
        new("/reports/suppliers/dashboard", "Reports", "Supplier Reports"),
        new("/reports/sales/dashboard", "Reports", "Sales Reports"),
        new("/reports/purchases/dashboard", "Reports", "Purchase Reports"),
        new("/reports/inventories/dashboard", "Reports", "Inventory Reports"),
    ];

    public static bool Contains(string key) => Pages.Any(page => page.Key == key);
}