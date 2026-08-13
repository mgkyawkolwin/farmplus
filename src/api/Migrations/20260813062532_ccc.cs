using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FarmPlus.Api.Migrations
{
    /// <inheritdoc />
    public partial class ccc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsRequired",
                table: "Suppliers",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "IsRequired",
                table: "Dealers",
                newName: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "Suppliers",
                newName: "IsRequired");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "Dealers",
                newName: "IsRequired");
        }
    }
}
