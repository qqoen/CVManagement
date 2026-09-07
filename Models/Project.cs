using CVManagement.Data;
using CVManagement.Models.Validation;
using System.ComponentModel.DataAnnotations;

namespace CVManagement.Models;

public class Project
{
    public int ID { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Display(Name = "Start Date")]
    [DisplayFormat(DataFormatString = "{0:MMM-dd yyyy}")]
    [EarlierDate(nameof(EndDate))]
    public DateTimeOffset StartDate { get; set; }

    [Display(Name = "End Date")]
    [DisplayFormat(DataFormatString = "{0:MMM-dd yyyy}")]
    [PastDate]
    public DateTimeOffset EndDate { get; set; }

    public string? UserId { get; set; }

    public ApplicationUser? User { get; set; }
}
