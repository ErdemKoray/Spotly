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

// ── Sabit rota renkleri (index'e göre, hiç değişmez) ─────────────────────
const ROUTE_COLORS = ['#ef4444', '#78938A'] // 0=Kırmızı(En Kısa), 1=Adaçayı(Keşif)

function routeStyle(routeIndex: number, isActive: boolean): L.PathOptions {
  const color = ROUTE_COLORS[routeIndex] ?? '#94a3b8'
  // Her iki rota da her zaman kesikli — sadece kalınlık/opaklık değişir
  return {
    color,
    dashArray: '5,10',
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    weight:  isActive ? 6 : 4,
    opacity: isActive ? 1 : 0.5,
  }
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
const MAP_CENTER: [number, number] = [41.0168, 28.9470]
const MAP_ZOOM = 14

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

function makeWaypointPin(n: number, color = '#6A8267'): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;background:${color};border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.40);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800">${n}</div>`,
    iconSize:    [26, 26],
    iconAnchor:  [13, 13],
    popupAnchor: [0, -19],
  })
}

// Waypoint pin renkleri rota renkleriyle eşleşir
const WAYPOINT_COLORS = ROUTE_COLORS

// ── Props ──────────────────────────────────────────────────────────────────
export interface SpotlyMapProps {
  routeType?:       'photo' | 'tourist' | null
  places?:          Place[]
  startCoords:      Coords | null
  endCoords:        Coords | null
  startPlaceId?:    number | null
  endPlaceId?:      number | null
  routes?:          RouteOption[]
  activeRouteIndex?: number
  onMapClick:       (c: Coords) => void
  onOutOfZone?:     () => void
  onOsrmError?:     () => void
  onBaselineDist?:  (km: number) => void
  onSetStart:       (p: Place) => void
  onSetEnd:         (p: Place) => void
}

export default function SpotlyMap({
  places = [],
  startCoords,
  endCoords,
  startPlaceId,
  endPlaceId,
  routes = [],
  activeRouteIndex = 0,
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
  // Multi-route refs
  const routePolylinesRef  = useRef<(L.Polyline | null)[]>([])
  const routeMarkersRef    = useRef<(L.Marker | null)[][]>([])

  // Stable callback refs — prevent stale closures in effects
  const onMapClickRef      = useRef(onMapClick)
  const onOutOfZoneRef     = useRef(onOutOfZone)
  const onOsrmErrorRef     = useRef(onOsrmError)
  const onBaselineDistRef  = useRef(onBaselineDist)
  const onSetStartRef      = useRef(onSetStart)
  const onSetEndRef        = useRef(onSetEnd)
  const activeRouteIndexRef = useRef(activeRouteIndex)
  const routesRef           = useRef(routes)
  useEffect(() => { onMapClickRef.current      = onMapClick })
  useEffect(() => { onOutOfZoneRef.current     = onOutOfZone })
  useEffect(() => { onOsrmErrorRef.current     = onOsrmError })
  useEffect(() => { onBaselineDistRef.current  = onBaselineDist })
  useEffect(() => { onSetStartRef.current      = onSetStart })
  useEffect(() => { onSetEndRef.current        = onSetEnd })
  useEffect(() => { activeRouteIndexRef.current = activeRouteIndex })
  useEffect(() => { routesRef.current           = routes })

  // Quota protection for baseline
  const lastBaselineKey = useRef<string | null>(null)

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

  // ── EFFECT 5: Baseline polyline (dashed, start→end direct) ────────────
  const sLat = startCoords?.lat, sLng = startCoords?.lng
  const eLat = endCoords?.lat,   eLng = endCoords?.lng
  const hasRoutes = routes.length > 0
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Hide baseline once routes are drawn
    if (hasRoutes || sLat == null || sLng == null || eLat == null || eLng == null) {
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
  }, [sLat, sLng, eLat, eLng, hasRoutes])

  // ── EFFECT 6a: Fetch & draw all routes ───────────────────────────────
  // Re-runs only when the set of routes (waypoints) changes, not on index change
  const allWpKeys = routes
    .map(r => r.waypoints.map(([la, lo]) => `${la.toFixed(6)},${lo.toFixed(6)}`).join('|'))
    .join('||')

  useEffect(() => {
    const map = mapRef.current

    // Clear all previous route layers
    routePolylinesRef.current.forEach(p => p?.remove())
    routePolylinesRef.current = []
    routeMarkersRef.current.forEach(ms => ms?.forEach(m => m?.remove()))
    routeMarkersRef.current = []

    const validRoutes = routes.filter(r => r.waypoints.length >= 2)
    if (!validRoutes.length || !map) return

    const ac = new AbortController()
    const curActiveIdx = activeRouteIndexRef.current

    // Initialize arrays
    validRoutes.forEach((_, i) => {
      routePolylinesRef.current[i] = null
      routeMarkersRef.current[i] = []
    })

    // Fetch all routes in parallel
    validRoutes.forEach((route, i) => {
      fetchMapboxWalking(route.waypoints, ac.signal)
        .then(({ path }) => {
          if (!mapRef.current || ac.signal.aborted) return
          const isActive = i === curActiveIdx

          const poly = L.polyline(path, routeStyle(i, isActive)).addTo(mapRef.current)
          if (isActive) poly.bringToFront()
          routePolylinesRef.current[i] = poly

          // Waypoint markers for active route only
          const wpColor = WAYPOINT_COLORS[i] ?? '#6A8267'
          const markers: L.Marker[] = route.places.map((place: PlaceInRoute) => {
            const m = L.marker([place.latitude, place.longitude], {
              icon: makeWaypointPin(place.order, wpColor),
              opacity: isActive ? 1 : 0,
            }).addTo(mapRef.current!)
            m.bindTooltip(
              `<span style="font-size:12px;font-weight:700;color:#3d4c3b">${place.order}. ${place.name}</span>`,
              { direction: 'top', offset: [0, -14], opacity: 1 },
            )
            return m
          })
          routeMarkersRef.current[i] = markers
        })
        .catch(err => {
          if (err?.name === 'AbortError') return
          console.error(`[Mapbox route ${i}]`, err)
          onOsrmErrorRef.current?.()
        })
    })

    return () => ac.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWpKeys])

  // ── EFFECT 6b: Restyle routes on activeRouteIndex change (no re-fetch) ─
  useEffect(() => {
    // Restyle polylines
    routePolylinesRef.current.forEach((poly, i) => {
      if (!poly) return
      const isActive = i === activeRouteIndex
      poly.setStyle(routeStyle(i, isActive))
      if (isActive) poly.bringToFront()
    })

    // Toggle waypoint marker opacity
    routeMarkersRef.current.forEach((markers, i) => {
      const isActive = i === activeRouteIndex
      markers?.forEach(m => {
        // Use setOpacity to show/hide without removing from map
        m.setOpacity(isActive ? 1 : 0)
      })
    })
  }, [activeRouteIndex])

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}

export type { Coords }
