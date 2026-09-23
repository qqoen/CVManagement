using CVManagement.Data;
using CVManagement.Models;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using NuGet.Packaging;

namespace CVManagement.Controllers;

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
        var position = await GetPosition(id);
        if (position == null) return NotFound();
        return View(PositionViewModel.Create(position));
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Create()
    {
        await PrepareTags(context, new List<string>());
        await PrepareAttributes(new List<string>());
        return View(new PositionViewModel());
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Create(PositionViewModel positionVm)
    {
        if (ModelState.IsValid)
        {
            var tags = await GetTrackableTags(context, positionVm.Tags);
            var attributes = await GetAttributes(positionVm);
            var position = positionVm.CreatePositionModel(tags, attributes);
            context.Add(position);
            try
            {
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex, $"Title '{positionVm.Title}' already exists.");
            }
        }
        return View(positionVm);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        var positions = context.Positions.Where(p => selectedIds.Contains(p.ID));
        context.RemoveRange(positions);
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Edit(int? id)
    {
        var position = await GetPosition(id);
        if (position == null) return NotFound();
        await PrepareTags(context, position.Tags.Select(t => t.ID.ToString()).ToList());
        await PrepareAttributes(position.CVAttributes.Select(a => a.ID.ToString()).ToList());
        return View(PositionViewModel.Create(position));
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Edit(int? id, PositionViewModel positionVm)
    {
        if (ModelState.IsValid)
        {
            var position = await GetPosition(id);
            if (position == null) return NotFound();
            var tags = await GetTrackableTags(context, positionVm.Tags);
            var attributes = await GetAttributes(positionVm);
            positionVm.UpdatePositionModel(position, tags, attributes);
            context.Update(position);
            try
            {
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex, $"Title '{positionVm.Title}' already exists.");
            }
        }
        return View(positionVm);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Duplicate(int id)
    {
        var position = await GetPosition(id);
        if (position == null) return NotFound();
        context.Add(position.Clone());
        try
        {
            await context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        catch (DbUpdateException ex)
        {
            HandleDbException(ex);
            return View(nameof(Details), PositionViewModel.Create(position));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> SubmitCV(int id)
    {
        var position = await GetPosition(id);
        if (position == null) return NotFound();
        var user = (await GetCurrentUser())!;
        var cv = await TryCreateCV(position, user);
        if (cv == null)
            return View(nameof(Details), PositionViewModel.Create(position));
        context.Add(cv);
        await context.SaveChangesAsync();
        return RedirectToAction("Details", "CV", new { id = cv.ID });
    }

    private async Task<CV?> TryCreateCV(Position position, ApplicationUser user)
    {
        var existingCV = await context.CV.FirstOrDefaultAsync(cv => cv.UserId == user.Id && cv.PositionID == position.ID);
        if (existingCV != null)
        {
            ModelState.AddModelError(string.Empty, "You already submitted CV to this position.");
            return null;
        }
        var requiredAttributeIds = position.CVAttributes.Select(a => a.ID).ToList();
        var userValues = user.CVAttributeValues.Where(v => requiredAttributeIds.Contains((int)v.CVAttributeID)).ToList();
        if (userValues.Count < requiredAttributeIds.Count)
        {
            ModelState.AddModelError(string.Empty, "Some attributes are missing from your library.");
            return null;
        }
        return CreateCVModel(position, user, userValues);
    }

    private CV CreateCVModel(Position position, ApplicationUser user, List<CVAttributeValue> userValues)
    {
        var cv = new CV()
        {
            PositionID = position.ID,
            Position = position,
            UserId = user.Id,
            User = user,
        };
        cv.CVAttributeValues.AddRange(userValues);
        return cv;
    }

    private async Task<ApplicationUser?> GetCurrentUser()
    {
        var userId = userManager.GetUserId(User);
        return await context.Users
            .Include(u => u.CVAttributeValues)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    private async Task<Position?> GetPosition(int? id)
    {
        if (id == null) return null;
        return await context.Positions
            .Include(p => p.Tags)
            .Include(p => p.CVAttributes)
            .FirstOrDefaultAsync(s => s.ID == id);
    }

    private async Task<List<CVAttribute>> GetAttributes(PositionViewModel positionVm)
    {
        return await context.CVAttributes
            .Where(a => positionVm.Attributes.Contains(a.ID.ToString()))
            .ToListAsync();
    }

    private async Task PrepareAttributes(List<string> selected)
    {
        var attributes = await context.CVAttributes
            .Where(a => !a.IsMandatory)
            .ToListAsync();
        var selectList = new List<SelectListItem>();
        foreach (var attr in attributes)
            selectList.Add(new SelectListItem(attr.Name, attr.ID.ToString(), selected.Contains(attr.ID.ToString())));
        ViewData["AttributesList"] = selectList;
    }
}
