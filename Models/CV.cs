using CVManagement.Data;

namespace CVManagement.Models;

public class CV
{
    public int ID { get; set; }

    public int? PositionID { get; set; }

    public Position? Position { get; set; }

    public string? UserId { get; set; }

    public ApplicationUser? User { get; set; }

    public ICollection<CVAttributeValue> CVAttributeValues { get; } = new List<CVAttributeValue>();
}
