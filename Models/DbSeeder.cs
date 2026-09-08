using CVManagement.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Models;

public static class DbSeeder
{
    public const string AdminRole = "Admin";

    public const string RecruiterRole = "Recruiter";

    public const string CandidateRole = "Candidate";

    public static readonly string[] IdentityRoles = [AdminRole, RecruiterRole, CandidateRole];

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var dbContextOptions = serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        using (var context = new ApplicationDbContext(dbContextOptions))
        {
            if (!context.Roles.Any())
            {
                foreach (var role in IdentityRoles)
                    await roleManager.CreateAsync(new IdentityRole(role));
            }

            if (!context.Categories.Any())
            {
                var categories = new Category[]
                {
                    new() { Name = "Certification" },
                    new() { Name = "Domain Knowledge" },
                    new() { Name = "Personal Information" },
                    new() { Name = "Soft Skill" }
                };
                await context.Categories.AddRangeAsync(categories);
                await context.SaveChangesAsync();
            }
        }
    }
}
