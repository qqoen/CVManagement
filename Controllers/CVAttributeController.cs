using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Controllers;

public class CVAttributeController : ApplicationController
{
    private readonly ApplicationDbContext context;

    public CVAttributeController(ApplicationDbContext context)
    {
        this.context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var attributes = await context.CVAttributes.ToListAsync();
        return View(attributes);
    }

    [HttpGet]
    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Create(CVAttribute attribute)
    {
        try
        {
            if (ModelState.IsValid)
            {
                context.Add(attribute);
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
        }
        catch (DbUpdateException ex)
        {
            HandleDbException(ex, $"Name '{attribute.Name}' already exists.");
        }

        return View(attribute);
    }

    [HttpPost]
    public IActionResult Delete([FromBody] List<int> selectedIds)
    {
        foreach (var id in selectedIds)
        {
            var attribute = context.CVAttributes.Find(id)!;
            context.CVAttributes.Remove(attribute);
        }
        context.SaveChanges();
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var attribute = await context.CVAttributes.FirstOrDefaultAsync(s => s.ID == id);
        if (attribute == null) return NotFound();
        return View(attribute);
    }

    [HttpPost]
    public async Task<IActionResult> Edit(int id, CVAttribute attribute)
    {
        if (id != attribute.ID)
        {
            return NotFound();
        }

        if (ModelState.IsValid)
        {
            try
            {
                context.Update(attribute);
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex, $"Name '{attribute.Name}' already exists.");
            }
        }

        return View(attribute);
    }
}
