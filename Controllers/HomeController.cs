using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace CVManagement.Controllers;

public class HomeViewModel
{
    public List<Position> LatestPositions { get; set; } = [];

    public List<Position> PopularPositions { get; set; } = [];

    public int TotalPositions { get; set; }

    public int TotalCandidates { get; set; }

    public int TotalCVs { get; set; }
}

public class HomeController : Controller
{
    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    public HomeController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var positions = await context.Positions
            .OrderByDescending(p => p.LastUpdated)
            .Take(5)
            .ToListAsync();
        var totalPositions = await context.Positions.CountAsync();
        var totalCandidates = await userManager.GetUsersInRoleAsync(IdentitySeeder.CandidateRole);
        var totalCVs = await context.CV.CountAsync();

        return View(new HomeViewModel()
        {
            LatestPositions = positions,
            PopularPositions = positions,
            TotalPositions = totalPositions,
            TotalCandidates = totalCandidates.Count,
            TotalCVs = totalCVs,
        });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
