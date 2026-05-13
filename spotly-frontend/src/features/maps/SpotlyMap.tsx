import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Polygon, Marker, Tooltip, Popup, Polyline, useMapEvents } from 'react-leaflet'
import type { Marker as LMarker } from 'leaflet'
import L from 'leaflet'
import type { Place, Coords, PlaceInRoute, RouteOption } from '../../types'
import { DISTRICTS } from '../../assets/districts.geojson'

// Mapbox Directions API — yaya (walking) profili, gerçek pedestrian graf'ı
const MAPBOX_WALKING = 'https://api.mapbox.com/directions/v5/mapbox/walking'
const MAPBOX_TOKEN   = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface DirResult {
  path: [number, number][]
  distanceKm: number
}

function toCoordStr(waypoints: [number, number][]): string {
  // [lat,lng] → Mapbox "lng,lat;lng,lat" formatı
  return waypoints.map((wp) => `${wp[1]},${wp[0]}`).join(';')
}

function parseGeoJsonCoords(coords: number[][]): [number, number][] {
  // GeoJSON [lng, lat] → Leaflet [lat, lng]
  return coords.map((c) => [c[1], c[0]] as [number, number])
}

function buildMapboxUrl(waypoints: [number, number][]): string {
  if (!MAPBOX_TOKEN) {
    throw new Error('VITE_MAPBOX_TOKEN tanımlı değil — .env dosyasını kontrol et')
  }
  const params = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
    access_token: MAPBOX_TOKEN,
  })
  return `${MAPBOX_WALKING}/${toCoordStr(waypoints)}?${params}`
}

async function fetchMapboxWalking(
  waypoints: [number, number][],
  signal?: AbortSignal,
): Promise<DirResult> {
  const url = buildMapboxUrl(waypoints)
  // Token'ı log'a yazma — yalnızca path
  console.log('[Mapbox walking] →', url.replace(/access_token=[^&]+/, 'access_token=***'))

  const res = await fetch(url, { signal })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Mapbox HTTP ${res.status} — ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  if (json.code !== 'Ok' || !json.routes?.[0]?.geometry?.coordinates?.length) {
    throw new Error(`Mapbox code: ${json.code} — ${json.message ?? ''}`)
  }
  const path = parseGeoJsonCoords(json.routes[0].geometry.coordinates)
  const distanceKm = (json.routes[0].distance ?? 0) / 1000
  console.log(`[Mapbox walking] ✓ ${path.length} nokta | ${distanceKm.toFixed(3)} km`)
  return { path, distanceKm }
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

// ── Odak ilçesi: Fatih ──
// GeoJSON [lng, lat] → Leaflet [lat, lng]. Sadece Fatih feature'ı kullanılır.
function extractFatihRing(): [number, number][] {
  const fatih = DISTRICTS.features.find((f) => f.properties?.name === 'Fatih')
  if (!fatih) return []
  const g = fatih.geometry
  if (g.type === 'Polygon') return g.coordinates[0].map((c) => [c[1], c[0]] as [number, number])
  if (g.type === 'MultiPolygon') return g.coordinates[0][0].map((c) => [c[1], c[0]] as [number, number])
  return []
}
const FATIH_RING: [number, number][] = extractFatihRing()

// Dünya dış halkası — donut polygon için (Leaflet'in dış ring'i)
const WORLD_RING: [number, number][] = [[-90, -180], [-90, 180], [90, 180], [90, -180]]

// Click validasyonu için tek bölge: Fatih
const ZONES: [number, number][][] = [FATIH_RING]

// Maske donut'u: dış ring = dünya, delik = Fatih
const FOCUS_MASK: [number, number][][] = [WORLD_RING, FATIH_RING]

// Fatih sınırını sadece outer ring olarak ayrı bir FeatureCollection halinde çiziyoruz
// (GeoJSON içindeki tüm feature'lar yerine sadece Fatih — Beyoğlu görsel olarak gizli)
const FATIH_BOUNDARY = {
  type: 'FeatureCollection' as const,
  features: DISTRICTS.features.filter((f) => f.properties?.name === 'Fatih'),
}

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

const PLACE_ICON = makePin('#ef4444', 16)
const START_ICON = makePin('#10b981', 22)
const END_ICON   = makePin('#3b82f6', 22)

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

function MapClickHandler({ onMapClick, onOutOfZone, done }: {
  onMapClick: (c: Coords) => void
  onOutOfZone?: () => void
  done: boolean
}) {
  const map = useMapEvents({
    click: (e) => {
      if (done) return
      const { lat, lng } = e.latlng
      // İki bölgeden herhangi birinin içinde mi? (Tarihi Yarımada VEYA Beyoğlu/Beşiktaş)
      const inAnyZone = ZONES.some((zone) => isPointInPolygon(lat, lng, zone))
      if (inAnyZone) {
        onMapClick({ lat, lng })
      } else {
        onOutOfZone?.()
      }
    },
    mousemove: () => { map.getContainer().style.cursor = done ? '' : 'crosshair' },
  })
  return null
}

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
    <Marker ref={markerRef} position={[place.latitude, place.longitude]} icon={icon}>
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
          {place.name}
        </span>
      </Tooltip>
      <Popup closeButton={false} minWidth={190} maxWidth={220}>
        <div style={{ padding: '6px 2px 2px' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#111827', lineHeight: 1.3 }}>
            {place.name}
          </p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', background: '#ede9fe', borderRadius: 20, padding: '2px 8px' }}>
              📸 {place.photo_score}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#b45309', background: '#fef3c7', borderRadius: 20, padding: '2px 8px' }}>
              🏛 {place.tourist_score}
            </span>
          </div>
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

export interface SpotlyMapProps {
  routeType?:        'photo' | 'tourist' | null
  places?:           Place[]
  startCoords:       Coords | null
  endCoords:         Coords | null
  startPlaceId?:     number | null
  endPlaceId?:       number | null
  activeRoute?:      RouteOption | null
  onMapClick:        (c: Coords) => void
  onOutOfZone?:      () => void
  onOsrmError?:      () => void
  onBaselineDist?:   (km: number) => void
  onSetStart:        (p: Place) => void
  onSetEnd:          (p: Place) => void
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
  onBaselineDist,
  onSetStart,
  onSetEnd,
}: SpotlyMapProps) {
  const selectionDone = !!(startCoords && endCoords)
  const [experiencePath, setExperiencePath] = useState<[number, number][] | null>(null)
  const [baselinePath, setBaselinePath] = useState<[number, number][] | null>(null)

  // ── Fatih sınırı içindeki mekanları filtrele (Point-in-Polygon) ──
  // Backend SPOTLY_ZONE'u daha geniş kapsam içerebilir; frontend'de gerçek Fatih GeoJSON
  // sınırına göre keskin filtre uygulayarak sadece çalışma alanı içindeki POI'leri tutuyoruz.
  // useMemo: places reference değişmedikçe filtre tekrar çalıştırılmaz.
  const placesInZone = useMemo(
    () => places.filter((p) => isPointInPolygon(p.latitude, p.longitude, FATIH_RING)),
    [places],
  )

  // ── Filtrelenmiş POI marker'larını useMemo ile cache'le ──
  // Marker JSX dizisi yalnızca filtrelenmiş liste veya seçim değiştiğinde yeniden üretilir.
  // Map zoom/pan veya başka state değişikliği marker render'ını tetiklemez.
  const placeMarkers = useMemo(
    () => placesInZone.map((p) => (
      <PlaceMarker
        key={p.id}
        place={p}
        isStart={p.id === startPlaceId}
        isEnd={p.id === endPlaceId}
        onSetStart={onSetStart}
        onSetEnd={onSetEnd}
      />
    )),
    [placesInZone, startPlaceId, endPlaceId, onSetStart, onSetEnd],
  )

  const onOsrmErrorRef = useRef(onOsrmError)
  const onBaselineDistRef = useRef(onBaselineDist)
  useEffect(() => { onOsrmErrorRef.current = onOsrmError })
  useEffect(() => { onBaselineDistRef.current = onBaselineDist })

  // ── KOTA KORUMASI ──
  // Son tamamlanan istek imzalarını sakla; aynı koordinatlar için tekrar fetch atma.
  // Bu sayede prop reference'ı değişse bile aynı veri için Mapbox'a tekrar gidilmez.
  const lastBaselineKeyRef = useRef<string | null>(null)
  const lastExperienceKeyRef = useRef<string | null>(null)

  // ── Baseline (kırmızı) — start+end seçilir seçilmez en kısa yaya rotası ──
  // SADECE primitif dependency'ler kullanılır → useEffect referans değişimiyle tetiklenmez
  const sLat = startCoords?.lat, sLng = startCoords?.lng
  const eLat = endCoords?.lat,   eLng = endCoords?.lng
  useEffect(() => {
    if (sLat == null || sLng == null || eLat == null || eLng == null) {
      setBaselinePath(null)
      lastBaselineKeyRef.current = null
      return
    }
    // Yüksek hassasiyetli koordinat imzası (6 ondalık ≈ 11cm)
    const key = `${sLat.toFixed(6)},${sLng.toFixed(6)}→${eLat.toFixed(6)},${eLng.toFixed(6)}`
    if (key === lastBaselineKeyRef.current && baselinePath) {
      // Aynı koordinatlar için tekrar API'ye gitme
      return
    }
    const ac = new AbortController()
    setBaselinePath(null)
    fetchMapboxWalking([[sLat, sLng], [eLat, eLng]], ac.signal)
      .then(({ path, distanceKm }) => {
        lastBaselineKeyRef.current = key
        setBaselinePath(path)
        onBaselineDistRef.current?.(distanceKm)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        console.error('[Mapbox baseline] Rota alınamadı:', err)
        setBaselinePath(null)
      })
    return () => { ac.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sLat, sLng, eLat, eLng])

  // ── Experience (yeşil) — aktif rota durakları üzerinden yaya rotası ──
  // activeRoute'un waypoints içeriğini stringe çevirip stabil bir dep olarak kullan.
  // (Aksi halde her render'da yeni activeRoute reference geldiğinde gereksiz fetch atılır.)
  const wpKey = activeRoute && activeRoute.waypoints.length >= 2
    ? activeRoute.waypoints.map(([la, lo]) => `${la.toFixed(6)},${lo.toFixed(6)}`).join('|')
    : null
  useEffect(() => {
    if (!wpKey || !activeRoute) {
      setExperiencePath(null)
      lastExperienceKeyRef.current = null
      return
    }
    if (wpKey === lastExperienceKeyRef.current && experiencePath) {
      return
    }
    const ac = new AbortController()
    setExperiencePath(null)
    fetchMapboxWalking(activeRoute.waypoints, ac.signal)
      .then(({ path }) => {
        lastExperienceKeyRef.current = wpKey
        console.log('Ekrana Çizilen Yol Noktası Sayısı:', path.length)
        setExperiencePath(path)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        console.error('[Mapbox experience] Rota alınamadı:', err)
        setExperiencePath(null)
        onOsrmErrorRef.current?.()
      })
    return () => { ac.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wpKey])

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
        url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        tileSize={512}
        zoomOffset={-1}
        maxZoom={20}
      />

      {/* ── Odaklanma Maskesi (Focus Mask) ──
          Donut polygon: dış halka = dünya, delik = Fatih ilçesi.
          Fatih içerisi pırıl pırıl Mapbox; dışarısı açık beyaz tülün arkasında puslu. */}
      <Polygon
        positions={FOCUS_MASK}
        pathOptions={{
          fillColor: 'white',
          fillOpacity: 0.5,
          stroke: false,
          weight: 0,
          interactive: false,
        }}
      />

      {/* ── Fatih sınır çizgisi (oyulmuş iç sınır, sage kesik çizgi) ── */}
      <GeoJSON
        key="fatih-boundary"
        data={FATIH_BOUNDARY}
        style={{
          fill: false,
          fillOpacity: 0,
          color: '#879F84',
          weight: 4,
          opacity: 0.95,
          dashArray: '10, 10',
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        }}
      />

      <MapClickHandler onMapClick={onMapClick} onOutOfZone={onOutOfZone} done={selectionDone} />

      {/* ── Tüm POI marker'ları (useMemo cache'li) ──
          Fatih'in zenginliği: kapsama uyan tüm mekanlar limit YOK çizilir.
          useMemo sayesinde props değişmedikçe JSX dizisi yeniden üretilmez. */}
      {placeMarkers}

      {startCoords && !startPlaceId && (
        <Marker position={[startCoords.lat, startCoords.lng]} icon={START_ICON} />
      )}
      {endCoords && !endPlaceId && (
        <Marker position={[endCoords.lat, endCoords.lng]} icon={END_ICON} />
      )}

      {/* ── Baseline (kırmızı kesik çizgi) — her zaman alt katmanda referans ── */}
      {baselinePath && baselinePath.length > 1 && (
        <Polyline
          positions={baselinePath}
          smoothFactor={0}
          pathOptions={{
            color: '#EF4444',
            weight: 3,
            opacity: 0.85,
            dashArray: '8,8',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {/* ── Experience (sage) — kullanıcının seçtiği rotanın gerçek sokak geometrisi ── */}
      {activeRoute && activeRoute.waypoints.length >= 2 && experiencePath && experiencePath.length > 10 && (
        <Polyline
          positions={experiencePath}
          smoothFactor={0}
          pathOptions={{ color: '#879F84', weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
        />
      )}

      {/* Durak noktaları (numaralı pinler) */}
      {activeRoute && activeRoute.waypoints.length >= 2 && activeRoute.places.map((place: PlaceInRoute) => (
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
    </MapContainer>
  )
}

export type { Coords }
