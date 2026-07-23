using Microsoft.EntityFrameworkCore;
using Cluspedia.FarmPlus.Api.Entities;

namespace Cluspedia.FarmPlus.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<CategoryEntity> Categories => Set<CategoryEntity>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}
