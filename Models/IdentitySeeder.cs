using CVManagement.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Models;

public static class IdentitySeeder
{
    public const string AdminRole = "Admin";

    public const string RecruiterRole = "Recruiter";

    public const string CandidateRole = "Candidate";

    public static readonly string[] IdentityRoles = [AdminRole, RecruiterRole, CandidateRole];

    public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
    {
        var dbContextOptions = serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        using (var context = new ApplicationDbContext(dbContextOptions))
        {
            if (context.Roles.Any()) return;
            foreach (var role in IdentityRoles)
                await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
}
