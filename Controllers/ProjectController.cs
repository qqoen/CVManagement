using CVManagement.Data;
using CVManagement.Models;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NuGet.Packaging;

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
    public async Task<IActionResult> Details(int? id)
    {
        var project = await GetProject(id);
        if (project == null) return NotFound();
        if (CanView(project))
        {
            ViewData["TagList"] = string.Join(", ", project.Tags.Select(t => t.Name));
            return View(project);
        }
        return NotFound();
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Create()
    {
        await PrepareTags(context, new List<string>());
        return View(new ProjectViewModel()
        {
            StartDate = DateTimeOffset.Now,
            EndDate = DateTimeOffset.Now,
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Create(ProjectViewModel vm)
    {
        if (ModelState.IsValid)
        {
            var tags = await GetTrackableTags(context, vm.Tags);
            var project = vm.CreateProjectModel(userManager.GetUserId(User)!, tags);
            context.Add(project);
            await context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), new { id = project.ID });
        }
        await PrepareTags(context, new List<string>());
        return View(vm);
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Edit(int? id)
    {
        var project = await GetProject(id);
        if (project == null) return NotFound();
        if (!CanEdit(project)) return NotFound();
        await PrepareTags(context, project.Tags.Select(t => t.ID.ToString()).ToList());
        return View(ProjectViewModel.Create(project));
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Edit(int? id, ProjectViewModel vm)
    {
        if (id != vm.ID) return NotFound();
        var project = await GetProject(id);
        if (project == null || !CanEdit(project)) return NotFound();
        if (ModelState.IsValid)
        {
            var tags = await GetTrackableTags(context, vm.Tags);
            vm.UpdateProjectModel(project, tags);
            context.Update(project);
            try
            {
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Details), new { id = project.ID });
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex);
            }
        }
        await PrepareTags(context, project.Tags.Select(t => t.ID.ToString()).ToList());
        return View(vm);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        var userId = userManager.GetUserId(User);
        var projects = context.Project.Where(p => selectedIds.Contains(p.ID) && p.UserId == userId);
        context.RemoveRange(projects);
        await context.SaveChangesAsync();
        return Ok();
    }

    private async Task<Project?> GetProject(int? id)
    {
        if (id == null) return null;
        return await context.Project
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.ID == id);
    }

    private bool CanView(Project project)
    {
        var userId = userManager.GetUserId(User);
        return project.UserId == userId || User.IsInRole(DbSeeder.RecruiterRole) || User.IsInRole(DbSeeder.AdminRole);
    }

    private bool CanEdit(Project project)
    {
        var userId = userManager.GetUserId(User);
        return project.UserId == userId || User.IsInRole(DbSeeder.AdminRole);
    }
}
