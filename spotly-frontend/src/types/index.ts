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

export interface SavedRoute {
  id: number
  route_type: 'photo' | 'tourist'
  label: string
  description: string
  total_distance_km: number
  estimated_minutes: number
  stop_count: number
  start_lat: number
  start_lng: number
  end_lat: number
  end_lng: number
  start_name: string | null
  end_name: string | null
  created_at: string
}
