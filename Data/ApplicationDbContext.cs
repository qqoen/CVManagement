using CVManagement.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<CV> CV { get; set; } = default!;

    public DbSet<CVAttribute> CVAttributes { get; set; } = default!;

    public DbSet<CVAttributeValue> CVAttributeValues { get; set; } = default!;

    public DbSet<Position> Positions { get; set; } = default!;

    public DbSet<Project> Project { get; set; } = default!;

    public DbSet<Category> Categories { get; set; } = default!;

    public DbSet<Tag> Tags { get; set; } = default!;

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

        modelBuilder.Entity<ApplicationUser>()
            .HasMany(e => e.CVAttributeValues)
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

        modelBuilder.Entity<CVAttribute>()
            .HasMany(e => e.CVAttributeValues)
            .WithOne(e => e.CVAttribute)
            .HasForeignKey(e => e.CVAttributeID)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Category>()
            .HasMany(e => e.CVAttributes)
            .WithOne(e => e.Category)
            .HasForeignKey(e => e.CategoryID)
            .IsRequired()
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Tag>()
            .HasMany(e => e.Positions)
            .WithMany(e => e.Tags);
    }
}
