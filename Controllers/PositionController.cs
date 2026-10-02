using CVManagement.Models;
using CVManagement.Services;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Controllers;

public class PositionController : ApplicationController
{
    private readonly TagService tagService;

    private readonly PositionService positionService;

    private readonly CVAttributeService attributeService;

    public PositionController(
        TagService tagService,
        PositionService positionService,
        CVAttributeService attributeService)
    {
        this.tagService = tagService;
        this.positionService = positionService;
        this.attributeService = attributeService;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        return View(await positionService.GetList());
    }

    [HttpGet]
    public async Task<IActionResult> Details(int? id)
    {
        var position = await positionService.GetPosition(id);
        if (position == null) return NotFound();
        return View(PositionViewModel.Create(position));
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Create()
    {
        PrepareTags(await tagService.GetAll(), []);
        PrepareAttributes(await attributeService.GetOptional(), []);
        return View(new PositionViewModel());
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Create(PositionViewModel vm)
    {
        if (ModelState.IsValid)
        {
            try
            {
                await positionService.Create(vm);
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                HandleDbException(ex, $"Title '{vm.Title}' already exists.");
            }
        }
        return View(vm);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        await positionService.Delete(selectedIds);
        return Ok();
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Edit(int? id)
    {
        var position = await positionService.GetPosition(id);
        if (position == null) return NotFound();
        PrepareTags(await tagService.GetAll(), position);
        PrepareAttributes(await attributeService.GetOptional(), position);
        return View(PositionViewModel.Create(position));
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Recruiter")]
    public async Task<IActionResult> Edit(int? id, PositionViewModel positionVm)
    {
        var position = await positionService.GetPosition(id);
        if (position == null) return NotFound();
        if (ModelState.IsValid)
        {
            try
            {
                await positionService.Update(position, positionVm);
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
        var position = await positionService.GetPosition(id);
        if (position == null) return NotFound();
        try
        {
            await positionService.Duplicate(position);
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
        var position = await positionService.GetPosition(id);
        if (position == null) return NotFound();
        try
        {
            var cv = await positionService.GenerateCV(User, position);
            return RedirectToAction("Details", "CV", new { id = cv.ID });
        }
        catch (PositionService.PositionValidationException ex)
        {
            ModelState.AddModelError(string.Empty, ex.Message);
            return View(nameof(Details), PositionViewModel.Create(position));
        }
    }

    private void PrepareAttributes(List<CVAttribute> attributes, Position position)
    {
        PrepareAttributes(attributes, position.CVAttributes.Select(a => a.ID.ToString()).ToList());
    }

    private void PrepareAttributes(List<CVAttribute> attributes, List<string> selected)
    {
        var selectList = new List<SelectListItem>();
        foreach (var attr in attributes)
            selectList.Add(new SelectListItem(attr.Name, attr.ID.ToString(), selected.Contains(attr.ID.ToString())));
        ViewData["AttributesList"] = selectList;
    }
}
