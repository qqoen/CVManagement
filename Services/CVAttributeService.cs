using CVManagement.Data;
using CVManagement.Models;
using CVManagement.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NuGet.Packaging;
using System.Security.Claims;

namespace CVManagement.Services;

public class CVAttributeService
{
    private readonly ApplicationDbContext context;

    private readonly UserManager<ApplicationUser> userManager;

    public CVAttributeService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        this.context = context;
        this.userManager = userManager;
    }

    public async Task<List<CVAttribute>> GetList(string searchString)
    {
        var query = context.CVAttributes.Select(a => a);
        if (!string.IsNullOrWhiteSpace(searchString))
            query = query.Where(a => a.Name.ToLower().Contains(searchString.ToLower()));
        query = query.OrderBy(a => a.Name).Include(a => a.Category);
        return await query.ToListAsync();
    }

    public async Task<List<CVAttribute>> GetOptional()
    {
        var attributes = await context.CVAttributes
            .Where(a => !a.IsMandatory)
            .ToListAsync();
        return attributes;
    }

    public async Task<CVAttribute?> Get(int id)
    {
        var attribute = await context.CVAttributes.FindAsync(id);
        return attribute;
    }

    public async Task Create(CVAttribute attribute)
    {
        attribute.Format();
        context.Add(attribute);
        await context.SaveChangesAsync();
    }

    public async Task Update(CVAttribute attribute)
    {
        attribute.Format();
        context.Update(attribute);
        await context.SaveChangesAsync();
    }

    public async Task Delete(List<int> selectedIds)
    {
        var attributes = context.CVAttributes.Where(a => !a.IsMandatory && selectedIds.Contains(a.ID));
        context.RemoveRange(attributes);
        await context.SaveChangesAsync();
    }

    public async Task AddAttributeToUser(ClaimsPrincipal principal, List<int> selectedIds)
    {
        var userId = userManager.GetUserId(principal);
        var user = await context.Users
            .Include(u => u.CVAttributes)
            .FirstOrDefaultAsync(u => u.Id == userId);
        var userAttributeIds = user!.CVAttributes.Select(a => a.ID).ToList();
        var attributes = context.CVAttributes
            .Where(a => !a.IsMandatory && selectedIds.Contains(a.ID) && !userAttributeIds.Contains(a.ID));
        user.CVAttributes.AddRange(attributes);
        context.Update(user);
        await context.SaveChangesAsync();
    }

    public async Task<(CVAttribute?, CVAttributeValue?)> GetAttributeValue(ClaimsPrincipal principal, int attributeId)
    {
        var attribute = await context.CVAttributes
            .Include(a => a.Category)
            .FirstOrDefaultAsync(a => a.ID == attributeId);
        if (attribute == null) return (null, null);
        var userId = userManager.GetUserId(principal);
        var value = await context.CVAttributeValues
            .FirstOrDefaultAsync(v => v.CVAttributeID == attributeId && v.UserId == userId);
        return (attribute, value);
    }

    public async Task<bool> FillAttributeValue(ClaimsPrincipal principal, int attributeId, FillValueViewModel vm)
    {
        var attribute = await context.CVAttributes.FindAsync(attributeId);
        if (attribute == null) return false;
        var attributeValue = await context.CVAttributeValues.FindAsync(vm.ValueID);
        if (attributeValue != null)
            await UpdateAttributeValue(attributeValue, vm);
        else
            await CreateAttributeValue(principal, attribute, vm);
        return true;
    }

    public async Task UpdateAttributeValue(CVAttributeValue attributeValue, FillValueViewModel vm)
    {
        attributeValue.Value = vm.SerializeValue();
        context.Update(attributeValue);
        await context.SaveChangesAsync();
    }

    public async Task CreateAttributeValue(ClaimsPrincipal principal, CVAttribute attribute, FillValueViewModel vm)
    {
        var user = (await userManager.GetUserAsync(principal))!;
        var attributeValue = vm.CreateValueModel(attribute, user);
        context.Add(attributeValue);
        await context.SaveChangesAsync();
    }

    public async Task<List<Category>> GetCategories()
    {
        return await context.Categories.ToListAsync();
    }
}
