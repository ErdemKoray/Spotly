using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Spotly.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUsersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Places",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    Age = table.Column<int>(type: "integer", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.InsertData(
                table: "Places",
                columns: new[] { "Id", "Category", "Description", "GourmetScore", "ImageUrl", "Latitude", "Longitude", "Name", "PhotoScore", "TouristScore" },
                values: new object[,]
                {
                    { 1, "Tarihi/Manzara", "Şehrin simgesi, 360 derece manzara.", 30, "galata.jpg", 41.025599999999997, 28.9741, "Galata Kulesi", 100, 100 },
                    { 2, "Mimari/Fotoğraf", "Art Nouveau tarzı kıvrımlı tarihi merdivenler.", 0, "kamondo.jpg", 41.023800000000001, 28.9739, "Kamondo Merdivenleri", 95, 60 },
                    { 3, "Kafe/Gurme", "Galata Meydanı'nda şık ve lezzetli tatlılar.", 80, "sirinfirin.jpg", 41.024999999999999, 28.974499999999999, "Şirin Fırın", 75, 50 },
                    { 4, "Gurme", "İstanbul'un en meşhur baklavacısı.", 100, "gulluoglu.jpg", 41.0227, 28.977399999999999, "Karaköy Güllüoğlu", 40, 85 },
                    { 5, "Kafe/Fotoğraf", "Asma yaprakları altında salaş ve estetik kahveci.", 75, "karabatak.jpg", 41.023400000000002, 28.9785, "Karabatak Kafe", 90, 50 },
                    { 6, "Mimari/Fotoğraf", "Tarihi dokusu bozulmamış şık bir sokak.", 40, "fransizgecidi.jpg", 41.023000000000003, 28.977, "Fransız Geçidi", 85, 60 },
                    { 7, "Modern/Manzara", "Modern mimari, boğaz manzarası ve lüks restoranlar.", 80, "galataport.jpg", 41.024999999999999, 28.981000000000002, "Galataport Sahil", 85, 90 },
                    { 8, "Tarihi/Alışveriş", "Baharat kokulu, renkli, otantik bir pazar.", 70, "misircarsisi.jpg", 41.016500000000001, 28.970500000000001, "Mısır Çarşısı", 90, 95 },
                    { 9, "Gurme/Sokak Lezzeti", "Sallanan teknelerde geleneksel balık ekmek.", 85, "balikekmek.jpg", 41.018000000000001, 28.972000000000001, "Eminönü Tarihi Balıkçısı", 75, 80 },
                    { 10, "Tarihi/Dini", "Eminönü silüetinin ayrılmaz, görkemli parçası.", 0, "yenicami.jpg", 41.016800000000003, 28.971499999999999, "Yeni Cami", 85, 90 },
                    { 11, "Gurme", "Lokum ve şerbetli tatlılarda tarihi bir marka.", 95, "hafizmustafa.jpg", 41.014499999999998, 28.975000000000001, "Hafız Mustafa 1864", 60, 85 },
                    { 12, "Kültür/Mimari", "Eski Osmanlı Bankası, muazzam mimari ve kütüphane.", 20, "saltgalata.jpg", 41.023200000000003, 28.9739, "Salt Galata", 95, 70 },
                    { 13, "Üst Düzey Gurme", "Michelin yıldızlı, modern Türk mutfağı ve muazzam manzara.", 100, "neolokal.jpg", 41.023499999999999, 28.973299999999998, "Neolokal", 85, 60 },
                    { 14, "Tarihi/Sanat", "Eminönü kalabalığından gizlenmiş, İznik çinileriyle meşhur şaheser.", 0, "rustempasa.jpg", 41.017800000000001, 28.968800000000002, "Rüstem Paşa Camii", 95, 75 },
                    { 15, "Tarihi/Mimari", "Orient Express'in son durağı, tarihi ve nostaljik atmosfer.", 10, "sirkecigari.jpg", 41.015300000000003, 28.9772, "Sirkeci Garı", 80, 85 },
                    { 16, "Gurme/Esnaf", "Döner, pide ve esnaf lokantalarının tarihi sokağı.", 95, "hocapasa.jpg", 41.013500000000001, 28.977499999999999, "Tarihi Hocapaşa Lokantaları", 50, 60 }
                });
        }
    }
}
