using Microsoft.EntityFrameworkCore;
using Spotly.API.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// ... (üstteki kodlar)

app.UseHttpsRedirection();
app.UseRouting(); // Eğer bu satır yoksa ekleyebilirsin

// 1. ÖNCE CORS İZNİ GELECEK
app.UseCors("AllowReactApp"); 

// 2. SONRA YETKİLENDİRME GELECEK
app.UseAuthorization();

// 3. EN SON CONTROLLER EŞLEŞTİRMESİ GELECEK
app.MapControllers();

app.Run();