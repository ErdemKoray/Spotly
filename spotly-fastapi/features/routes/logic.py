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


def _project_km(lat: float, lon: float, origin_lat: float) -> tuple:
    """Küçük bölge için ekvatoryal düzlem yaklaşımı: (x_km, y_km)."""
    R = 6371.0
    x = math.radians(lon) * R * math.cos(math.radians(origin_lat))
    y = math.radians(lat) * R
    return x, y


def corridor_metrics(start: tuple, end: tuple, p_lat: float, p_lng: float) -> tuple:
    """
    Start→End çizgisine göre noktanın (along_km, perp_km, t) değerleri.
    """
    origin_lat = start[0]
    sx, sy = _project_km(start[0], start[1], origin_lat)
    ex, ey = _project_km(end[0],   end[1],   origin_lat)
    px, py = _project_km(p_lat,    p_lng,    origin_lat)
    dx, dy = ex - sx, ey - sy
    line_len2 = dx * dx + dy * dy
    if line_len2 < 1e-9:
        return 0.0, math.hypot(px - sx, py - sy), 0.0
    t = ((px - sx) * dx + (py - sy) * dy) / line_len2
    proj_x = sx + t * dx
    proj_y = sy + t * dy
    perp = math.hypot(px - proj_x, py - proj_y)
    along = t * math.sqrt(line_len2)
    return along, perp, t


def sort_by_projection(start: tuple, end: tuple, places: list) -> list:
    """Durakları start→end vektörü üzerindeki izdüşümlerine göre sırala."""
    def key(p):
        _along, _perp, t = corridor_metrics(start, end, p.latitude, p.longitude)
        return t
    return sorted(places, key=key)


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


def _in_bbox(start: tuple, end: tuple, lat: float, lng: float, pad_km: float) -> bool:
    pad_lat = pad_km / 111.0
    pad_lng = pad_km / (111.0 * math.cos(math.radians((start[0] + end[0]) / 2)))
    lat_lo, lat_hi = min(start[0], end[0]) - pad_lat, max(start[0], end[0]) + pad_lat
    lng_lo, lng_hi = min(start[1], end[1]) - pad_lng, max(start[1], end[1]) + pad_lng
    return lat_lo <= lat <= lat_hi and lng_lo <= lng <= lng_hi


def select_corridor_places(candidates: list, start: tuple, end: tuple,
                           max_perp_km: float, max_count: int, budget_km: float,
                           t_margin: float = 0.05) -> list:
    """
    Koridor filtresi: ana güzergaha dik sapma + bounding box.
    Yüksek puanlıdan başla, budget'ı aşmadan ve izdüşüm sırasında yerleştir.
    """
    in_corridor = []
    for p in candidates:
        if not _in_bbox(start, end, p.latitude, p.longitude, max_perp_km):
            continue
        _along, perp, t = corridor_metrics(start, end, p.latitude, p.longitude)
        if perp <= max_perp_km and -t_margin <= t <= 1.0 + t_margin:
            in_corridor.append(p)

    selected: list = []
    for p in in_corridor:
        if len(selected) >= max_count:
            break
        test = sort_by_projection(start, end, selected + [p])
        if route_distance(start, end, test) <= budget_km:
            selected.append(p)

    return sort_by_projection(start, end, selected)


def build_route(route_id: str, label: str, description: str,
                ordered_places: list, start: tuple, end: tuple,
                route_type: str) -> dict:
    dist = route_distance(start, end, ordered_places)
    # Yürüme: 5 km/s → 12 dk/km; durak bekleme süresi eklenmez
    estimated_minutes = round(dist * 12)
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

    direct_dist = max(haversine(start_lat, start_lng, end_lat, end_lng), 0.15)

    # ── Rota A: En Kısa Yol — Hiç durak yok, sadece start→end ──────────────
    route_a = build_route(
        'A',
        'En Kısa Yol',
        'Doğrudan güzergah, ara durak yok',
        [],          # <-- places boş: kesinlikle durak yok
        start, end, route_type,
    )

    # ── Rota B: Önerilen Keşif Rotası — Geniş koridor, yüksek puanlı duraklar
    score_col = Place.photo_score if route_type == 'photo' else Place.tourist_score
    all_places = db.query(Place).order_by(score_col.desc()).all()

    exploration_places = select_corridor_places(
        all_places, start, end,
        max_perp_km=0.70,          # 700 m dik sapma toleransı
        max_count=5,               # en fazla 5 durak
        budget_km=direct_dist * 1.65,  # %65 detour bütçesi
    )

    route_b = build_route(
        'B',
        'Keşif Rotası',
        'Önerilen noktalara uğrayan güzergah',
        exploration_places,
        start, end, route_type,
    )

    return [route_a, route_b]
