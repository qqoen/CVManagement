using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Controllers;

[Authorize]
public class CVController : ApplicationController
{
    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    public CVController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        var cv = await context.CV
            .Include(cv => cv.CVAttributeValues)
            .Include(cv => cv.Position)
            .Include(cv => cv.User)
            .FirstOrDefaultAsync(cv => cv.ID == id);
        if (cv == null) return NotFound();
        return View(cv);
    }

    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();
        var cv = await context.CV.FindAsync(id);
        if (cv == null) return NotFound();
        return View(cv);
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> Edit(int? id, CV cv)
    {
        if (id != cv.ID) return NotFound();
        if (ModelState.IsValid)
        {
            context.Update(cv);
            await context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), new { id = cv.ID });
        }
        return View(cv);
    }

    [HttpPost]
    [Authorize(Roles = DbSeeder.CandidateRole)]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        var cvs = context.CV.Where(cv => selectedIds.Contains(cv.ID));
        context.RemoveRange(cvs);
        await context.SaveChangesAsync();
        return Ok();
    }
}
