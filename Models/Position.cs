using System.ComponentModel.DataAnnotations;

namespace CVManagement.Models;

public class Position
{
    public int ID { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public ICollection<CVAttribute> CVAttributes { get; } = new List<CVAttribute>();

    public ICollection<Tag> Tags { get; } = new List<Tag>();

    [Range(0, 10)]
    public int MaxProjects { get; set; }

    [DisplayFormat(DataFormatString = "{0:MMM-dd HH:mm}")]
    public DateTimeOffset LastUpdated { get; set; }

    public ICollection<CV> CVs { get; } = new List<CV>();
}
