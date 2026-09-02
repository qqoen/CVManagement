using CVManagement.Models;
using Microsoft.AspNetCore.Mvc;
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
    [HttpGet]
    public IActionResult Index()
    {
        var positions = new List<Position>();
        positions.Add(new Position() { Title = "QA" });
        positions.Add(new Position() { Title = "DBA" });

        return View(new HomeViewModel()
        {
            LatestPositions = positions,
            PopularPositions = positions,
            TotalPositions = 10,
            TotalCandidates = 16,
            TotalCVs = 5,
        });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
