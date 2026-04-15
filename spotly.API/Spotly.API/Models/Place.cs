namespace Spotly.API.Models
{
    public class Place
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        
        public int TouristScore { get; set; }
        public int GourmetScore { get; set; }
        public int PhotoScore { get; set; }
        
        public string Category { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }
}