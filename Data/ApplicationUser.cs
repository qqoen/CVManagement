using CVManagement.Models;
using Microsoft.AspNetCore.Identity;

namespace CVManagement.Data;

public class ApplicationUser : IdentityUser
{
    public ICollection<Project> Projects { get; } = new List<Project>();

    public ICollection<CV> CVs { get; } = new List<CV>();

    public ICollection<CVAttribute> CVAttributes { get; } = new List<CVAttribute>();

    public ICollection<CVAttributeValue> CVAttributeValues { get; } = new List<CVAttributeValue>();
}
