using CVManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Data;

public class DbSeeder
{
    public const string AdminRole = "Admin";

    public const string RecruiterRole = "Recruiter";

    public const string CandidateRole = "Candidate";

    public static readonly string[] IdentityRoles = [AdminRole, RecruiterRole, CandidateRole];

    private DbContextOptions<ApplicationDbContext> dbContextOptions;

    private RoleManager<IdentityRole> roleManager;

    public DbSeeder(IServiceProvider serviceProvider)
    {
        dbContextOptions = serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>();
        roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    }

    public async Task SeedAsync()
    {
        using (var context = new ApplicationDbContext(dbContextOptions))
        {
            await SeedRoles(context);
            await SeedCategories(context);
            await SeedAttributes(context);
            await SeedTags(context);
            await context.SaveChangesAsync();
        }
    }

    private async Task SeedRoles(ApplicationDbContext context)
    {
        if (context.Roles.Any()) return;
        foreach (var role in IdentityRoles)
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    private async Task SeedCategories(ApplicationDbContext context)
    {
        if (context.Categories.Any()) return;
        var categories = new Category[]
        {
            new() { ID = 1, Name = "Certification" },
            new() { ID = 2, Name = "Domain Knowledge" },
            new() { ID = 3, Name = "Personal Information" },
            new() { ID = 4, Name = "Soft Skill" }
        };
        await context.AddRangeAsync(categories);
    }

    private async Task SeedAttributes(ApplicationDbContext context)
    {
        if (context.CVAttributes.Any()) return;
        var cvAttributes = new CVAttribute[]
        {
            new() { Name = "First Name", Description = "First Name", CategoryID = 3, DataType = CVAttributeDataType.String, IsMandatory = true },
            new() { Name = "Last Name", Description = "Last Name", CategoryID = 3, DataType = CVAttributeDataType.String, IsMandatory = true },
            new() { Name = "Location", Description = "Location", CategoryID = 3, DataType = CVAttributeDataType.String, IsMandatory = true },
        };
        await context.AddRangeAsync(cvAttributes);
    }

    private async Task SeedTags(ApplicationDbContext context)
    {
        if (context.Tags.Any()) return;
        var tags = new Tag[]
        {
            new() { Name = "C#" },
            new() { Name = "ASP.NET" },
        };
        await context.AddRangeAsync(tags);
    }
}
