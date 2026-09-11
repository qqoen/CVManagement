using Microsoft.EntityFrameworkCore;

namespace CVManagement.Models;

[Index(nameof(Name), IsUnique = true)]
public class Tag
{
    public int ID { get; set; }

    public string Name { get; set; } = string.Empty;

    public ICollection<Position> Positions { get; } = new List<Position>();
}
