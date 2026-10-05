using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NuGet.Packaging;
using System.Security.Claims;

namespace CVManagement.Services;

public class CVService
{
    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    public class CVValidationException(string message) : Exception(message)
    {
    }

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

    public async Task<CV> GenerateCV(ClaimsPrincipal principal, Position position)
    {
        var cv = await TryGenerateCV(principal, position);
        context.Add(cv);
        await SaveChanges();
        return cv;
    }

    private async Task<CV> TryGenerateCV(ClaimsPrincipal principal, Position position)
    {
        var user = (await GetCurrentUser(principal))!;
        var existingCV = await context.CV.FirstOrDefaultAsync(cv => cv.UserId == user.Id && cv.PositionID == position.ID);
        if (existingCV != null)
            throw new CVValidationException("You already submitted CV to this position.");
        var requiredAttributeIds = position.CVAttributes.Select(a => a.ID).ToList();
        var userValues = user.CVAttributeValues.Where(v => requiredAttributeIds.Contains((int)v.CVAttributeID)).ToList();
        if (userValues.Count < requiredAttributeIds.Count)
            throw new CVValidationException("Some attributes are missing from your library or they are not filled.");
        return CreateCVModel(position, user, userValues);
    }

    private CV CreateCVModel(Position position, ApplicationUser user, List<CVAttributeValue> userValues)
    {
        var cv = new CV()
        {
            PositionID = position.ID,
            Position = position,
            UserId = user.Id,
            User = user,
            SubmissionDate = DateTimeOffset.Now,
        };
        cv.CVAttributeValues.AddRange(userValues);
        return cv;
    }

    private async Task<ApplicationUser?> GetCurrentUser(ClaimsPrincipal principal)
    {
        var userId = userManager.GetUserId(principal);
        return await context.Users
            .Include(u => u.CVAttributeValues)
            .FirstOrDefaultAsync(u => u.Id == userId);
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
