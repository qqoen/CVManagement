using CVManagement.Models;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace CVManagement.Services;

public class SelectLookupService
{
    private readonly TagService tagService;

    public SelectLookupService(TagService tagService)
    {
        this.tagService = tagService;
    }

    public async Task<List<SelectListItem>> GetTags(Position position)
    {
        var selected = position.Tags.Select(t => t.ID.ToString()).ToList();
        return await GetTags(selected);
    }

    public async Task<List<SelectListItem>> GetTags(Project project)
    {
        var selected = project.Tags.Select(t => t.ID.ToString()).ToList();
        return await GetTags(selected);
    }

    public async Task<List<SelectListItem>> GetTags(List<string>? selected = null)
    {
        var tags = await tagService.GetAll();
        var selectList = new List<SelectListItem>();
        foreach (var tag in tags)
            selectList.Add(new SelectListItem(tag.Name, tag.ID.ToString(), selected != null && selected.Contains(tag.ID.ToString())));
        return selectList;
    }
}
