using Microsoft.EntityFrameworkCore;

namespace CVManagement.Models;

[Index(nameof(Name), IsUnique = true)]
public class CVAttribute
{
    public int ID { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int? CategoryID { get; set; }

    public Category? Category { get; set; }

    public CVAttributeDataType DataType { get; set; }

    public ICollection<CVAttributeValue> CVAttributeValues { get; set; } = new List<CVAttributeValue>();
}
