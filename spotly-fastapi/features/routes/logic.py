import math
from sqlalchemy.orm import Session
from features.places.models import Place


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine mesafesi (km)."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def nearest_neighbor_order(start: tuple, end: tuple, places: list) -> list:
    """Greedy nearest-neighbor sıralaması: start'tan başla, en yakın ziyaret edilmemişi seç."""
    if not places:
        return []
    ordered: list = []
    remaining = list(places)
    cur_lat, cur_lng = start
    while remaining:
        nearest = min(remaining, key=lambda p: haversine(cur_lat, cur_lng, p.latitude, p.longitude))
        ordered.append(nearest)
        cur_lat, cur_lng = nearest.latitude, nearest.longitude
        remaining.remove(nearest)
    return ordered


def route_distance(start: tuple, end: tuple, places: list) -> float:
    """Toplam rota mesafesini km cinsinden hesapla."""
    if not places:
        return haversine(start[0], start[1], end[0], end[1])
    dist = haversine(start[0], start[1], places[0].latitude, places[0].longitude)
    for i in range(len(places) - 1):
        dist += haversine(places[i].latitude, places[i].longitude,
                          places[i + 1].latitude, places[i + 1].longitude)
    dist += haversine(places[-1].latitude, places[-1].longitude, end[0], end[1])
    return dist


def select_places(candidates: list, start: tuple, end: tuple, budget: float, max_count: int) -> list:
    """
    Puan sırasına göre sıralanmış aday mekanlardan greedy ile seç:
    toplam rota mesafesi budget'ı aşmayacak ve en fazla max_count nokta olacak şekilde.
    """
    selected: list = []
    for place in candidates:
        if len(selected) >= max_count:
            break
        test = selected + [place]
        ordered = nearest_neighbor_order(start, end, test)
        if route_distance(start, end, ordered) <= budget:
            selected.append(place)
    return nearest_neighbor_order(start, end, selected)


def build_route(route_id: str, label: str, description: str,
                ordered_places: list, start: tuple, end: tuple,
                route_type: str) -> dict:
    dist = route_distance(start, end, ordered_places)
    # Yürüme: 4.5 km/s → 13.3 dk/km; her durak 10 dk
    estimated_minutes = round(dist * 13.3 + len(ordered_places) * 10)
    total_score = round(
        sum(p.photo_score if route_type == 'photo' else p.tourist_score for p in ordered_places), 1
    )
    waypoints = [list(start)] + [[p.latitude, p.longitude] for p in ordered_places] + [list(end)]
    places_out = [
        {
            'id': p.id,
            'name': p.name,
            'latitude': p.latitude,
            'longitude': p.longitude,
            'photo_score': p.photo_score,
            'tourist_score': p.tourist_score,
            'order': i + 1,
        }
        for i, p in enumerate(ordered_places)
    ]
    return {
        'id': route_id,
        'label': label,
        'description': description,
        'places': places_out,
        'waypoints': waypoints,
        'total_distance_km': round(dist, 2),
        'estimated_minutes': estimated_minutes,
        'total_score': total_score,
    }


def calculate_routes(start_lat: float, start_lng: float,
                     end_lat: float, end_lng: float,
                     route_type: str, db: Session) -> list:
    start = (start_lat, start_lng)
    end   = (end_lat,   end_lng)

    # Sıfır mesafe koruması
    direct_dist = max(haversine(start_lat, start_lng, end_lat, end_lng), 0.15)

    # Mekanları puana göre sırala
    score_col = Place.photo_score if route_type == 'photo' else Place.tourist_score
    all_places = db.query(Place).order_by(score_col.desc()).all()

    # ── Rota A: Minimalist — direct path üzerindeki 2 durak (bireysel overhead ≤ %40) ──
    a_candidates = [
        p for p in all_places
        if (haversine(start_lat, start_lng, p.latitude, p.longitude) +
            haversine(p.latitude, p.longitude, end_lat, end_lng)) / direct_dist - 1 <= 0.40
    ]
    route_a = select_places(a_candidates, start, end, direct_dist * 1.35, 2)

    # ── Rota B: Dengeli — %30 uzunluk artışıyla 4 durak ──
    route_b = select_places(all_places, start, end, direct_dist * 1.30, 4)

    # ── Rota C: Tam Deneyim — %60 uzunluk artışıyla 7 durak ──
    route_c = select_places(all_places, start, end, direct_dist * 1.60, 7)

    return [
        build_route('A', 'Minimalist',    'Hızlı & Odaklı',        route_a, start, end, route_type),
        build_route('B', 'Dengeli',       'Denge & Keşif',          route_b, start, end, route_type),
        build_route('C', 'Tam Deneyim',   'Derinlemesine Gezi',     route_c, start, end, route_type),
    ]
