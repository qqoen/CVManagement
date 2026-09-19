using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using NuGet.Packaging;

namespace CVManagement.Controllers;

public class FillValueViewModel
{
    public int ValueID { get; set; }

    public string Name { get; set; }

    public string Description { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public CVAttributeDataType DataType { get; set; }

    public string Value1 { get; set; } = string.Empty;

    public string Value2 { get; set; } = string.Empty;

    public bool BoolValue { get; set; }

    public static FillValueViewModel Create(CVAttribute attribute, CVAttributeValue? attributeValue)
    {
        var (value1, value2, boolVal) = ParseValues(attribute.DataType, attributeValue?.Value ?? string.Empty);

        return new FillValueViewModel()
        {
            ValueID = attributeValue?.ID ?? default,
            Name = attribute.Name,
            Description = attribute.Description,
            CategoryName = attribute.Category!.Name,
            DataType = attribute.DataType,
            Value1 = value1,
            Value2 = value2,
            BoolValue = boolVal,
        };
    }

    private static (string, string, bool) ParseValues(CVAttributeDataType dataType, string value)
    {
        if (value != string.Empty && dataType == CVAttributeDataType.Period)
        {
            var parts = value.Split(',');

            if (parts.Length > 1)
                return (parts[0], parts[1], false);
            else
                return (parts[0], string.Empty, false);
        }
        else if (dataType == CVAttributeDataType.Boolean)
        {
            var boolVal = value == string.Empty ? false : bool.Parse(value);
            return (string.Empty, string.Empty, boolVal);
        }
        else
        {
            return (value, string.Empty, false);
        }
    }

    public string SerializeValue()
    {
        if (DataType == CVAttributeDataType.Period)
            return Value1 + "," + Value2;

        if (DataType == CVAttributeDataType.Boolean)
            return BoolValue.ToString();

        return Value1;
    }
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
        var attributes = await context.CVAttributes
            .OrderBy(a => a.Name)
            .Include(a => a.Category)
            .ToListAsync();
        return View(attributes);
    }

    [HttpGet]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Create()
    {
        await PrepareCategories();
        return View();
    }

    private async Task PrepareCategories()
    {
        var categories = await context.Categories.ToListAsync();
        var selectList = new List<SelectListItem>();
        foreach (var category in categories)
            selectList.Add(new SelectListItem(category.Name, category.ID.ToString()));
        ViewData["Categories"] = selectList;
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
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
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        var attributes = context.CVAttributes.Where(a => !a.IsMandatory && selectedIds.Contains(a.ID));
        context.RemoveRange(attributes);
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> AddToUser([FromBody] List<int> selectedIds)
    {
        var userId = userManager.GetUserId(User);
        var user = await context.Users
                .Include(u => u.CVAttributes)
                .FirstOrDefaultAsync(u => u.Id == userId);
        var userAttributeIds = user.CVAttributes.Select(a => a.ID).ToList();
        var attributes = context.CVAttributes
            .Where(a => !a.IsMandatory && selectedIds.Contains(a.ID) && !userAttributeIds.Contains(a.ID));
        user.CVAttributes.AddRange(attributes);
        context.Update(user);
        await context.SaveChangesAsync();
        return Ok();
    }

    [HttpGet]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
    public async Task<IActionResult> Edit(int id)
    {
        var attribute = await context.CVAttributes.FirstOrDefaultAsync(s => s.ID == id);
        if (attribute == null) return NotFound();
        await PrepareCategories();
        return View(attribute);
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.RecruiterRole)]
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
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> FillValue(int id)
    {
        var attribute = await context.CVAttributes
            .Include(a => a.Category)
            .FirstOrDefaultAsync(s => s.ID == id);
        if (attribute == null) return NotFound();
        var userId = userManager.GetUserId(User);
        var attributeValue = await context.CVAttributeValues.FirstOrDefaultAsync(v => v.CVAttributeID == id && v.UserId == userId);
        return View(FillValueViewModel.Create(attribute, attributeValue));
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> FillValue(int id, FillValueViewModel fillValueViewModel)
    {
        var attribute = await context.CVAttributes.FirstOrDefaultAsync(s => s.ID == id);
        if (attribute == null) return NotFound();
        var attributeValue = await context.CVAttributeValues.FirstOrDefaultAsync(v => v.ID == fillValueViewModel.ValueID);

        if (attributeValue != null)
        {
            attributeValue.Value = fillValueViewModel.SerializeValue();
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
                Value = fillValueViewModel.SerializeValue(),
            };
            context.Add(attributeValue);
        }

        await context.SaveChangesAsync();
        return RedirectToPage("/Account/Manage/Index", new { area = "Identity" });
    }
}
