using CVManagement.Data;
using CVManagement.Models;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace CVManagement.Controllers;

public class HomeController : Controller
{
    public const int MaxLatestPositions = 5;

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
        return View(new HomeViewModel()
        {
            LatestPositions = await GetLatestPositions(),
            PopularPositions = [],
            TotalPositions = await context.Positions.CountAsync(),
            TotalCandidates = (await userManager.GetUsersInRoleAsync(DbSeeder.CandidateRole)).Count,
            TotalCVs = await context.CV.CountAsync(),
        });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel
        {
            RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
        });
    }

    [Route("/Home/Error/{statusCode}")]
    public IActionResult Error(int statusCode)
    {
        switch (statusCode)
        {
            case 404:
                return View("ErrorNotFound", new ErrorViewModel
                {
                    RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
                });
            default:
                return View(new ErrorViewModel
                {
                    RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
                });
        }    
    }

    private async Task<List<Position>> GetLatestPositions()
    {
        return await context.Positions
            .OrderByDescending(p => p.LastUpdated)
            .Take(MaxLatestPositions)
            .ToListAsync();
    }
}
