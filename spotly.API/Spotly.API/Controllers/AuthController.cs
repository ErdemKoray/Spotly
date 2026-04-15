using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Spotly.API.Models;
using Spotly.API.Data;

namespace Spotly.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto request)
        {
            if (_context.Users.Any(u => u.Email == request.Email))
                return BadRequest(new { message = "Bu e-posta adresi zaten kullanılıyor." });

            var newUser = new User
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Age = request.Age,
                // Kafa karışıklığını önlemek için tam yolu yazıyoruz
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password) 
            };

            _context.Users.Add(newUser);
            _context.SaveChanges();

            return Ok(new { name = newUser.Name, message = "Kayıt başarılı!" });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto request)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);
            
            // Burada da tam yolu yazıyoruz
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { message = "E-posta veya şifre hatalı." });

            // user değişkeninin sonuna ünlem (!) koyarak uyarıyı susturuyoruz
            return Ok(new { name = user!.Name, message = "Giriş başarılı!" });
        }
    }

    public class RegisterDto 
    { 
        public string Name { get; set; } = string.Empty; 
        public string Email { get; set; } = string.Empty; 
        public string Phone { get; set; } = string.Empty; 
        public int Age { get; set; } 
        public string Password { get; set; } = string.Empty; 
    }
    
    public class LoginDto 
    { 
        public string Email { get; set; } = string.Empty; 
        public string Password { get; set; } = string.Empty; 
    }
}