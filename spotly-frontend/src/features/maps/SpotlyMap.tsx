import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import type { Place, Coords, PlaceInRoute, RouteOption } from '../../types'
import { DISTRICTS } from '../../assets/districts.geojson'

// ── Mapbox Directions API ──────────────────────────────────────────────────
const MAPBOX_WALKING = 'https://api.mapbox.com/directions/v5/mapbox/walking'
const MAPBOX_TOKEN   = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface DirResult { path: [number, number][]; distanceKm: number }

function toCoordStr(wps: [number, number][]) {
  return wps.map(wp => `${wp[1]},${wp[0]}`).join(';')
}
function parseGeoJsonCoords(coords: number[][]): [number, number][] {
  return coords.map(c => [c[1], c[0]] as [number, number])
}
async function fetchMapboxWalking(wps: [number, number][], signal?: AbortSignal): Promise<DirResult> {
  if (!MAPBOX_TOKEN) throw new Error('VITE_MAPBOX_TOKEN tanımlı değil')
  const params = new URLSearchParams({ geometries: 'geojson', overview: 'full', access_token: MAPBOX_TOKEN })
  const url = `${MAPBOX_WALKING}/${toCoordStr(wps)}?${params}`
  console.log('[Mapbox] →', url.replace(/access_token=[^&]+/, 'access_token=***'))
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Mapbox HTTP ${res.status}`)
  const json = await res.json()
  if (json.code !== 'Ok' || !json.routes?.[0]?.geometry?.coordinates?.length)
    throw new Error(`Mapbox: ${json.code}`)
  return {
    path: parseGeoJsonCoords(json.routes[0].geometry.coordinates),
    distanceKm: (json.routes[0].distance ?? 0) / 1000,
  }
}

// ── Geometry helpers ───────────────────────────────────────────────────────
function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false, j = polygon.length - 1
  for (let i = 0; i < polygon.length; i++) {
    const [lati, lngi] = polygon[i], [latj, lngj] = polygon[j]
    if ((lngi > lng) !== (lngj > lng)) {
      if (lat < (latj - lati) * (lng - lngi) / (lngj - lngi) + lati) inside = !inside
    }
    j = i
  }
  return inside
}

// ── Leaflet default icon fix (Vite bundle) ────────────────────────────────
// @ts-expect-error
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Constants ─────────────────────────────────────────────────────────────
const MAP_CENTER: [number, number] = [41.022, 28.974]
const MAP_ZOOM = 13

function extractFatihRing(): [number, number][] {
  const fatih = DISTRICTS.features.find((f) => f.properties?.name === 'Fatih')
  if (!fatih) return []
  const g = fatih.geometry
  if (g.type === 'Polygon')      return g.coordinates[0].map(c => [c[1], c[0]] as [number, number])
  if (g.type === 'MultiPolygon') return g.coordinates[0][0].map(c => [c[1], c[0]] as [number, number])
  return []
}
const FATIH_RING: [number, number][] = extractFatihRing()
const WORLD_RING: [number, number][] = [[-90, -180], [-90, 180], [90, 180], [90, -180]]
const ZONES: [number, number][][] = [FATIH_RING]

const FATIH_BOUNDARY = {
  type: 'FeatureCollection' as const,
  features: DISTRICTS.features.filter((f) => f.properties?.name === 'Fatih'),
}

// ── Icons ──────────────────────────────────────────────────────────────────
function makePin(bg: string, size = 18): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  })
}
const PLACE_ICON = makePin('#ef4444', 16)
const START_ICON = makePin('#10b981', 22)
const END_ICON   = makePin('#3b82f6', 22)

function makeWaypointPin(n: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;background:#6A8267;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.40);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800">${n}</div>`,
    iconSize:    [26, 26],
    iconAnchor:  [13, 13],
    popupAnchor: [0, -19],
  })
}

// ── Props ──────────────────────────────────────────────────────────────────
export interface SpotlyMapProps {
  routeType?:      'photo' | 'tourist' | null
  places?:         Place[]
  startCoords:     Coords | null
  endCoords:       Coords | null
  startPlaceId?:   number | null
  endPlaceId?:     number | null
  activeRoute?:    RouteOption | null
  onMapClick:      (c: Coords) => void
  onOutOfZone?:    () => void
  onOsrmError?:    () => void
  onBaselineDist?: (km: number) => void
  onSetStart:      (p: Place) => void
  onSetEnd:        (p: Place) => void
}

export default function SpotlyMap({
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
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)

  // Layer refs
  const placeMarkersRef    = useRef<L.Marker[]>([])
  const freeStartRef       = useRef<L.Marker | null>(null)
  const freeEndRef         = useRef<L.Marker | null>(null)
  const baselinePolyRef    = useRef<L.Polyline | null>(null)
  const experiencePolyRef  = useRef<L.Polyline | null>(null)
  const waypointMarkersRef = useRef<L.Marker[]>([])

  // Stable callback refs — prevent stale closures in effects
  const onMapClickRef     = useRef(onMapClick)
  const onOutOfZoneRef    = useRef(onOutOfZone)
  const onOsrmErrorRef    = useRef(onOsrmError)
  const onBaselineDistRef = useRef(onBaselineDist)
  const onSetStartRef     = useRef(onSetStart)
  const onSetEndRef       = useRef(onSetEnd)
  useEffect(() => { onMapClickRef.current     = onMapClick })
  useEffect(() => { onOutOfZoneRef.current    = onOutOfZone })
  useEffect(() => { onOsrmErrorRef.current    = onOsrmError })
  useEffect(() => { onBaselineDistRef.current = onBaselineDist })
  useEffect(() => { onSetStartRef.current     = onSetStart })
  useEffect(() => { onSetEndRef.current       = onSetEnd })

  // Quota protection: skip re-fetch for identical coords
  const lastBaselineKey   = useRef<string | null>(null)
  const lastExperienceKey = useRef<string | null>(null)

  const selectionDone = !!(startCoords && endCoords)
  const placesInZone  = useMemo(
    () => places.filter(p => isPointInPolygon(p.latitude, p.longitude, FATIH_RING)),
    [places],
  )

  // ── EFFECT 1: Map init & teardown ─────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = L.map(container, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      scrollWheelZoom: true,
      zoomControl: true,
    })

    L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      { attribution: '&copy; Mapbox &copy; OpenStreetMap', tileSize: 512, zoomOffset: -1, maxZoom: 20 },
    ).addTo(map)

    // Focus mask (donut polygon)
    L.polygon([WORLD_RING, FATIH_RING] as L.LatLngExpression[][], {
      fillColor: 'white', fillOpacity: 0.5, stroke: false, weight: 0, interactive: false,
    }).addTo(map)

    // Fatih boundary dashed line
    L.geoJSON(FATIH_BOUNDARY as GeoJSON.FeatureCollection, {
      style: {
        fill: false, fillOpacity: 0,
        color: '#879F84', weight: 4, opacity: 0.95,
        dashArray: '10, 10', lineCap: 'round', lineJoin: 'round',
        interactive: false,
      } as L.PathOptions,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── EFFECT 2: Click handler & cursor ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const onClick = (e: L.LeafletMouseEvent) => {
      if (selectionDone) return
      const { lat, lng } = e.latlng
      if (ZONES.some(z => isPointInPolygon(lat, lng, z))) {
        onMapClickRef.current({ lat, lng })
      } else {
        onOutOfZoneRef.current?.()
      }
    }
    const onMouseMove = () => {
      map.getContainer().style.cursor = selectionDone ? '' : 'crosshair'
    }
    map.on('click', onClick)
    map.on('mousemove', onMouseMove)
    map.getContainer().style.cursor = selectionDone ? '' : 'crosshair'
    return () => {
      map.off('click', onClick)
      map.off('mousemove', onMouseMove)
    }
  }, [selectionDone])

  // ── EFFECT 3: Place markers ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    placeMarkersRef.current.forEach(m => m.remove())
    placeMarkersRef.current = []

    placesInZone.forEach(place => {
      const isStart = place.id === startPlaceId
      const isEnd   = place.id === endPlaceId
      const icon    = isStart ? START_ICON : isEnd ? END_ICON : PLACE_ICON

      const marker = L.marker([place.latitude, place.longitude], { icon }).addTo(map)

      const tooltip = L.tooltip({ direction: 'top', offset: [0, -10], opacity: 1 })
      tooltip.setContent(`<span style="font-size:12px;font-weight:600;color:#111827;white-space:nowrap">${place.name}</span>`)
      marker.bindTooltip(tooltip)

      // Popup content built imperatively to avoid stale closures
      const popupEl = document.createElement('div')
      popupEl.style.cssText = 'padding:6px 2px 2px;min-width:190px'

      const title = document.createElement('p')
      title.style.cssText = 'margin:0 0 10px;font-weight:700;font-size:13px;color:#111827;line-height:1.3'
      title.textContent = place.name

      const badges = document.createElement('div')
      badges.style.cssText = 'display:flex;gap:6px;margin-bottom:10px'
      badges.innerHTML = `
        <span style="font-size:10px;font-weight:600;color:#7c3aed;background:#ede9fe;border-radius:20px;padding:2px 8px">📸 ${place.photo_score}</span>
        <span style="font-size:10px;font-weight:600;color:#b45309;background:#fef3c7;border-radius:20px;padding:2px 8px">🏛 ${place.tourist_score}</span>
      `

      const btnRow = document.createElement('div')
      btnRow.style.cssText = 'display:flex;gap:6px'

      const btnStart = document.createElement('button')
      btnStart.style.cssText = `flex:1;border:none;border-radius:8px;padding:7px 4px;background:${isStart ? '#059669' : '#10b981'};color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px`
      btnStart.innerHTML = `🚩 ${isStart ? 'Başlangıç ✓' : 'Başlangıç'}`
      btnStart.addEventListener('click', () => {
        onSetStartRef.current(place)
        marker.closePopup()
      })

      const btnEnd = document.createElement('button')
      btnEnd.style.cssText = `flex:1;border:none;border-radius:8px;padding:7px 4px;background:${isEnd ? '#dc2626' : '#ef4444'};color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px`
      btnEnd.innerHTML = `🏁 ${isEnd ? 'Bitiş ✓' : 'Bitiş'}`
      btnEnd.addEventListener('click', () => {
        onSetEndRef.current(place)
        marker.closePopup()
      })

      btnRow.appendChild(btnStart)
      btnRow.appendChild(btnEnd)
      popupEl.appendChild(title)
      popupEl.appendChild(badges)
      popupEl.appendChild(btnRow)

      marker.bindPopup(L.popup({ closeButton: false, minWidth: 190, maxWidth: 220 }).setContent(popupEl))
      placeMarkersRef.current.push(marker)
    })

    return () => {
      placeMarkersRef.current.forEach(m => m.remove())
      placeMarkersRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesInZone, startPlaceId, endPlaceId])

  // ── EFFECT 4: Free start / end markers (non-place clicks) ─────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (startCoords && !startPlaceId) {
      freeStartRef.current?.remove()
      freeStartRef.current = L.marker([startCoords.lat, startCoords.lng], { icon: START_ICON }).addTo(map)
    } else {
      freeStartRef.current?.remove()
      freeStartRef.current = null
    }

    if (endCoords && !endPlaceId) {
      freeEndRef.current?.remove()
      freeEndRef.current = L.marker([endCoords.lat, endCoords.lng], { icon: END_ICON }).addTo(map)
    } else {
      freeEndRef.current?.remove()
      freeEndRef.current = null
    }

    return () => {
      freeStartRef.current?.remove(); freeStartRef.current = null
      freeEndRef.current?.remove();   freeEndRef.current   = null
    }
  }, [startCoords, endCoords, startPlaceId, endPlaceId])

  // ── EFFECT 5: Baseline polyline (red dashed, start→end direct) ────────
  const sLat = startCoords?.lat, sLng = startCoords?.lng
  const eLat = endCoords?.lat,   eLng = endCoords?.lng
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (sLat == null || sLng == null || eLat == null || eLng == null) {
      baselinePolyRef.current?.remove(); baselinePolyRef.current = null
      lastBaselineKey.current = null
      return
    }
    const key = `${sLat.toFixed(6)},${sLng.toFixed(6)}→${eLat.toFixed(6)},${eLng.toFixed(6)}`
    if (key === lastBaselineKey.current && baselinePolyRef.current) return

    const ac = new AbortController()
    baselinePolyRef.current?.remove(); baselinePolyRef.current = null

    fetchMapboxWalking([[sLat, sLng], [eLat, eLng]], ac.signal)
      .then(({ path, distanceKm }) => {
        if (!mapRef.current) return
        lastBaselineKey.current = key
        onBaselineDistRef.current?.(distanceKm)
        baselinePolyRef.current = L.polyline(path, {
          color: '#EF4444', weight: 3, opacity: 0.85,
          dashArray: '8,8', lineCap: 'round', lineJoin: 'round',
        }).addTo(mapRef.current)
      })
      .catch(err => { if (err?.name !== 'AbortError') console.error('[Mapbox baseline]', err) })

    return () => ac.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sLat, sLng, eLat, eLng])

  // ── EFFECT 6: Experience polyline + waypoint markers ──────────────────
  const wpKey = activeRoute && activeRoute.waypoints.length >= 2
    ? activeRoute.waypoints.map(([la, lo]) => `${la.toFixed(6)},${lo.toFixed(6)}`).join('|')
    : null

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    experiencePolyRef.current?.remove(); experiencePolyRef.current = null
    waypointMarkersRef.current.forEach(m => m.remove()); waypointMarkersRef.current = []
    lastExperienceKey.current = null

    if (!wpKey || !activeRoute) return
    if (wpKey === lastExperienceKey.current) return

    const ac = new AbortController()

    fetchMapboxWalking(activeRoute.waypoints, ac.signal)
      .then(({ path }) => {
        if (!mapRef.current) return
        lastExperienceKey.current = wpKey

        experiencePolyRef.current = L.polyline(path, {
          color: '#879F84', weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round',
        }).addTo(mapRef.current)

        activeRoute.places.forEach((place: PlaceInRoute) => {
          const m = L.marker([place.latitude, place.longitude], { icon: makeWaypointPin(place.order) })
            .addTo(mapRef.current!)
          m.bindTooltip(
            `<span style="font-size:12px;font-weight:700;color:#3d4c3b">${place.order}. ${place.name}</span>`,
            { direction: 'top', offset: [0, -14], opacity: 1 },
          )
          waypointMarkersRef.current.push(m)
        })
      })
      .catch(err => {
        if (err?.name === 'AbortError') return
        console.error('[Mapbox experience]', err)
        onOsrmErrorRef.current?.()
      })

    return () => ac.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wpKey])

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}

export type { Coords }
