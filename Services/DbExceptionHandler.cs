using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CVManagement.Services;

public class EntityUpdateException(string message) : Exception(message)
{
}

public static class DbExceptionHandler
{
    private static readonly string defaultText = "Unable to save changes. Try again, and if the problem persists see your system administrator.";
    
    private static readonly string uniqueIndexErrorCode = "23505";

    public static void Handle(DbUpdateException ex)
    {
        if (ex.InnerException is PostgresException sqlException)
            throw new EntityUpdateException($"SQL error occured. Code: '{sqlException.SqlState}'. {defaultText}");
        else
            throw new EntityUpdateException(defaultText);
    }

    public static void Handle(DbUpdateException ex, string uniqueFieldMessage, string constraint = "")
    {
        if (IsUniqueConstraint(ex, constraint))
            throw new EntityUpdateException(uniqueFieldMessage);
        else
            Handle(ex);
    }

    private static bool IsUniqueConstraint(DbUpdateException ex, string constraint)
    {
        return ex.InnerException is PostgresException sqlException
            && sqlException.SqlState == uniqueIndexErrorCode
            && (constraint == "" || sqlException.ConstraintName == constraint);
    }
}
