using CVManagement.Data;
using CVManagement.Models;
using CVManagement.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CVManagement.Controllers;

[Authorize]
public class CVController : Controller
{
    private readonly CVService cvService;

    public CVController(
        CVService cvService)
    {
        this.cvService = cvService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin, Candidate, Recruiter")]
    public async Task<IActionResult> Details(int? id)
    {
        var cv = await cvService.GetCV(id);
        if (cv == null) return NotFound();
        if (User.IsInRole(DbSeeder.CandidateRole) && !cvService.IsOwner(User, cv)) return NotFound();
        return View(cv);
    }

    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Edit(int? id)
    {
        var cv = await cvService.GetCV(id);
        if (cv == null || !cvService.IsOwner(User, cv)) return NotFound();
        return View(cv);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Edit(int? id, CV cv)
    {
        if (id != cv.ID || !cvService.IsOwner(User, cv)) return NotFound();
        if (ModelState.IsValid)
        {
            await cvService.Update(cv);
            return RedirectToAction(nameof(Details), new { id = cv.ID });
        }
        return View(cv);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        await cvService.Delete(User, selectedIds);
        return Ok();
    }
}
