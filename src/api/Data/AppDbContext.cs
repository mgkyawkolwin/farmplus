using Microsoft.EntityFrameworkCore;
using FarmPlus.Api.Entities;

namespace FarmPlus.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<AdminUserEntity> AdminUsers => Set<AdminUserEntity>();
    public DbSet<CategoryEntity> Categories => Set<CategoryEntity>();
    public DbSet<BrandEntity> Brands => Set<BrandEntity>();
    public DbSet<UnitEntity> Units => Set<UnitEntity>();
    public DbSet<DealerEntity> Dealers => Set<DealerEntity>();
    public DbSet<SupplierEntity> Suppliers => Set<SupplierEntity>();
    public DbSet<ShopEntity> Shops => Set<ShopEntity>();
    public DbSet<ShopStockEntity> ShopStocks => Set<ShopStockEntity>();
    public DbSet<StockMovementEntity> StockMovements => Set<StockMovementEntity>();
    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();
    public DbSet<MediaEntity> Medias => Set<MediaEntity>();
    public DbSet<RoleEntity> Roles => Set<RoleEntity>();
    public DbSet<RolePermissionEntity> RolePermissions => Set<RolePermissionEntity>();
    public DbSet<PurchaseEntity> Purchases => Set<PurchaseEntity>();
    public DbSet<PurchaseItemEntity> PurchaseItems => Set<PurchaseItemEntity>();
    public DbSet<SaleEntity> Sales => Set<SaleEntity>();
    public DbSet<SaleItemEntity> SaleItems => Set<SaleItemEntity>();
    public DbSet<SalePaymentEntity> SalePayments => Set<SalePaymentEntity>();
    public DbSet<MessageEntity> Messages => Set<MessageEntity>();
    public DbSet<CustomerMessageEntity> CustomerMessages => Set<CustomerMessageEntity>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Sets utf8mb4 globally for the database, all tables, and string columns
        modelBuilder.HasCharSet("utf8mb4");

        // Sets utf8mb4_unicode_ci globally as the collation
        modelBuilder.UseCollation("utf8mb4_unicode_ci");
        
        modelBuilder.Entity<PurchaseEntity>()
            .HasMany(purchase => purchase.Items)
            .WithOne()
            .HasForeignKey(item => item.PurchaseId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SaleEntity>()
            .HasMany(sale => sale.Items)
            .WithOne()
            .HasForeignKey(item => item.SaleId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SaleEntity>()
            .HasMany(sale => sale.Payments)
            .WithOne()
            .HasForeignKey(payment => payment.SaleId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ShopStockEntity>()
            .HasIndex(stock => new { stock.ShopId, stock.ProductId })
            .IsUnique();
        modelBuilder.Entity<RolePermissionEntity>()
            .HasIndex(permission => new { permission.RoleId, permission.PermissionKey })
            .IsUnique();
        modelBuilder.Entity<RolePermissionEntity>()
            .HasOne<RoleEntity>()
            .WithMany()
            .HasForeignKey(permission => permission.RoleId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<UserEntity>()
            .HasOne<RoleEntity>()
            .WithMany()
            .HasForeignKey(user => user.RoleId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<CustomerMessageEntity>()
            .HasIndex(message => new { message.MessageId, message.UserId })
            .IsUnique();
        modelBuilder.Entity<CustomerMessageEntity>()
            .HasIndex(message => new { message.UserId, message.IsRead, message.CreatedAtUtc });
        modelBuilder.Entity<CustomerMessageEntity>()
            .HasOne<MessageEntity>()
            .WithMany()
            .HasForeignKey(message => message.MessageId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<CustomerMessageEntity>()
            .HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(message => message.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<StockMovementEntity>()
            .HasIndex(movement => new { movement.ShopId, movement.ProductId, movement.CreatedAtUtc });
    }
}
