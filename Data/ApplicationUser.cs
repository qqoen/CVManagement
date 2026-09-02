using CVManagement.Models;
using Microsoft.AspNetCore.Identity;

namespace CVManagement.Data;

public class ApplicationUser : IdentityUser
{
    public ICollection<Project> Projects { get; set; } = new List<Project>();

    public ICollection<CV> CVs { get; set; } = new List<CV>();
}
