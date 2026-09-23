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

[Authorize]
public class CVAttributeController : ApplicationController
{
    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    public CVAttributeController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var attributes = await context.CVAttributes
            .OrderBy(a => a.Name)
            .Include(a => a.Category)
            .ToListAsync();
        return View(attributes);
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Create()
    {
        await PrepareCategories();
        return View();
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Create(CVAttribute attribute)
    {
        if (ModelState.IsValid)
        {
            attribute.Format();
            context.Add(attribute);
            try
            {
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleUniqueNameException(ex, attribute);
            }
        }
        await PrepareCategories();
        return View(attribute);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        var attributes = context.CVAttributes.Where(a => !a.IsMandatory && selectedIds.Contains(a.ID));
        context.RemoveRange(attributes);
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> AddToUser([FromBody] List<int> selectedIds)
    {
        var userId = userManager.GetUserId(User);
        var user = await context.Users
            .Include(u => u.CVAttributes)
            .FirstOrDefaultAsync(u => u.Id == userId);
        var userAttributeIds = user!.CVAttributes.Select(a => a.ID).ToList();
        var attributes = context.CVAttributes
            .Where(a => !a.IsMandatory && selectedIds.Contains(a.ID) && !userAttributeIds.Contains(a.ID));
        user.CVAttributes.AddRange(attributes);
        context.Update(user);
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Edit(int id)
    {
        var attribute = await context.CVAttributes.FindAsync(id);
        if (attribute == null) return NotFound();
        await PrepareCategories();
        return View(attribute);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Edit(int id, CVAttribute attribute)
    {
        if (id != attribute.ID) return NotFound();
        if (ModelState.IsValid)
        {
            attribute.Format();
            context.Update(attribute);
            try
            {
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleUniqueNameException(ex, attribute);
            }
        }
        return View(attribute);
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> FillValue(int id)
    {
        var attribute = await context.CVAttributes
            .Include(a => a.Category)
            .FirstOrDefaultAsync(s => s.ID == id);
        if (attribute == null) return NotFound();
        var userId = userManager.GetUserId(User);
        var attributeValue = await context.CVAttributeValues
            .FirstOrDefaultAsync(v => v.CVAttributeID == id && v.UserId == userId);
        return View(FillValueViewModel.Create(attribute, attributeValue));
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> FillValue(int id, FillValueViewModel fillValueViewModel)
    {
        var attribute = await context.CVAttributes.FindAsync(id);
        if (attribute == null) return NotFound();
        var attributeValue = await context.CVAttributeValues.FindAsync(fillValueViewModel.ValueID);
        if (attributeValue != null)
            await UpdateAttributeValue(attributeValue, fillValueViewModel);
        else
            await CreateAttributeValue(attribute, fillValueViewModel);
        return RedirectToPage("/Account/Manage/Index", new { area = "Identity" });
    }

    private async Task UpdateAttributeValue(CVAttributeValue attributeValue, FillValueViewModel fillValueViewModel)
    {
        attributeValue.Value = fillValueViewModel.SerializeValue();
        context.Update(attributeValue);
        await context.SaveChangesAsync();
    }

    private async Task CreateAttributeValue(CVAttribute attribute, FillValueViewModel fillValueViewModel)
    {
        var user = (await userManager.GetUserAsync(User))!;
        var attributeValue = fillValueViewModel.CreateValueModel(attribute, user);
        context.Add(attributeValue);
        await context.SaveChangesAsync();
    }

    private async Task PrepareCategories()
    {
        var categories = await context.Categories.ToListAsync();
        var selectList = new List<SelectListItem>();
        foreach (var category in categories)
            selectList.Add(new SelectListItem(category.Name, category.ID.ToString()));
        ViewData["Categories"] = selectList;
    }

    private void HandleUniqueNameException(DbUpdateException ex, CVAttribute attribute)
    {
        var constraintName = "IX_CVAttributes_Name";
        HandleDbException(ex, $"Name '{attribute.Name}' already exists.", constraintName);
    }
}
