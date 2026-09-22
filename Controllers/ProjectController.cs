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
        var userId = userManager.GetUserId(User);
        if (project.UserId == userId || User.IsInRole(DbSeeder.RecruiterRole))
        {
            ViewData["TagList"] = string.Join(", ", project.Tags.Select(t => t.Name));
            return View(project);
        }
        return NotFound();
    }

    [HttpGet]
    [Authorize(Roles = DbSeeder.CandidateRole)]
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
    [Authorize(Roles = DbSeeder.CandidateRole)]
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
        return View(vm);
    }

    [HttpGet]
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> Edit(int? id)
    {
        var project = await GetProject(id);
        if (project == null) return NotFound();
        var userId = userManager.GetUserId(User);
        if (project.UserId != userId) return NotFound();
        await PrepareTags(context, project.Tags.Select(t => t.ID.ToString()).ToList());
        return View(ProjectViewModel.Create(project));
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> Edit(int? id, ProjectViewModel vm)
    {
        if (id != vm.ID) return NotFound();
        var userId = userManager.GetUserId(User);
        var project = await context.Project.FindAsync(id);
        if (project == null || project.UserId != userId) return NotFound();
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
        return View(vm);
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        var userId = userManager.GetUserId(User);
        var projects = context.Project.Where(p => p.UserId == userId && selectedIds.Contains(p.ID));
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
}
