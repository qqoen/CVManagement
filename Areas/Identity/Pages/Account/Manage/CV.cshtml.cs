using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Areas.Identity.Pages.Account.Manage;

public class CVModel : PageModel
{
    private readonly ApplicationDbContext context;
    private readonly UserManager<ApplicationUser> userManager;

    public List<CV> CV { get; set; } = [];

    public CVModel(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
    }

    public async Task<IActionResult> OnGetAsync()
    {
        var userId = userManager.GetUserId(User);
        CV = await context.CV
            .Where(p => p.UserId == userId)
            .Include(p => p.Position)
            .ToListAsync();
        return Page();
    }
}
