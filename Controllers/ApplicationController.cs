using CVManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CVManagement.Controllers;

public class ApplicationController : Controller
{
    protected void PrepareTags(List<Tag> tags, Position position)
    {
        var selected = position.Tags.Select(t => t.ID.ToString()).ToList();
        PrepareTags(tags, selected);
    }

    protected void PrepareTags(List<Tag> tags, Project project)
    {
        var selected = project.Tags.Select(t => t.ID.ToString()).ToList();
        PrepareTags(tags, selected);
    }

    protected void PrepareTags(List<Tag> tags, List<string> selected)
    {
        var selectList = new List<SelectListItem>();
        foreach (var tag in tags)
            selectList.Add(new SelectListItem(tag.Name, tag.ID.ToString(), selected.Contains(tag.ID.ToString())));
        ViewData["TagList"] = selectList;
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
