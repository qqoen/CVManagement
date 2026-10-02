using CVManagement.Services;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Controllers;

[Authorize]
public class ProjectController : ApplicationController
{
    private readonly ProjectService projectService;

    private readonly TagService tagService;

    public ProjectController(
        ProjectService projectService,
        TagService tagService)
    {
        this.projectService = projectService;
        this.tagService = tagService;
    }

    [HttpGet]
    public async Task<IActionResult> Details(int? id)
    {
        var project = await projectService.GetProject(id);
        if (project == null) return NotFound();
        if (projectService.CanView(User, project))
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
        PrepareTags(await tagService.GetAll(), []);
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
            var project = await projectService.CreateProject(User, vm);
            return RedirectToAction(nameof(Details), new { id = project.ID });
        }
        PrepareTags(await tagService.GetAll(), []);
        return View(vm);
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Edit(int? id)
    {
        var project = await projectService.GetProject(id);
        if (project == null) return NotFound();
        if (!projectService.CanEdit(User, project)) return NotFound();
        PrepareTags(await tagService.GetAll(), project);
        return View(ProjectViewModel.Create(project));
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Edit(int? id, ProjectViewModel vm)
    {
        if (id != vm.ID) return NotFound();
        var project = await projectService.GetProject(id);
        if (project == null || !projectService.CanEdit(User, project)) return NotFound();
        if (ModelState.IsValid)
        {
            try
            {
                await projectService.UpdateProject(project, vm);
                return RedirectToAction(nameof(Details), new { id = project.ID });
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex);
            }
        }
        PrepareTags(await tagService.GetAll(), project);
        return View(vm);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        await projectService.Delete(User, selectedIds);
        return Ok();
    }
}
