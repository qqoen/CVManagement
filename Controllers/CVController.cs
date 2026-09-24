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
    [Authorize(Roles = "Admin, Candidate, Recruiter")]
    public async Task<IActionResult> Details(int? id)
    {
        var cv = await GetCV(id);
        if (cv == null) return NotFound();
        if (User.IsInRole(DbSeeder.CandidateRole) && !IsOwner(cv)) return NotFound();
        return View(cv);
    }

    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Edit(int? id)
    {
        var cv = await GetCV(id);
        if (cv == null || !IsOwner(cv)) return NotFound();
        return View(cv);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Edit(int? id, CV cv)
    {
        if (id != cv.ID || !IsOwner(cv)) return NotFound();
        if (ModelState.IsValid)
        {
            context.Update(cv);
            await context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), new { id = cv.ID });
        }
        return View(cv);
    }

    [HttpPost]
    [Authorize(Roles = "Admin, Candidate")]
    public async Task<IActionResult> Delete([FromBody] List<int> selectedIds)
    {
        var userId = userManager.GetUserId(User);
        var cvs = context.CV.Where(cv => selectedIds.Contains(cv.ID) && cv.UserId == userId);
        context.RemoveRange(cvs);
        await context.SaveChangesAsync();
        return Ok();
    }

    private bool IsOwner(CV cv)
    {
        return cv.UserId == userManager.GetUserId(User);
    }

    private async Task<CV> GetCV(int? id)
    {
        if (id == null) return null;
        return await context.CV
            .Include(cv => cv.CVAttributeValues)
            .Include(cv => cv.Position)
            .Include(cv => cv.User)
            .FirstOrDefaultAsync(cv => cv.ID == id);
    }
}
