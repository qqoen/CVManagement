
using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Controllers;

[Authorize]
public class ProjectController : ApplicationController
{
    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    public ProjectController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var userId = userManager.GetUserId(User);
        var projects = await context.Project
            .Where(p => p.UserId == userId)
            .ToListAsync();
        return View(projects);
    }

    [HttpGet]
    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        var project = await context.Project.FirstOrDefaultAsync(m => m.ID == id);
        if (project == null) return NotFound();
        return View(project);
    }

    [HttpGet]
    [Authorize(Roles = IdentitySeeder.CandidateRole)]
    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    [Authorize(Roles = IdentitySeeder.CandidateRole)]
    public async Task<IActionResult> Create(Project project)
    {
        if (ModelState.IsValid)
        {
            project.UserId = userManager.GetUserId(User);
            context.Add(project);
            await context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        ModelState.AddModelError(string.Empty, "Invalid model");
        return View(project);
    }

    [HttpGet]
    [Authorize(Roles = IdentitySeeder.CandidateRole)]
    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var project = await context.Project.FindAsync(id);
        if (project == null) return NotFound();
        return View(project);
    }

    [HttpPost]
    [Authorize(Roles = IdentitySeeder.CandidateRole)]
    public async Task<IActionResult> Edit(int? id, Project project)
    {
        if (id != project.ID) return NotFound();
        if (ModelState.IsValid)
        {
            try
            {
                context.Update(project);
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex);
            }
        }
        return View(project);
    }

    [HttpPost]
    [Authorize(Roles = IdentitySeeder.CandidateRole)]
    public IActionResult Delete([FromBody] List<int> selectedIds)
    {
        foreach (var id in selectedIds)
        {
            var project = context.Project.Find(id)!;
            context.Remove(project);
        }
        context.SaveChanges();
        return Ok();
    }
}
