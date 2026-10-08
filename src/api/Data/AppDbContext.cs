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
    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();
    public DbSet<MediaEntity> Medias => Set<MediaEntity>();
    public DbSet<RoleEntity> Roles => Set<RoleEntity>();
    public DbSet<PurchaseEntity> Purchases => Set<PurchaseEntity>();
    public DbSet<PurchaseItemEntity> PurchaseItems => Set<PurchaseItemEntity>();
    public DbSet<SaleEntity> Sales => Set<SaleEntity>();
    public DbSet<SaleItemEntity> SaleItems => Set<SaleItemEntity>();
    public DbSet<SalePaymentEntity> SalePayments => Set<SalePaymentEntity>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
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
    }
}
