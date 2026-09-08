namespace CVManagement.Models;

public class Category
{
    public int ID { get; set; }

    public string Name { get; set; } = string.Empty;

    public ICollection<CVAttribute> CVAttributes { get; set; } = new List<CVAttribute>();
}
