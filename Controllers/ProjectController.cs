using CVManagement.Data;
using CVManagement.Models;
using CVManagement.Models.Validation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NuGet.Packaging;
using System.ComponentModel.DataAnnotations;

namespace CVManagement.Controllers;

public class ProjectViewModel
{
    public int ID { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    [Display(Name = "Start Date")]
    [EarlierDate(nameof(EndDate))]
    public DateTimeOffset StartDate { get; set; }
    [Display(Name = "End Date")]
    [PastDate]
    public DateTimeOffset EndDate { get; set; }
    public List<string> Tags { get; set; } = [];

    public static ProjectViewModel Create(Project project)
    {
        return new ProjectViewModel()
        {
            ID = project.ID,
            UserId = project.UserId,
            Name = project.Name,
            Description = project.Description,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            Tags = project.Tags.Select(t => t.ID.ToString()).ToList(),
        };
    }
}

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
        if (id == null) return NotFound();
        var project = await context.Project
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.ID == id);
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
            var project = new Project
            {
                Name = vm.Name,
                Description = vm.Description,
                StartDate = vm.StartDate,
                EndDate = vm.EndDate,
                UserId = userManager.GetUserId(User)
            };
            project.Tags.AddRange(await GetTrackableTags(context, vm.Tags));
            context.Add(project);
            await context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), new { id = project.ID });
        }
        ModelState.AddModelError(string.Empty, "Invalid model");
        return View(vm);
    }

    [HttpGet]
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var project = await context.Project
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.ID == id);
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
            project.Name = vm.Name;
            project.Description = vm.Description;
            project.StartDate = vm.StartDate;
            project.EndDate = vm.EndDate;
            project.Tags.Clear();
            project.Tags.AddRange(await GetTrackableTags(context, vm.Tags));

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
}
