using CVManagement.Models;
using CVManagement.Services;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace CVManagement.Controllers;

[Authorize]
public class CVAttributeController : Controller
{
    private readonly CVAttributeService attributeService;

    public CVAttributeController(CVAttributeService attributeService)
    {
        this.attributeService = attributeService;
    }

    public class CVAttributesViewModel
    {
        public string? SearchString { get; set; }

        public List<CVAttribute> CVAttributes { get; set; } = [];
    }

    [HttpGet]
    public async Task<IActionResult> Index(string searchString)
    {
        return View(new CVAttributesViewModel()
        {
            SearchString = searchString,
            CVAttributes = await attributeService.GetList(searchString),
        });
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
            try
            {
                await attributeService.Create(attribute);
                return RedirectToAction(nameof(Index));
            }
            catch (EntityUpdateException ex)
            {
                ModelState.AddModelError(string.Empty, ex.Message);
            }
        }
        await PrepareCategories();
        return View(attribute);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        await attributeService.Delete(selectedIds);
        return Ok();
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> AddToUser([FromBody] List<int> selectedIds)
    {
        await attributeService.AddAttributeToUser(User, selectedIds);
        return Ok();
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Edit(int id)
    {
        var attribute = attributeService.Get(id);
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
            try
            {
                await attributeService.Update(attribute);
                return RedirectToAction(nameof(Index));
            }
            catch (EntityUpdateException ex)
            {
                ModelState.AddModelError(string.Empty, ex.Message);
            }
        }
        return View(attribute);
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Recruiter, Candidate")]
    public async Task<IActionResult> FillValue(int id)
    {
        var (attribute, attributeValue) = await attributeService.GetAttributeValue(User, id);
        if (attribute == null) return NotFound();
        return View(FillValueViewModel.Create(attribute, attributeValue));
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter, Candidate")]
    public async Task<IActionResult> FillValue(int id, FillValueViewModel vm)
    {
        if (await attributeService.FillAttributeValue(User, id, vm))
            return RedirectToPage("/Account/Manage/Index", new { area = "Identity" });
        return NotFound();
    }

    private async Task PrepareCategories()
    {
        var categories = await attributeService.GetCategories();
        var selectList = new List<SelectListItem>();
        foreach (var category in categories)
            selectList.Add(new SelectListItem(category.Name, category.ID.ToString()));
        ViewData["Categories"] = selectList;
    }
}
