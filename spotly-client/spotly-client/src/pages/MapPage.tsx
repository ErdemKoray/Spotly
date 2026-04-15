import { useEffect, useState } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BOUNDARY_POLYGON, SEA_POLYGON, THEME_COLORS, API_BASE_URL } from '../constants'; 

interface Place { id: number; name: string; category: string; latitude: number; longitude: number; }
interface Point { lat: number; lng: number; }

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia29yYXllcmRlbSIsImEiOiJjbW54bXoxYWYwM3czMnFzNG9zY2liZW94In0.5EtPPEnISVMArKhirCn_XA';

const isPointInPolygon = (point: number[], vs: number[][]) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [weights, setWeights] = useState({ photo: 5, gourmet: 5, tourist: 5 });
  const [loading, setLoading] = useState(false);

  const isReadyToSuggest = startPoint && endPoint;

  const handleRecommend = () => {
    if (!isReadyToSuggest) return;
    setLoading(true);
    
    // HATA BURADAYDI: 5000 yerine dinamik API_BASE_URL (5094) kullanıyoruz!
    fetch(`${API_BASE_URL}/places/recommend`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoWeight: weights.photo, gourmetWeight: weights.gourmet, touristWeight: weights.tourist, userLat: startPoint.lat, userLng: startPoint.lng })
    })
    .then(res => res.json())
    .then(data => { setPlaces(data); setLoading(false); })
    .catch(err => { console.error("Hata:", err); setLoading(false); });
  };

  const handleMapClick = (e: any) => {
    const { lng, lat } = e.lngLat;
    if (!isPointInPolygon([lng, lat], BOUNDARY_POLYGON) || isPointInPolygon([lng, lat], SEA_POLYGON)) { alert("Hata: Lütfen aydınlık kara alanını seçin!"); return; }
    if (!startPoint || (startPoint && endPoint)) { setStartPoint({ lng, lat }); setEndPoint(null); } else { setEndPoint({ lng, lat }); }
  };

  return (
    <>
      <aside style={{ width: '340px', backgroundColor: THEME_COLORS.white, borderRight: `1px solid ${THEME_COLORS.border}`, display: 'flex', flexDirection: 'column', zIndex: 50, flexShrink: 0 }}>
        <div style={{ flex: 1, padding: '25px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '20px', color: THEME_COLORS.textDark }}>Rota Planla</h2>
          <div style={{ padding: '12px', background: startPoint ? THEME_COLORS.sageLight : THEME_COLORS.sageBg, borderRadius: '8px', marginBottom: '10px', borderLeft: `4px solid ${startPoint ? THEME_COLORS.sageDark : THEME_COLORS.border}` }}>
            <small style={{ fontWeight: '700', color: THEME_COLORS.textMuted }}>BAŞLANGIÇ</small>
            <div style={{ fontSize: '13px' }}>{startPoint ? 'Konum Seçildi ✓' : 'Haritadan Seçin'}</div>
          </div>
          <div style={{ padding: '12px', background: endPoint ? THEME_COLORS.sageLight : THEME_COLORS.sageBg, borderRadius: '8px', marginBottom: '20px', borderLeft: `4px solid ${endPoint ? THEME_COLORS.sagePrimary : THEME_COLORS.border}` }}>
            <small style={{ fontWeight: '700', color: THEME_COLORS.textMuted }}>VARIŞ</small>
            <div style={{ fontSize: '13px' }}>{endPoint ? 'Konum Seçildi ✓' : 'Haritadan Seçin'}</div>
          </div>
          <button disabled={!isReadyToSuggest || loading} onClick={handleRecommend} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: isReadyToSuggest ? 'pointer' : 'not-allowed', backgroundColor: isReadyToSuggest ? THEME_COLORS.sagePrimary : '#CBD5E1', color: 'white', marginBottom: '10px', transition: '0.3s' }}>
            {loading ? 'Hesaplanıyor...' : 'Rota Öner'}
          </button>
          <button onClick={() => {setStartPoint(null); setEndPoint(null);}} style={{ width: '100%', padding: '10px', background: 'transparent', color: THEME_COLORS.coralSoft, border: `1px solid ${THEME_COLORS.coralSoft}`, borderRadius: '10px', cursor: 'pointer', marginBottom: '30px' }}>Temizle</button>
          
          <div style={{ borderTop: `1px solid ${THEME_COLORS.border}`, paddingTop: '20px' }}>
            <h3 style={{ fontSize: '14px', color: THEME_COLORS.textDark, marginBottom: '15px' }}>Algoritma Ağırlıkları</h3>
            {['photo', 'gourmet', 'tourist'].map(key => (
              <div key={key} style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                  <span>{key === 'photo' ? '📸 Manzara' : key === 'gourmet' ? '🤤 Gurme' : '🏛️ Tarih'}</span>
                  <span>{weights[key as keyof typeof weights]}</span>
                </div>
                <input type="range" min="0" max="10" value={weights[key as keyof typeof weights]} onChange={e => setWeights({...weights, [key]: parseInt(e.target.value)})} style={{ width: '100%', accentColor: THEME_COLORS.sagePrimary }} />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '25px', position: 'relative' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', border: `6px solid ${THEME_COLORS.white}`, boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
          <Map initialViewState={{ longitude: 28.97, latitude: 41.02, zoom: 13.5 }} mapStyle="mapbox://styles/mapbox/streets-v12" mapboxAccessToken={MAPBOX_TOKEN} onClick={handleMapClick} style={{ width: '100%', height: '100%' }}>
            <Source id="mask" type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]], BOUNDARY_POLYGON] } }}><Layer type="fill" paint={{ 'fill-color': 'rgba(45, 60, 50, 0.5)' }} /></Source>
            <Source id="sea" type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [SEA_POLYGON] } }}><Layer type="fill" paint={{ 'fill-color': 'rgba(45, 60, 50, 0.5)' }} /></Source>
            {startPoint && <Marker longitude={startPoint.lng} latitude={startPoint.lat} color={THEME_COLORS.sageDark} />}
            {endPoint && <Marker longitude={endPoint.lng} latitude={endPoint.lat} color={THEME_COLORS.sagePrimary} />}
            {places.map(p => <Marker key={p.id} longitude={p.longitude} latitude={p.latitude} color={THEME_COLORS.coralSoft} onClick={e => {e.originalEvent.stopPropagation(); setSelectedPlace(p);}} />)}
            {selectedPlace && (
              <Popup longitude={selectedPlace.longitude} latitude={selectedPlace.latitude} anchor="bottom" onClose={() => setSelectedPlace(null)}>
                <div style={{ textAlign: 'center' }}><strong>{selectedPlace.name}</strong><br/><small>{selectedPlace.category}</small></div>
              </Popup>
            )}
          </Map>
        </div>
      </main>
    </>
  );
}