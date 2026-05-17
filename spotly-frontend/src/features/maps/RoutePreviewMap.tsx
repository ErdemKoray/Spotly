import { useEffect, useRef } from 'react'
import L from 'leaflet'

const MAPBOX_WALKING = 'https://api.mapbox.com/directions/v5/mapbox/walking'
const MAPBOX_TOKEN   = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

async function fetchWalkingPath(
  start: [number, number],
  end:   [number, number],
  signal: AbortSignal,
): Promise<[number, number][]> {
  if (!MAPBOX_TOKEN) throw new Error('no token')
  const coords = `${start[1]},${start[0]};${end[1]},${end[0]}`
  const params = new URLSearchParams({ geometries: 'geojson', overview: 'full', access_token: MAPBOX_TOKEN })
  const res = await fetch(`${MAPBOX_WALKING}/${coords}?${params}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.code !== 'Ok') throw new Error(json.code)
  return (json.routes[0].geometry.coordinates as number[][]).map(c => [c[1], c[0]] as [number, number])
}

function makePin(color: string, size = 16): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.40)"></div>`,
  })
}

interface Props {
  startLat: number
  startLng: number
  endLat:   number
  endLng:   number
}

export default function RoutePreviewMap({ startLat, startLng, endLat, endLng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const midLat = (startLat + endLat) / 2
    const midLng = (startLng + endLng) / 2

    const map = L.map(el, {
      center: [midLat, midLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
    })
    mapRef.current = map

    // Same Mapbox Streets tile as SpotlyMap
    if (MAPBOX_TOKEN) {
      L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
        { attribution: '&copy; Mapbox &copy; OpenStreetMap', tileSize: 512, zoomOffset: -1, maxZoom: 20 },
      ).addTo(map)
    } else {
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 },
      ).addTo(map)
    }

    // Markers — sage start, blue end (matches SpotlyMap palette)
    L.marker([startLat, startLng], { icon: makePin('#78938A', 16) }).addTo(map)
    L.marker([endLat,   endLng  ], { icon: makePin('#3b82f6', 16) }).addTo(map)

    // Fit bounds immediately so map frames both points before path arrives
    const bounds = L.latLngBounds([[startLat, startLng], [endLat, endLng]])
    // Run fitBounds after invalidateSize so dimensions are correct
    setTimeout(() => {
      map.invalidateSize()
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
    }, 80)

    // Fetch walking path
    const ctrl = new AbortController()
    let polyline: L.Polyline | null = null

    fetchWalkingPath([startLat, startLng], [endLat, endLng], ctrl.signal)
      .then(path => {
        if (ctrl.signal.aborted) return
        // Shadow layer (white) + main sage dashed line — identical to SpotlyMap style
        L.polyline(path, { color: '#ffffff', weight: 9, opacity: 0.55, lineCap: 'round', lineJoin: 'round' }).addTo(map)
        polyline = L.polyline(path, {
          color: '#78938A',
          weight: 5,
          dashArray: '12, 9',
          lineCap: 'round',
          lineJoin: 'round',
          opacity: 1,
        }).addTo(map)
        map.fitBounds(polyline.getBounds(), { padding: [60, 60], maxZoom: 15 })
      })
      .catch(() => {
        if (!ctrl.signal.aborted) {
          L.polyline([[startLat, startLng], [endLat, endLng]], {
            color: '#78938A', weight: 4, dashArray: '10, 7', opacity: 0.8,
          }).addTo(map)
        }
      })

    return () => {
      ctrl.abort()
      polyline?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [startLat, startLng, endLat, endLng])

  return <div ref={containerRef} className="w-full h-full" />
}
