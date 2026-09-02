using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Controllers;

//public class CreatePositionViewModel
//{
//    public string Title { get; set; } = string.Empty;

//    public string Description { get; set; } = string.Empty;

//    public string Tags { get; set; } = string.Empty;

//    public int MaxProjects { get; set; }
//}

public class PositionController : ApplicationController
{
    private readonly ApplicationDbContext context;

    public PositionController(ApplicationDbContext context)
    {
        this.context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var positions = await context.Positions.ToListAsync();
        return View(positions);
    }

    [HttpGet]
    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Create(Position position)
    {
        try
        {
            if (ModelState.IsValid)
            {
                position.LastUpdated = DateTimeOffset.Now;
                context.Add(position);
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
        }
        catch (DbUpdateException ex)
        {
            HandleDbException(ex, $"Title '{position.Title}' already exists.");
        }

        return View(position);
    }

    [HttpPost]
    public IActionResult Delete([FromBody] List<int> selectedIds)
    {
        foreach (var id in selectedIds)
        {
            var position = context.Positions.Find(id)!;
            context.Remove(position);
        }
        context.SaveChanges();
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var position = await context.Positions.FirstOrDefaultAsync(s => s.ID == id);
        if (position == null) return NotFound();
        return View(position);
    }

    [HttpPost]
    public async Task<IActionResult> Edit(int id, Position position)
    {
        if (id != position.ID) return NotFound();
        if (ModelState.IsValid)
        {
            try
            {
                position.LastUpdated = DateTimeOffset.Now;
                context.Update(position);
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex, $"Title '{position.Title}' already exists.");
            }
        }

        return View(position);
    }
}
