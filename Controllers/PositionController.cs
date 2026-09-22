using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
    public List<string> Attributes { get; set; } = new List<string>();
    public int MaxProjects { get; set; }
    public string TagNames { get; set; }
    public string AttributeNames { get; set; }

    public static PositionViewModel Create(Position position)
    {
        return new PositionViewModel()
        {
            ID = position.ID,
            Title = position.Title,
            Description = position.Description,
            MaxProjects = position.MaxProjects,
            Tags = position.Tags.Select(t => t.ID.ToString()).ToList(),
            TagNames = string.Join(", ", position.Tags.Select(t => t.Name)),
            AttributeNames = string.Join(", ", position.CVAttributes.Select(t => t.Name)),
            Attributes = position.CVAttributes.Select(a => a.ID.ToString()).ToList(),
        };
    }
}

public class PositionController : ApplicationController
{
    private readonly ApplicationDbContext context;
    private readonly UserManager<ApplicationUser> userManager;

    public PositionController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
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
            .Include(p => p.CVAttributes)
            .FirstOrDefaultAsync(m => m.ID == id);
        if (position == null) return NotFound();
        return View(PositionViewModel.Create(position));
    }

    [HttpGet]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Create()
    {
        await PrepareTags(context, new List<string>());
        await PrepareAttributes(new List<string>());
        return View(new PositionViewModel());
    }

    protected async Task PrepareAttributes(List<string> selected)
    {
        var attributes = await context.CVAttributes
            .Where(a => !a.IsMandatory)
            .ToListAsync();
        var selectList = new List<SelectListItem>();
        foreach (var attr in attributes)
            selectList.Add(new SelectListItem(attr.Name, attr.ID.ToString(), selected.Contains(attr.ID.ToString())));
        ViewData["AttributesList"] = selectList;
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Create(PositionViewModel position)
    {
        if (ModelState.IsValid)
        {
            var p = new Position()
            {
                ID = position.ID,
                Title = position.Title,
                Description = position.Description,
                MaxProjects = position.MaxProjects,
                LastUpdated = DateTimeOffset.Now,
            };
            p.Tags.AddRange(await GetTrackableTags(context, position.Tags));
            p.CVAttributes.AddRange(await GetAttributes(position));
            context.Add(p);

            try
            {
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

    private async Task<List<CVAttribute>> GetAttributes(PositionViewModel positionVm)
    {
        return await context.CVAttributes
            .Where(a => positionVm.Attributes.Contains(a.ID.ToString()))
            .ToListAsync();
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
            .Include(p => p.CVAttributes)
            .FirstOrDefaultAsync(s => s.ID == id);
        if (position == null) return NotFound();
        await PrepareTags(context, position.Tags.Select(t => t.ID.ToString()).ToList());
        await PrepareAttributes(position.CVAttributes.Select(a => a.ID.ToString()).ToList());
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
                    .Include(p => p.CVAttributes)
                    .FirstOrDefaultAsync(s => s.ID == id);

                position.Title = positionViewModel.Title;
                position.Description = positionViewModel.Description;
                position.MaxProjects = positionViewModel.MaxProjects;
                position.LastUpdated = DateTimeOffset.Now;
                position.Tags.Clear();
                position.Tags.AddRange(await GetTrackableTags(context, positionViewModel.Tags));
                position.CVAttributes.Clear();
                position.CVAttributes.AddRange(await GetAttributes(positionViewModel));

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

    [HttpPost]
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> SubmitCV(int id)
    {
        var position = await context.Positions
            .Include(p => p.Tags)
            .Include(p => p.CVAttributes)
            .FirstOrDefaultAsync(p => p.ID == id);
        if (position == null) return NotFound();
        var userId = userManager.GetUserId(User);
        var user = await context.Users
            .Include(u => u.CVAttributeValues)
            .FirstOrDefaultAsync(u => u.Id == userId);
        var existingCV = await context.CV.FirstOrDefaultAsync(cv => cv.UserId == user.Id && cv.PositionID == position.ID);
        if (existingCV != null)
        {
            ModelState.AddModelError(string.Empty, "You already submitted CV to this position.");
            return View(nameof(Details), PositionViewModel.Create(position));
        }
        var requiredAttributeIds = position.CVAttributes.Select(a => a.ID).ToList();
        var userValues = user.CVAttributeValues.Where(v => requiredAttributeIds.Contains((int)v.CVAttributeID)).ToList();
        if (userValues.Count < requiredAttributeIds.Count)
        {
            ModelState.AddModelError(string.Empty, "Some attributes are missing from your library.");
            return View(nameof(Details), PositionViewModel.Create(position));
        }

        var cv = new CV()
        {
            PositionID = position.ID,
            Position = position,
            UserId = user.Id,
            User = user,
        };
        cv.CVAttributeValues.AddRange(userValues);

        context.Add(cv);
        await context.SaveChangesAsync();
        return RedirectToAction("Details", "CV", new { id = cv.ID });
    }
}
