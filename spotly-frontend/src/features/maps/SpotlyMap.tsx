import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, Tooltip, Popup, Polyline, useMapEvents } from 'react-leaflet'
import type { Marker as LMarker } from 'leaflet'
import L from 'leaflet'
import type { Place, Coords, PlaceInRoute, RouteOption } from '../../types'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/walking'

async function fetchOsrmPath(waypoints: [number, number][]): Promise<[number, number][]> {
  // waypoints = [[lat, lng], ...] → OSRM'e "lng,lat;lng,lat" formatında gönder
  const coordStr = waypoints.map((wp) => `${wp[1]},${wp[0]}`).join(';')
  const url = `${OSRM_BASE}/${coordStr}?overview=full&geometries=geojson`

  let res: Response
  try {
    res = await fetch(url)
  } catch (networkErr) {
    console.error('[OSRM] Ağ hatası (CORS veya bağlantı):', networkErr)
    throw networkErr
  }

  if (!res.ok) {
    console.error('[OSRM] HTTP hatası:', res.status, res.statusText, '— URL:', url)
    throw new Error(`OSRM HTTP ${res.status}`)
  }

  const json = await res.json()
  console.log('[OSRM] yanıt kodu:', json.code, '| koordinat sayısı:', json.routes?.[0]?.geometry?.coordinates?.length)

  if (json.code !== 'Ok' || !json.routes?.[0]?.geometry?.coordinates?.length) {
    console.error('[OSRM] Geçersiz yanıt:', json)
    throw new Error(`OSRM code: ${json.code}`)
  }

  // GeoJSON → [lng, lat] dizisi. Leaflet [lat, lng] ister: coord[1], coord[0]
  return json.routes[0].geometry.coordinates.map(
    (coord: number[]) => [coord[1], coord[0]] as [number, number]
  )
}

function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  const n = polygon.length
  let inside = false
  let j = n - 1
  for (let i = 0; i < n; i++) {
    const [lat_i, lng_i] = polygon[i]
    const [lat_j, lng_j] = polygon[j]
    if ((lng_i > lng) !== (lng_j > lng)) {
      const slope = (lat_j - lat_i) * (lng - lng_i) / (lng_j - lng_i) + lat_i
      if (lat < slope) inside = !inside
    }
    j = i
  }
  return inside
}

// @ts-expect-error — Vite bundle'ında Leaflet default marker fix
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const MAP_CENTER: [number, number] = [41.022, 28.974]
const MAP_ZOOM = 13

const WORLD_RING: [number, number][] = [[-90,-180],[-90,180],[90,180],[90,-180]]

// Spotly Operasyon Alanı — sabit, kullanıcı tarafından belirlenmiş kesin koordinatlar
// Backend ile %100 aynı polygon (features/places filtresi). Denize taşmadan çizilmiştir.
const SPOTLY_ZONE: [number, number][] = [
  // ── Batı Sınırı (Surlar — Yedikule'den Ayvansaray'a)
  [40.991, 28.920], [41.000, 28.922], [41.016, 28.925], [41.031, 28.936], [41.040, 28.943],
  // ── Kuzey Sınırı (İç kesimler — Kasımpaşa, Taksim, Yıldız)
  [41.033, 28.955], [41.038, 28.980], [41.045, 28.995], [41.053, 29.010],
  // ── Doğu Ucu (Ortaköy)
  [41.048, 29.027],
  // ── Boğaz Sahil Hattı (Beşiktaş, Kabataş, Karaköy — denize taşmadan)
  [41.042, 29.008], [41.035, 28.992], [41.026, 28.982], [41.022, 28.976],
  // ── Tarihi Yarımada Sahil Hattı (Eminönü, Sarayburnu, Kumkapı, Yedikule)
  [41.016, 28.976], [41.014, 28.985], [41.005, 28.978], [41.000, 28.958], [40.995, 28.940],
  [40.991, 28.920],
]
const MASK: [number, number][][] = [WORLD_RING, SPOTLY_ZONE]

// ── Pin Fabrikası ──────────────────────────────────────────────────────────
function makePin(bg: string, size = 18): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:2.5px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -(size / 2 + 6)],
  })
}

const PLACE_ICON = makePin('#ef4444', 16)  // red — normal mekan
const START_ICON = makePin('#10b981', 22)  // emerald — başlangıç
const END_ICON   = makePin('#3b82f6', 22)  // blue — bitiş

function makeWaypointPin(n: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;
      background:#6A8267;
      border:2.5px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 10px rgba(0,0,0,0.40);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:11px;font-weight:800;
    ">${n}</div>`,
    iconSize:    [26, 26],
    iconAnchor:  [13, 13],
    popupAnchor: [0, -19],
  })
}

// ── Harita tıklama yakalayıcı ──────────────────────────────────────────────
function MapClickHandler({ onMapClick, onOutOfZone, done }: {
  onMapClick: (c: Coords) => void
  onOutOfZone?: () => void
  done: boolean
}) {
  const map = useMapEvents({
    click: (e) => {
      if (done) return
      const { lat, lng } = e.latlng
      if (isPointInPolygon(lat, lng, SPOTLY_ZONE)) {
        onMapClick({ lat, lng })
      } else {
        onOutOfZone?.()
      }
    },
    mousemove: () => { map.getContainer().style.cursor = done ? '' : 'crosshair' },
  })
  return null
}

// ── Tek bir mekan marker'ı ─────────────────────────────────────────────────
interface PlaceMarkerProps {
  place:      Place
  isStart:    boolean
  isEnd:      boolean
  onSetStart: (p: Place) => void
  onSetEnd:   (p: Place) => void
}

function PlaceMarker({ place, isStart, isEnd, onSetStart, onSetEnd }: PlaceMarkerProps) {
  const markerRef = useRef<LMarker>(null)
  const icon = isStart ? START_ICON : isEnd ? END_ICON : PLACE_ICON

  function closePopup() { markerRef.current?.closePopup() }

  return (
    <Marker
      ref={markerRef}
      position={[place.latitude, place.longitude]}
      icon={icon}
    >
      {/* Hover tooltip */}
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
          {place.name}
        </span>
      </Tooltip>

      {/* Tıklama popup */}
      <Popup closeButton={false} minWidth={190} maxWidth={220}>
        <div style={{ padding: '6px 2px 2px' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#111827', lineHeight: 1.3 }}>
            {place.name}
          </p>

          {/* Skor satırı */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', background: '#ede9fe', borderRadius: 20, padding: '2px 8px' }}>
              📸 {place.photo_score}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#b45309', background: '#fef3c7', borderRadius: 20, padding: '2px 8px' }}>
              🏛 {place.tourist_score}
            </span>
          </div>

          {/* Aksiyon butonları */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => { onSetStart(place); closePopup() }}
              style={{
                flex: 1, border: 'none', borderRadius: 8, padding: '7px 4px',
                background: isStart ? '#059669' : '#10b981',
                color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              🚩 {isStart ? 'Başlangıç ✓' : 'Başlangıç'}
            </button>
            <button
              onClick={() => { onSetEnd(place); closePopup() }}
              style={{
                flex: 1, border: 'none', borderRadius: 8, padding: '7px 4px',
                background: isEnd ? '#dc2626' : '#ef4444',
                color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              🏁 {isEnd ? 'Bitiş ✓' : 'Bitiş'}
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// ── Ana bileşen ────────────────────────────────────────────────────────────
export interface SpotlyMapProps {
  routeType?:    'photo' | 'tourist' | null
  places?:       Place[]
  startCoords:   Coords | null
  endCoords:     Coords | null
  startPlaceId?: number | null
  endPlaceId?:   number | null
  activeRoute?:  RouteOption | null
  onMapClick:    (c: Coords) => void
  onOutOfZone?:  () => void
  onOsrmError?:  () => void
  onSetStart:    (p: Place) => void
  onSetEnd:      (p: Place) => void
}

export default function SpotlyMap({
  routeType: _rt,
  places = [],
  startCoords,
  endCoords,
  startPlaceId,
  endPlaceId,
  activeRoute,
  onMapClick,
  onOutOfZone,
  onOsrmError,
  onSetStart,
  onSetEnd,
}: SpotlyMapProps) {
  const selectionDone = !!(startCoords && endCoords)
  const [osrmPath, setOsrmPath] = useState<[number, number][] | null>(null)

  // onOsrmError'ı ref'te tut — dependency listesine girmesin, her render'da yeni
  // fonksiyon ref'i useEffect'i gereksiz tetikler ve fetch'i iptal eder
  const onOsrmErrorRef = useRef(onOsrmError)
  useEffect(() => { onOsrmErrorRef.current = onOsrmError })

  // OSRM gerçek yol ağı çekimi — yalnızca activeRoute değişince tetiklenir
  useEffect(() => {
    if (!activeRoute || activeRoute.waypoints.length < 2) {
      setOsrmPath(null)
      return
    }
    let cancelled = false
    setOsrmPath(null)
    fetchOsrmPath(activeRoute.waypoints)
      .then((path) => {
        if (!cancelled) setOsrmPath(path)
      })
      .catch((err) => {
        console.error('[OSRM] Rota alınamadı, çizgi gösterilmeyecek:', err)
        if (!cancelled) {
          setOsrmPath(null)
          onOsrmErrorRef.current?.()
        }
      })
    return () => { cancelled = true }
  }, [activeRoute])

  useEffect(() => {
    return () => {
      document.querySelectorAll('.leaflet-container').forEach((c) => {
        // @ts-expect-error — Leaflet iç alanı
        if (c._leaflet_id) delete c._leaflet_id
      })
    }
  }, [])

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      {/* Dramatik maske */}
      <Polygon
        positions={MASK}
        pathOptions={{ fillColor: '#000', fillOpacity: 0.70, weight: 0, stroke: false, interactive: false }}
      />

      {/* Harita tıklama */}
      <MapClickHandler onMapClick={onMapClick} onOutOfZone={onOutOfZone} done={selectionDone} />

      {/* Mekan pinleri */}
      {places.map((p) => (
        <PlaceMarker
          key={p.id}
          place={p}
          isStart={p.id === startPlaceId}
          isEnd={p.id === endPlaceId}
          onSetStart={onSetStart}
          onSetEnd={onSetEnd}
        />
      ))}

      {/* Serbest tıklama ile seçilen koordinatlar (place seçimi yoksa) */}
      {startCoords && !startPlaceId && (
        <Marker position={[startCoords.lat, startCoords.lng]} icon={START_ICON} />
      )}
      {endCoords && !endPlaceId && (
        <Marker position={[endCoords.lat, endCoords.lng]} icon={END_ICON} />
      )}

      {/* ── Aktif rota polyline + durak marker'ları ── */}
      {activeRoute && activeRoute.waypoints.length >= 2 && (
        <>
          {/* OSRM gerçek sokak geometrisi — fallback YOK, length>10 garantisi */}
          {osrmPath && osrmPath.length > 10 ? (
            <Polyline
              positions={osrmPath}
              smoothFactor={0}
              pathOptions={{ color: '#879F84', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
            />
          ) : null}
          {/* Durak noktaları */}
          {activeRoute.places.map((place: PlaceInRoute) => (
            <Marker
              key={`wp-${place.id}`}
              position={[place.latitude, place.longitude]}
              icon={makeWaypointPin(place.order)}
            >
              <Tooltip direction="top" offset={[0, -14]} opacity={1} permanent={false}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3d4c3b' }}>
                  {place.order}. {place.name}
                </span>
              </Tooltip>
            </Marker>
          ))}
        </>
      )}
    </MapContainer>
  )
}

export type { Coords }
