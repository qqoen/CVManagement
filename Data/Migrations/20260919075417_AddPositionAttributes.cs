using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CVManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddPositionAttributes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CVAttributePosition",
                columns: table => new
                {
                    CVAttributesID = table.Column<int>(type: "integer", nullable: false),
                    PositionsID = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CVAttributePosition", x => new { x.CVAttributesID, x.PositionsID });
                    table.ForeignKey(
                        name: "FK_CVAttributePosition_CVAttributes_CVAttributesID",
                        column: x => x.CVAttributesID,
                        principalTable: "CVAttributes",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CVAttributePosition_Positions_PositionsID",
                        column: x => x.PositionsID,
                        principalTable: "Positions",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CVAttributePosition_PositionsID",
                table: "CVAttributePosition",
                column: "PositionsID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CVAttributePosition");
        }
    }
}
