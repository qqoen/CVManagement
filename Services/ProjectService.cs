using CVManagement.Data;
using CVManagement.Models;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CVManagement.Services;

public class ProjectService
{
    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    private readonly TagService tagService;

    public ProjectService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        TagService tagService)
    {
        this.context = context;
        this.userManager = userManager;
        this.tagService = tagService;
    }

    public async Task<Project?> GetProject(int? id)
    {
        if (id == null) return null;
        return await context.Project
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.ID == id);
    }

    public async Task<Project> CreateProject(ClaimsPrincipal user, ProjectViewModel vm)
    {
        var tags = await tagService.GetTrackableTags(vm.Tags);
        var project = vm.CreateProjectModel(userManager.GetUserId(user)!, tags);
        context.Add(project);
        await SaveChanges();
        return project;
    }

    public async Task UpdateProject(Project project, ProjectViewModel vm)
    {
        var tags = await tagService.GetTrackableTags(vm.Tags);
        vm.UpdateProjectModel(project, tags);
        context.Update(project);
        await SaveChanges();
    }
    public async Task Delete(ClaimsPrincipal user, List<int> selectedIds)
    {
        var userId = userManager.GetUserId(user);
        var projects = context.Project.Where(p => selectedIds.Contains(p.ID) && p.UserId == userId);
        context.RemoveRange(projects);
        await SaveChanges();
    }

    public bool CanView(ClaimsPrincipal user, Project project)
    {
        var userId = userManager.GetUserId(user);
        return project.UserId == userId || user.IsInRole(DbSeeder.RecruiterRole) || user.IsInRole(DbSeeder.AdminRole);
    }

    public bool CanEdit(ClaimsPrincipal user, Project project)
    {
        var userId = userManager.GetUserId(user);
        return project.UserId == userId || user.IsInRole(DbSeeder.AdminRole);
    }

    private async Task SaveChanges()
    {
        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            DbExceptionHandler.Handle(ex);
        }
    }
}
