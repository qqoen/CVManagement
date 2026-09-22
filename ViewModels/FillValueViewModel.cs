using CVManagement.Data;
using CVManagement.Models;

namespace CVManagement.ViewModels;

public class FillValueViewModel
{
    public int ValueID { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string CategoryName { get; set; } = string.Empty;

    public CVAttributeDataType DataType { get; set; }

    public string Value1 { get; set; } = string.Empty;

    public string Value2 { get; set; } = string.Empty;

    public bool BoolValue { get; set; }

    public static FillValueViewModel Create(CVAttribute attribute, CVAttributeValue? attributeValue)
    {
        var (value1, value2, boolVal) = ParseValues(attribute.DataType, attributeValue?.Value ?? string.Empty);
        return new FillValueViewModel()
        {
            ValueID = attributeValue?.ID ?? default,
            Name = attribute.Name,
            Description = attribute.Description,
            CategoryName = attribute.Category!.Name,
            DataType = attribute.DataType,
            Value1 = value1,
            Value2 = value2,
            BoolValue = boolVal,
        };
    }

    private static (string, string, bool) ParseValues(CVAttributeDataType dataType, string value)
    {
        if (value != string.Empty && dataType == CVAttributeDataType.Period)
        {
            var parts = value.Split(',');

            if (parts.Length > 1)
                return (parts[0], parts[1], false);
            else
                return (parts[0], string.Empty, false);
        }
        else if (dataType == CVAttributeDataType.Boolean)
        {
            var boolVal = value == string.Empty ? false : bool.Parse(value);
            return (string.Empty, string.Empty, boolVal);
        }
        else
        {
            return (value, string.Empty, false);
        }
    }

    public string SerializeValue()
    {
        if (DataType == CVAttributeDataType.Period)
            return Value1 + "," + Value2;
        if (DataType == CVAttributeDataType.Boolean)
            return BoolValue.ToString();
        return Value1;
    }

    public CVAttributeValue CreateValueModel(CVAttribute attribute, ApplicationUser user)
    {
        return new CVAttributeValue
        {
            CVAttribute = attribute,
            CVAttributeID = attribute.ID,
            User = user,
            UserId = user.Id,
            Value = SerializeValue(),
        };
    }
}
