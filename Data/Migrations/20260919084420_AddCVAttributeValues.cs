using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CVManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddCVAttributeValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CVCVAttributeValue",
                columns: table => new
                {
                    CVAttributeValuesID = table.Column<int>(type: "integer", nullable: false),
                    CVsID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CVCVAttributeValue", x => new { x.CVAttributeValuesID, x.CVsID });
                    table.ForeignKey(
                        name: "FK_CVCVAttributeValue_CVAttributeValues_CVAttributeValuesID",
                        column: x => x.CVAttributeValuesID,
                        principalTable: "CVAttributeValues",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CVCVAttributeValue_CV_CVsID",
                        column: x => x.CVsID,
                        principalTable: "CV",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CVCVAttributeValue_CVsID",
                table: "CVCVAttributeValue",
                column: "CVsID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CVCVAttributeValue");
        }
    }
}
