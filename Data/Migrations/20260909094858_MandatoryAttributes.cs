using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CVManagement.Migrations
{
    /// <inheritdoc />
    public partial class MandatoryAttributes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsMandatory",
                table: "CVAttributes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsMandatory",
                table: "CVAttributes");
        }
    }
}
