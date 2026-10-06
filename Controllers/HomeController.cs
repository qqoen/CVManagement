using CVManagement.Data;
using CVManagement.Models;
using CVManagement.Services;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace CVManagement.Controllers;

public class HomeController : Controller
{
    public const int MaxLatestPositions = 5;

    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    private readonly PositionService positionService;

    public HomeController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        PositionService positionService)
    {
        this.context = context;
        this.userManager = userManager;
        this.positionService = positionService;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var beforeDate = DateTimeOffset.Now.AddDays(-1);
        var lastDayCVs = await context.CV.Where(cv => cv.SubmissionDate >= beforeDate).CountAsync();

        return View(new HomeViewModel()
        {
            LatestPositions = await positionService.GetLatestPositions(MaxLatestPositions),
            PopularPositions = [],
            TotalPositions = await context.Positions.CountAsync(),
            TotalCandidates = (await userManager.GetUsersInRoleAsync(DbSeeder.CandidateRole)).Count,
            TotalRecruiters = (await userManager.GetUsersInRoleAsync(DbSeeder.RecruiterRole)).Count,
            TotalCVs = await context.CV.CountAsync(),
            LastDayCVs = lastDayCVs,
            Tags = await context.Tags.Select(t => t.Name).ToListAsync(),
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
}
