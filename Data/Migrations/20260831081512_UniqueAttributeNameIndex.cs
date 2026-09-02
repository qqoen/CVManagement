using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CVManagement.Migrations
{
    /// <inheritdoc />
    public partial class UniqueAttributeNameIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_CVAttributes_Name",
                table: "CVAttributes",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CVAttributes_Name",
                table: "CVAttributes");
        }
    }
}
