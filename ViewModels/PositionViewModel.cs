using CVManagement.Models;
using NuGet.Packaging;

namespace CVManagement.ViewModels;

public class PositionViewModel
{
    public int ID { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public List<string> Tags { get; set; } = new List<string>();

    public List<string> Attributes { get; set; } = new List<string>();

    public int MaxProjects { get; set; }

    public string? TagNames { get; set; }

    public string? AttributeNames { get; set; }

    public static PositionViewModel Create(Position position)
    {
        return new PositionViewModel()
        {
            ID = position.ID,
            Title = position.Title,
            Description = position.Description,
            MaxProjects = position.MaxProjects,
            Tags = position.Tags.Select(t => t.ID.ToString()).ToList(),
            TagNames = string.Join(", ", position.Tags.Select(t => t.Name)),
            AttributeNames = string.Join(", ", position.CVAttributes.Select(t => t.Name)),
            Attributes = position.CVAttributes.Select(a => a.ID.ToString()).ToList(),
        };
    }

    public Position CreatePositionModel(List<Tag> tags, List<CVAttribute> attribtes)
    {
        var position = new Position()
        {
            ID = ID,
            Title = Title,
            Description = Description,
            MaxProjects = MaxProjects,
            LastUpdated = DateTimeOffset.Now,
        };
        position.Tags.AddRange(tags);
        position.CVAttributes.AddRange(attribtes);
        return position;
    }

    public void UpdatePositionModel(Position position, List<Tag> tags, List<CVAttribute> attribtes)
    {
        position.Title = Title;
        position.Description = Description;
        position.MaxProjects = MaxProjects;
        position.LastUpdated = DateTimeOffset.Now;
        position.Tags.Clear();
        position.Tags.AddRange(tags);
        position.CVAttributes.Clear();
        position.CVAttributes.AddRange(attribtes);
    }
}
