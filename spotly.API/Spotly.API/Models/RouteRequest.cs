namespace Spotly.API.Models
{
    public class RouteRequest
    {
        // Kullanıcının 0-10 arası verdiği ağırlıklar
        public int PhotoWeight { get; set; }
        public int GourmetWeight { get; set; }
        public int TouristWeight { get; set; }
        
        // Opsiyonel: Kullanıcının o anki konumu (Mesafe hesabı için)
        public double UserLat { get; set; }
        public double UserLng { get; set; }
    }
}