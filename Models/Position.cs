using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace CVManagement.Models;

[Index(nameof(Title), IsUnique = true)]
public class Position
{
    public int ID { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    //public int AccessRules { get; set; }

    //public List<Tag> ProjectTags { get; set; } = [];

    [Range(0, 10)]
    public int MaxProjects { get; set; }

    [DisplayFormat(DataFormatString = "{0:MMM-dd HH:mm}")]
    public DateTimeOffset LastUpdated { get; set; }

    public ICollection<CV> CVs { get; set; } = new List<CV>();
}
