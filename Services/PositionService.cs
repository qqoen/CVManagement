using CVManagement.Data;
using CVManagement.Models;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NuGet.Packaging;
using System.Security.Claims;

namespace CVManagement.Services;

public class PositionService
{
    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    private readonly TagService tagService;

    public class PositionValidationException : Exception
    {
        public PositionValidationException(string message) : base(message)
        {

        }
    }

    public PositionService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        TagService tagService)
    {
        this.context = context;
        this.userManager = userManager;
        this.tagService = tagService;
    }

    public async Task<List<Position>> GetList()
    {
        var positions = await context.Positions
            .OrderBy(p => p.Title)
            .ToListAsync();
        return positions;
    }

    public async Task<List<Position>> GetLatestPositions(int maxPositions)
    {
        return await context.Positions
            .OrderByDescending(p => p.LastUpdated)
            .Take(maxPositions)
            .ToListAsync();
    }

    public async Task<Position?> GetPosition(int? id)
    {
        if (id == null) return null;
        return await context.Positions
            .Include(p => p.Tags)
            .Include(p => p.CVAttributes)
            .FirstOrDefaultAsync(s => s.ID == id);
    }

    public async Task Create(PositionViewModel vm)
    {
        var tags = await tagService.GetTrackableTags(vm.Tags);
        var attributes = await GetAttributes(vm);
        var position = vm.CreatePositionModel(tags, attributes);
        context.Add(position);
        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            DbExceptionHandler.Handle(ex, $"Title '{vm.Title}' already exists.");
        }
    }

    public async Task Update(Position position, PositionViewModel vm)
    {
        var tags = await tagService.GetTrackableTags(vm.Tags);
        var attributes = await GetAttributes(vm);
        vm.UpdatePositionModel(position, tags, attributes);
        context.Update(position);
        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            DbExceptionHandler.Handle(ex, $"Title '{vm.Title}' already exists.");
        }
    }

    public async Task Delete(List<int> selectedIds)
    {
        var positions = context.Positions.Where(p => selectedIds.Contains(p.ID));
        context.RemoveRange(positions);
        await SaveChanges();
    }

    public async Task Duplicate(Position position)
    {
        context.Add(position.Clone());
        await SaveChanges();
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
            throw new PositionValidationException("You already submitted CV to this position.");
        var requiredAttributeIds = position.CVAttributes.Select(a => a.ID).ToList();
        var userValues = user.CVAttributeValues.Where(v => requiredAttributeIds.Contains((int)v.CVAttributeID)).ToList();
        if (userValues.Count < requiredAttributeIds.Count)
            throw new PositionValidationException("Some attributes are missing from your library or they are not filled.");
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

    private async Task<List<CVAttribute>> GetAttributes(PositionViewModel positionVm)
    {
        return await context.CVAttributes
            .Where(a => positionVm.Attributes.Contains(a.ID.ToString()))
            .ToListAsync();
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
