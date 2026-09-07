
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
    public async Task<IActionResult> Index()
    {
        var userId = userManager.GetUserId(User);
        var cvs = await context.CV
            .Where(cv => cv.UserId == userId)
            .ToListAsync();
        return View(cvs);
    }

    [HttpGet]
    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();
        var cv = await context.CV.FirstOrDefaultAsync(m => m.ID == id);
        if (cv == null) return NotFound();
        return View(cv);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CV cv)
    {
        if (ModelState.IsValid)
        {
            context.Add(cv);
            await context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(cv);
    }

    // GET: CVS/Edit/5
    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var cv = await context.CV.FindAsync(id);
        if (cv == null)
        {
            return NotFound();
        }
        return View(cv);
    }

    // POST: CVS/Edit/5
    // To protect from overposting attacks, enable the specific properties you want to bind to.
    // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int? id, [Bind("ID,PositionID,Position,UserId,User")] CV cv)
    {
        if (id != cv.ID)
        {
            return NotFound();
        }

        if (ModelState.IsValid)
        {
            try
            {
                context.Update(cv);
                await context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CVExists(cv.ID))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            return RedirectToAction(nameof(Index));
        }
        return View(cv);
    }

    private bool CVExists(int? id)
    {
        return context.CV.Any(e => e.ID == id);
    }

    [HttpPost]
    public IActionResult Delete([FromBody] List<int> selectedIds)
    {
        foreach (var id in selectedIds)
        {
            var cv = context.CV.Find(id)!;
            context.Remove(cv);
        }
        context.SaveChanges();
        return Ok();
    }
}
