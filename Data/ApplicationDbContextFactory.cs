using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CVManagement.Data;

public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    ApplicationDbContext IDesignTimeDbContextFactory<ApplicationDbContext>.CreateDbContext(string[] args)
    {
        var variableName = "CONNECTION_LOCAL";
        var connectionString = Environment.GetEnvironmentVariable(variableName);

        if (string.IsNullOrWhiteSpace(connectionString))
            connectionString = "Host=192.168.100.3;Port=5432;Database=cvmanagement;Username=postgres;Password=0000";

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
