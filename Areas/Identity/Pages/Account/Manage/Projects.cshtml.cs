using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Areas.Identity.Pages.Account.Manage;

public class ProjectsModel : PageModel
{
    private readonly ApplicationDbContext context;
    private readonly UserManager<ApplicationUser> userManager;

    public List<Project> Projects { get; set; } = [];

    public ProjectsModel(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        var userId = userManager.GetUserId(User);
        Projects = await context.Project
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.Name)
            .ToListAsync();
        return Page();
    }
}
