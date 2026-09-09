using CVManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Data;

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
            await SeedRoles(roleManager, context);

            if (!context.Categories.Any())
            {
                var categories = new Category[]
                {
                    new() { ID = 1, Name = "Certification" },
                    new() { ID = 2, Name = "Domain Knowledge" },
                    new() { ID = 3, Name = "Personal Information" },
                    new() { ID = 4, Name = "Soft Skill" }
                };
                await context.Categories.AddRangeAsync(categories);
            }

            if (!context.CVAttributes.Any())
            {
                var cvAttributes = new CVAttribute[]
                {
                    new() { Name = "First Name", Description = "First Name", CategoryID = 3, DataType = CVAttributeDataType.String, IsMandatory = true },
                    new() { Name = "Last Name", Description = "Last Name", CategoryID = 3, DataType = CVAttributeDataType.String, IsMandatory = true },
                    new() { Name = "Location", Description = "Location", CategoryID = 3, DataType = CVAttributeDataType.String, IsMandatory = true },
                };
                await context.CVAttributes.AddRangeAsync(cvAttributes);
            }

            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedRoles(RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
    {
        if (!context.Roles.Any())
        {
            foreach (var role in IdentityRoles)
                await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
}
