using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace CVManagement.Models.Validation;

public class EarlierDateAttribute : ValidationAttribute
{
    private readonly string relativeProperty;

    public EarlierDateAttribute(string relativeProperty)
    {
        this.relativeProperty = relativeProperty;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is not DateTimeOffset date) return ValidationResult.Success;

        var relativeDateProperty = validationContext.ObjectInstance.GetType().GetProperty(relativeProperty);
        if (relativeDateProperty == null) return ValidationResult.Success;

        var relativeDateValue = relativeDateProperty.GetValue(validationContext.ObjectInstance);
        if (relativeDateValue is not DateTimeOffset relativeDate) return ValidationResult.Success;

        if (date > relativeDate)
            return new ValidationResult($"{validationContext.DisplayName} should be earlier than {GetRelativeDateName(relativeDateProperty)}.");

        return ValidationResult.Success;
    }

    private string GetRelativeDateName(PropertyInfo property)
    {
        var attr = property.GetCustomAttribute(typeof(DisplayAttribute));
        if (attr != null && attr is DisplayAttribute displayAttr)
            return displayAttr.Name ?? relativeProperty;
        else
            return relativeProperty;
    }
}
