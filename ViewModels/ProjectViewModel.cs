using CVManagement.Models;
using CVManagement.Models.Validation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NuGet.Packaging;
using System.ComponentModel.DataAnnotations;

namespace CVManagement.ViewModels;

public class ProjectViewModel
{
    public int ID { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    [Display(Name = "Start Date")]
    [EarlierDate(nameof(EndDate))]
    public DateTimeOffset StartDate { get; set; }
    [Display(Name = "End Date")]
    [PastDate]
    public DateTimeOffset EndDate { get; set; }
    public List<string> Tags { get; set; } = [];

    public static ProjectViewModel Create(Project project)
    {
        return new ProjectViewModel()
        {
            ID = project.ID,
            UserId = project.UserId,
            Name = project.Name,
            Description = project.Description,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            Tags = project.Tags.Select(t => t.ID.ToString()).ToList(),
        };
    }

    public Project CreateProjectModel(string userId, List<Tag> tags)
    {
        var project = new Project
        {
            Name = Name,
            Description = Description,
            StartDate = StartDate,
            EndDate = EndDate,
            UserId = userId,
        };
        project.Tags.AddRange(tags);
        return project;
    }

    public void UpdateProjectModel(Project project, List<Tag> tags)
    {
        project.Name = Name;
        project.Description = Description;
        project.StartDate = StartDate;
        project.EndDate = EndDate;
        project.Tags.Clear();
        project.Tags.AddRange(tags);
    }
}
