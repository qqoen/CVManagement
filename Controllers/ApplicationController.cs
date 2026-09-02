using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CVManagement.Controllers;

public class ApplicationController : Controller
{
    protected void HandleDbException(DbUpdateException ex)
    {
        var defaultText = "Unable to save changes. Try again, and if the problem persists see your system administrator.";

        if (ex.InnerException is PostgresException sqlException)
        {
            ModelState.AddModelError(string.Empty, $"SQL error occured. Code: '{sqlException.SqlState}'. " + defaultText);
        }
        else
        {
            ModelState.AddModelError(string.Empty, defaultText);
        }
    }

    protected void HandleDbException(DbUpdateException ex, string uniqueFieldMessage)
    {
        var defaultText = "Unable to save changes. Try again, and if the problem persists see your system administrator.";
        var uniqueIndexErrorCode = "23505";

        if (ex.InnerException is PostgresException sqlException)
        {
            if (sqlException.SqlState == uniqueIndexErrorCode)
            {
                ModelState.AddModelError(string.Empty, uniqueFieldMessage);
            }
            else
            {
                ModelState.AddModelError(string.Empty, $"SQL error occured. Code: '{sqlException.SqlState}'. " + defaultText);
            }
        }
        else
        {
            ModelState.AddModelError(string.Empty, defaultText);
        }
    }
}
