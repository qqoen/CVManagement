using CVManagement.Data;
using CVManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CVManagement.Controllers;

public class ApplicationController : Controller
{
    protected async Task PrepareTags(ApplicationDbContext context, List<string> selected)
    {
        var tags = await context.Tags.ToListAsync();
        var selectList = new List<SelectListItem>();
        foreach (var tag in tags)
            selectList.Add(new SelectListItem(tag.Name, tag.ID.ToString(), selected.Contains(tag.ID.ToString())));
        ViewData["TagList"] = selectList;
    }

    protected async Task<List<Tag>> GetTrackableTags(ApplicationDbContext context, List<string> vmTags)
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

    protected void HandleDbException(DbUpdateException ex)
    {
        var defaultText = "Unable to save changes. Try again, and if the problem persists see your system administrator.";
        if (ex.InnerException is PostgresException sqlException)
            ModelState.AddModelError(string.Empty, $"SQL error occured. Code: '{sqlException.SqlState}'. " + defaultText);
        else
            ModelState.AddModelError(string.Empty, defaultText);
    }

    protected void HandleDbException(DbUpdateException ex, string uniqueFieldMessage, string constraint="")
    {
        var defaultText = "Unable to save changes. Try again, and if the problem persists see your system administrator.";
        var uniqueIndexErrorCode = "23505";
        if (ex.InnerException is PostgresException sqlException)
            if (sqlException.SqlState == uniqueIndexErrorCode && (constraint == "" || sqlException.ConstraintName == constraint))
                ModelState.AddModelError(string.Empty, uniqueFieldMessage);
            else
                ModelState.AddModelError(string.Empty, $"SQL error occured. Code: '{sqlException.SqlState}'. " + defaultText);
        else
            ModelState.AddModelError(string.Empty, defaultText);
    }
}
