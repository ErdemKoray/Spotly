export interface Place {
  id: number
  name: string
  latitude: number
  longitude: number
  photo_score: number
  tourist_score: number
}

export interface Coords {
  lat: number
  lng: number
}

export interface PlaceInRoute {
  id: number
  name: string
  latitude: number
  longitude: number
  photo_score: number
  tourist_score: number
  order: number
}

export interface RouteOption {
  id: 'A' | 'B' | 'C'
  label: string
  description: string
  places: PlaceInRoute[]
  waypoints: [number, number][]
  total_distance_km: number
  estimated_minutes: number
  total_score: number
}
