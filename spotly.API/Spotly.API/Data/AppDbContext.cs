using Microsoft.EntityFrameworkCore;
using Spotly.API.Models; // User ve Place modellerinin olduğu yer

namespace Spotly.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Place> Places { get; set; }
        
        // KULLANICI TABLOSU EKLENDİ
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // ... Senin yazdığın o 16 mekan verisi burada kalmaya devam edecek ...
        }
    }
}