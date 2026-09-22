using System.ComponentModel.DataAnnotations;

namespace CVManagement.Models.Validation;

public class PastDateAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is not DateTimeOffset date) return ValidationResult.Success;
        if (date > DateTimeOffset.Now)
            return new ValidationResult($"{validationContext.DisplayName} should be earlier than the current date.");
        return ValidationResult.Success;
    }
}
