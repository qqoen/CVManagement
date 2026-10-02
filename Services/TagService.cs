using CVManagement.Data;
using CVManagement.Models;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Services;

public class TagService
{
    private readonly ApplicationDbContext context;

    public TagService(ApplicationDbContext context)
    {
        this.context = context;
    }

    public async Task<List<Tag>> GetTrackableTags(List<string> vmTags)
    {
        var existingTags = await context.Tags
            .Where(t => vmTags.Contains(t.ID.ToString()))
            .ToListAsync();
        var newTags = new List<string>(vmTags);
        foreach (var tag in existingTags)
            newTags.Remove(tag.ID.ToString());
        var newTagEntities = newTags.Select(t => new Tag() { Name = t }).ToList();
        context.AddRange(newTagEntities);
        existingTags.AddRange(newTagEntities);
        return existingTags;
    }

    public async Task<List<Tag>> GetAll()
    {
        return await context.Tags.ToListAsync();
    }
}
