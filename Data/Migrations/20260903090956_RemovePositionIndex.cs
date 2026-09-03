using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CVManagement.Migrations
{
    /// <inheritdoc />
    public partial class RemovePositionIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Positions_Title",
                table: "Positions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Positions_Title",
                table: "Positions",
                column: "Title",
                unique: true);
        }
    }
}
