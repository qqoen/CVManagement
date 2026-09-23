using CVManagement.Data;
using Microsoft.EntityFrameworkCore;

namespace CVManagement.Models;

[Index(nameof(Name), IsUnique = true)]
public class CVAttribute
{
    public int ID { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsMandatory { get; set; }

    public int? CategoryID { get; set; }

    public Category? Category { get; set; }

    public CVAttributeDataType DataType { get; set; }

    public ICollection<CVAttributeValue> CVAttributeValues { get; } = new List<CVAttributeValue>();

    public ICollection<ApplicationUser> Users { get; } = new List<ApplicationUser>();

    public ICollection<Position> Positions { get; } = new List<Position>();

    public void Format()
    {
        Name = Name.Trim();
        Description = Description.Trim();
    }
}
