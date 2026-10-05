using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CVManagement.Services;

public class CVService
{
    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    public CVService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
    }

    public async Task<CV?> GetCV(int? id)
    {
        if (id == null) return null;
        return await context.CV
            .Include(cv => cv.CVAttributeValues)
            .Include(cv => cv.Position)
            .Include(cv => cv.User)
            .FirstOrDefaultAsync(cv => cv.ID == id);
    }

    public async Task Update(CV cv)
    {
        context.Update(cv);
        await SaveChanges();
    }

    public async Task Delete(ClaimsPrincipal principal, List<int> selectedIds)
    {
        var userId = userManager.GetUserId(principal);
        var cvs = context.CV.Where(cv => selectedIds.Contains(cv.ID) && cv.UserId == userId);
        context.RemoveRange(cvs);
        await SaveChanges();
    }

    public bool IsOwner(ClaimsPrincipal principal, CV cv)
    {
        return cv.UserId == userManager.GetUserId(principal);
    }

    private async Task SaveChanges()
    {
        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            DbExceptionHandler.Handle(ex);
        }
    }
}
