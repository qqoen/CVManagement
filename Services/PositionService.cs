using CVManagement.Data;
using CVManagement.Models;
using CVManagement.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Services;

public class PositionService
{
    private readonly ApplicationDbContext context;

    private readonly TagService tagService;

    public PositionService(
        ApplicationDbContext context,
        TagService tagService)
    {
        this.context = context;
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
