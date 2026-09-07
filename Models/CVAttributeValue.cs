using CVManagement.Data;

namespace CVManagement.Models;

public class CVAttributeValue
{
    public int ID { get; set; }

    public string Value { get; set; } = string.Empty;

    public int? CVAttributeID { get; set; }

    public CVAttribute? CVAttribute { get; set; }

    public string? UserId { get; set; }

    public ApplicationUser? User { get; set; }
}
