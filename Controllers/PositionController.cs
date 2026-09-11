using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using NuGet.Packaging;

namespace CVManagement.Controllers;

public class PositionViewModel
{
    public int ID { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new List<string>();
    public int MaxProjects { get; set; }

    public static PositionViewModel Create(Position position)
    {
        return new PositionViewModel()
        {
            ID = position.ID,
            Title = position.Title,
            Description = position.Description,
            MaxProjects = position.MaxProjects,
            Tags = position.Tags.Select(t => t.ID.ToString()).ToList(),
        };
    }
}

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
        var positions = await context.Positions
            .OrderBy(p => p.Title)
            .ToListAsync();
        return View(positions);
    }

    [HttpGet]
    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        var position = await context.Positions
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(m => m.ID == id);
        if (position == null) return NotFound();
        ViewData["TagList"] = string.Join(", ", position.Tags.Select(t => t.Name));
        return View(PositionViewModel.Create(position));
    }

    [HttpGet]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Create()
    {
        await PrepareTags();
        return View(new PositionViewModel());
    }

    private async Task PrepareTags()
    {
        var tags = await context.Tags.ToListAsync();
        var selectList = new List<SelectListItem>();
        foreach (var tag in tags)
            selectList.Add(new SelectListItem(tag.Name, tag.ID.ToString()));
        ViewData["TagList"] = selectList;
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Create(PositionViewModel position)
    {
        if (ModelState.IsValid)
        {
            try
            {
                var p = new Position()
                {
                    ID = position.ID,
                    Title = position.Title,
                    Description = position.Description,
                    MaxProjects = position.MaxProjects,
                    LastUpdated = DateTimeOffset.Now,
                };
                p.Tags.AddRange(await GetTrackableTags(position.Tags));
                context.Add(p);
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

    private async Task<List<Tag>> GetTrackableTags(List<string> viewModelTags)
    {
        var existingTags = await context.Tags
            .Where(t => viewModelTags.Contains(t.ID.ToString()))
            .ToListAsync();

        var newTags = new List<string>(viewModelTags);

        foreach (var tag in existingTags)
            newTags.Remove(tag.ID.ToString());

        var newTagEntities = newTags.Select(t => new Tag() { Name = t }).ToList();

        context.AddRange(newTagEntities);

        existingTags.AddRange(newTagEntities);

        return existingTags;
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        var positions = context.Positions.Where(p => selectedIds.Contains(p.ID));
        context.RemoveRange(positions);
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Edit(int id)
    {
        var position = await context.Positions
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(s => s.ID == id);
        if (position == null) return NotFound();
        await PrepareTags();
        return View(PositionViewModel.Create(position));
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Edit(int id, PositionViewModel positionViewModel)
    {
        if (ModelState.IsValid)
        {
            try
            {
                var position = await context.Positions
                    .Include(p => p.Tags)
                    .FirstOrDefaultAsync(s => s.ID == id);

                position.Title = positionViewModel.Title;
                position.Description = positionViewModel.Description;
                position.MaxProjects = positionViewModel.MaxProjects;
                position.LastUpdated = DateTimeOffset.Now;
                position.Tags.Clear();
                position.Tags.AddRange(await GetTrackableTags(positionViewModel.Tags));

                context.Update(position);
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex, $"Title '{positionViewModel.Title}' already exists.");
            }
        }

        return View(positionViewModel);
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Duplicate(int id)
    {
        var position = await context.Positions.FirstOrDefaultAsync(m => m.ID == id);
        if (position == null) return NotFound();

        try
        {
            var clone = new Position()
            {
                Title = position.Title,
                Description = position.Description,
                MaxProjects = position.MaxProjects,
                LastUpdated = DateTimeOffset.Now,
            };
            clone.Tags.AddRange(position.Tags);
            context.Add(clone);
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            HandleDbException(ex);
        }

        return RedirectToAction(nameof(Index));
    }
}
