using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spotly.API.Data;
using Spotly.API.Models;

namespace Spotly.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlacesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PlacesController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Tüm mekanları listeleme (Test için)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Place>>> GetPlaces()
        {
            return await _context.Places.ToListAsync();
        }

        // 2. Akıllı Rota Algoritması
        [HttpPost("recommend")]
        public async Task<ActionResult<IEnumerable<Place>>> GetRecommendations([FromBody] RouteRequest request)
        {
            var allPlaces = await _context.Places.ToListAsync();

            // Algoritma: Her mekan için toplam skor hesapla
            var recommendedPlaces = allPlaces.Select(p => new
            {
                Place = p,
                // Ağırlıklı Ortalama Hesabı
                TotalScore = (p.PhotoScore * request.PhotoWeight) +
                             (p.GourmetScore * request.GourmetWeight) +
                             (p.TouristScore * request.TouristWeight)
            })
            .OrderByDescending(x => x.TotalScore) // En yüksek puanlıyı başa al
            .Take(5) // İlk 5 mekanı seç
            .Select(x => x.Place)
            .ToList();

            return Ok(recommendedPlaces);
        }
    }
}