import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function SpotlyMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Eğer div henüz DOM'da yoksa bekle
    if (!mapRef.current) return;

    // Harita daha önce başlatılmadıysa başlat
    if (!mapInstanceRef.current) {
      // İstanbul koordinatları ile başlat
      mapInstanceRef.current = L.map(mapRef.current).setView([41.0082, 28.9784], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current);
    }

    // Framer Motion exit animasyonunda haritayı güvenle temizle
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[400px] z-0 isolate"
      style={{ background: '#e5e5e5' }}
    />
  );
}
