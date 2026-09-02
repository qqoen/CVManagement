using CVManagement.Data;
using System.ComponentModel.DataAnnotations;

namespace CVManagement.Models;

public class Project
{
    public int ID { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [DisplayFormat(DataFormatString = "{0:MMM-dd yyyy}")]
    public DateTimeOffset StartDate { get; set; }

    [DisplayFormat(DataFormatString = "{0:MMM-dd yyyy}")]
    public DateTimeOffset EndDate { get; set; }

    public string? UserId { get; set; }

    public ApplicationUser? User { get; set; }
}
