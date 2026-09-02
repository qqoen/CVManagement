using CVManagement.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<CVAttribute> CVAttributes { get; set; } = default!;

    public DbSet<Position> Positions { get; set; } = default!;

    public DbSet<Project> Project { get; set; } = default!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>()
            .HasMany(e => e.Projects)
            .WithOne(e => e.User)
            .HasForeignKey(e => e.UserId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ApplicationUser>()
            .HasMany(e => e.CVs)
            .WithOne(e => e.User)
            .HasForeignKey(e => e.UserId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Position>()
            .HasMany(e => e.CVs)
            .WithOne(e => e.Position)
            .HasForeignKey(e => e.PositionID)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);
    }
}
