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
    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}
