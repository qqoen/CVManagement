using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Controllers;

public class FillValueViewModel
{
    public int ValueID { get; set; }

    public required string Name { get; set; }

    public required string Description { get; set; }

    public CVAttributeCategory Category { get; set; }

    public CVAttributeDataType DataType { get; set; }

    public string Value { get; set; } = string.Empty;
}

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
        var attributes = await context.CVAttributes.ToListAsync();
        return View(attributes);
    }

    [HttpGet]
    [Authorize(Roles = IdentitySeeder.RecruiterRole)]
    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    [Authorize(Roles = IdentitySeeder.RecruiterRole)]
    public async Task<IActionResult> Create(CVAttribute attribute)
    {
        try
        {
            if (ModelState.IsValid)
            {
                context.Add(attribute);
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
        }
        catch (DbUpdateException ex)
        {
            HandleDbException(ex, $"Name '{attribute.Name}' already exists.");
        }

        return View(attribute);
    }

    [HttpPost]
    [Authorize(Roles = IdentitySeeder.RecruiterRole)]
    public IActionResult Delete([FromBody] List<int> selectedIds)
    {
        foreach (var id in selectedIds)
        {
            var attribute = context.CVAttributes.Find(id)!;
            context.CVAttributes.Remove(attribute);
        }
        context.SaveChanges();
        return Ok();
    }

    [HttpGet]
    [Authorize(Roles = IdentitySeeder.RecruiterRole)]
    public async Task<IActionResult> Edit(int id)
    {
        var attribute = await context.CVAttributes.FirstOrDefaultAsync(s => s.ID == id);
        if (attribute == null) return NotFound();
        return View(attribute);
    }

    [HttpPost]
    [Authorize(Roles = IdentitySeeder.RecruiterRole)]
    public async Task<IActionResult> Edit(int id, CVAttribute attribute)
    {
        if (id != attribute.ID) return NotFound();

        if (ModelState.IsValid)
        {
            try
            {
                context.Update(attribute);
                await context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex, $"Name '{attribute.Name}' already exists.");
            }
        }

        return View(attribute);
    }

    [HttpGet]
    [Authorize(Roles = IdentitySeeder.CandidateRole)]
    public async Task<IActionResult> FillValue(int id)
    {
        var attribute = await context.CVAttributes.FirstOrDefaultAsync(s => s.ID == id);
        if (attribute == null) return NotFound();
        var userId = userManager.GetUserId(User);
        var attributeValue = await context.CVAttributeValues.FirstOrDefaultAsync(v => v.CVAttributeID == id && v.UserId == userId);

        //ModelState.Clear();
        return View(new FillValueViewModel()
        {
            ValueID = attributeValue?.ID ?? default,
            Name = attribute.Name,
            Description = attribute.Description,
            Category = attribute.Category,
            DataType = attribute.DataType,
            Value = attributeValue?.Value ?? string.Empty,
        });
    }

    [HttpPost]
    [Authorize(Roles = IdentitySeeder.CandidateRole)]
    public async Task<IActionResult> FillValue(int id, FillValueViewModel fillValueViewModel)
    {
        var attribute = await context.CVAttributes.FirstOrDefaultAsync(s => s.ID == id);
        if (attribute == null) return NotFound();
        var attributeValue = await context.CVAttributeValues.FirstOrDefaultAsync(v => v.ID == fillValueViewModel.ValueID);

        if (attributeValue != null)
        {
            attributeValue.Value = fillValueViewModel.Value;
            context.Update(attributeValue);
        }
        else
        {
            var user = (await userManager.GetUserAsync(User))!;
            attributeValue = new CVAttributeValue
            {
                CVAttribute = attribute,
                CVAttributeID = attribute.ID,
                User = user,
                UserId = user.Id,
                Value = fillValueViewModel.Value,
            };
            context.Add(attributeValue);
        }

        await context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }
}
