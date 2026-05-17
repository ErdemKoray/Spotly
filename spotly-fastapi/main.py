from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base, SessionLocal
from features.auth.models import User    # noqa: F401
from features.auth.router import router as auth_router
from features.places.models import Place  # noqa: F401
from features.places.router import router as places_router
from features.routes.router import router as routes_router
from features.saved_routes.models import SavedRoute  # noqa: F401
from features.saved_routes.router import router as saved_routes_router

Base.metadata.create_all(bind=engine)

# Spotly Zone polygon (lat, lon) — kullanıcı tarafından sabitlenmiş kesin sınırlar.
# Bu poligon dışındaki hiçbir mekan veritabanına alınmaz.
_SPOTLY_ZONE: list[tuple[float, float]] = [
    (40.991, 28.920), (41.000, 28.922), (41.016, 28.925), (41.031, 28.936), (41.040, 28.943),
    (41.033, 28.955), (41.038, 28.980), (41.045, 28.995), (41.053, 29.010),
    (41.048, 29.027),
    (41.042, 29.008), (41.035, 28.992), (41.026, 28.982), (41.022, 28.976),
    (41.016, 28.976), (41.014, 28.985), (41.005, 28.978), (41.000, 28.958), (40.995, 28.940),
]


def _in_zone(lat: float, lon: float) -> bool:
    """Ray-casting point-in-polygon (lat/lon)."""
    n = len(_SPOTLY_ZONE)
    inside = False
    j = n - 1
    for i in range(n):
        lat_i, lon_i = _SPOTLY_ZONE[i]
        lat_j, lon_j = _SPOTLY_ZONE[j]
        if (lon_i > lon) != (lon_j > lon):
            slope = (lat_j - lat_i) * (lon - lon_i) / (lon_j - lon_i) + lat_i
            if lat < slope:
                inside = not inside
        j = i
    return inside


_RAW_PLACES = [
    # ── Tarihi Yarımada / Fatih ──────────────────────────────────────────────
    ("Ayasofya",                    41.0086, 28.9802, 9.2, 9.9),
    ("Sultanahmet Camii",           41.0054, 28.9768, 9.0, 9.8),
    ("Kapalıçarşı",                 41.0108, 28.9680, 8.5, 9.5),
    ("Mısır Çarşısı",              41.0175, 28.9704, 8.7, 9.2),
    ("Yerebatan Sarnıcı",           41.0081, 28.9779, 9.1, 9.3),
    ("At Meydanı (Hippodrom)",      41.0064, 28.9762, 8.3, 9.0),
    ("Süleymaniye Camii",           41.0162, 28.9637, 9.0, 9.4),
    ("Rüstem Paşa Camii",           41.0176, 28.9690, 9.3, 8.5),
    ("Çemberlitaş",                 41.0081, 28.9723, 8.0, 8.2),
    ("İstanbul Arkeoloji Müzeleri", 41.0130, 28.9797, 7.8, 9.2),
    ("Gülhane Parkı",               41.0133, 28.9795, 8.5, 8.0),
    ("Sirkeci Tren Garı",           41.0164, 28.9749, 8.2, 8.5),
    ("Zeyrek Camii (Pantokrator)",  41.0197, 28.9592, 8.4, 8.7),
    ("Fatih Camii",                 41.0197, 28.9529, 7.8, 8.5),
    ("Kariye Müzesi (Chora)",       41.0259, 28.9359, 8.9, 9.1),
    ("Fener Rum Patrikhanesi",      41.0310, 28.9415, 8.0, 8.8),
    ("Balat Mahallesi",             41.0300, 28.9390, 9.2, 7.5),
    ("Vefa Bozacısı",               41.0175, 28.9610, 8.0, 7.8),
    # ── Yedikule / Samatya / Tarihi Surlar (Batı + Güneybatı Fatih) ──────────
    ("Yedikule Hisarı (Zindanları)",40.9920, 28.9226, 9.0, 9.4),
    ("Yedikule Sahil Parkı",        40.9960, 28.9280, 8.5, 7.2),
    ("İmrahor Camii (Studios)",     40.9988, 28.9290, 7.8, 8.6),
    ("Belgradkapı (Tarihi Sur)",    41.0020, 28.9255, 8.2, 8.5),
    ("Silivrikapı (Tarihi Sur)",    41.0058, 28.9258, 8.0, 8.3),
    ("Samatya Meydanı",             41.0010, 28.9358, 8.4, 7.5),
    ("Aya Yorgi Rum Kilisesi",      41.0015, 28.9365, 8.3, 8.4),
    ("Surp Kevork Ermeni Kilisesi", 41.0005, 28.9395, 8.0, 8.2),
    ("Narlıkapı (Sur)",             40.9990, 28.9495, 8.0, 8.0),
    ("Mevlanakapı (Tarihi Sur)",    41.0150, 28.9282, 7.8, 8.0),
    ("Topkapı (Maltepe Surları)",   41.0192, 28.9305, 8.0, 8.2),
    ("Edirnekapı (Tarihi Sur)",     41.0270, 28.9358, 8.5, 8.6),
    ("Tekfur Sarayı",               41.0345, 28.9410, 8.7, 8.9),
    # ── Eminönü ─────────────────────────────────────────────────────────────
    ("Eminönü Meydanı",             41.0178, 28.9713, 8.5, 9.0),
    ("Yeni Cami",                   41.0170, 28.9705, 8.7, 8.8),
    ("Galata Köprüsü",              41.0199, 28.9723, 8.2, 9.0),
    # ── Galata / Karaköy ────────────────────────────────────────────────────
    ("Galata Kulesi",               41.0259, 28.9744, 9.5, 9.8),
    ("Kamondo Merdivenleri",        41.0238, 28.9740, 9.7, 7.5),
    ("SALT Galata",                 41.0241, 28.9760, 8.5, 8.0),
    ("Karaköy Güllüoğlu",           41.0230, 28.9774, 7.8, 6.5),
    ("Bankalar Caddesi",            41.0237, 28.9762, 8.0, 8.0),
    ("Perşembe Pazarı",             41.0248, 28.9782, 8.5, 6.5),
    ("Karaköy İskele Meydanı",      41.0197, 28.9743, 8.0, 7.5),
    ("St. Pierre Han",              41.0263, 28.9756, 8.8, 7.5),
    # ── Beyoğlu / Galata Kuzeyi ─────────────────────────────────────────────
    ("Neve Şalom Sinagogu",         41.0267, 28.9719, 7.0, 9.2),
    ("Galata Mevlevihanesi",        41.0285, 28.9735, 7.8, 8.5),
    ("Kırım Kilisesi",              41.0295, 28.9717, 8.3, 8.0),
    ("Yüksek Kaldırım Sokak",       41.0271, 28.9735, 9.0, 7.0),
    ("Serdar-ı Ekrem Sokak",        41.0280, 28.9726, 9.3, 6.5),
    # ── Pera / İstiklal ─────────────────────────────────────────────────────
    ("Narmanlı Han",                41.0315, 28.9776, 9.0, 7.0),
    ("Pera Müzesi",                 41.0330, 28.9782, 7.5, 9.0),
    ("Aziz Antuan Kilisesi",        41.0319, 28.9780, 8.0, 8.5),
    ("Galatasaray Lisesi",          41.0312, 28.9784, 8.2, 8.0),
    ("Çiçek Pasajı",               41.0322, 28.9794, 8.8, 8.5),
    ("Pera Palas Oteli",            41.0344, 28.9797, 9.1, 9.0),
    # ── Taksim / Cihangir ───────────────────────────────────────────────────
    ("Taksim Meydanı",              41.0369, 28.9850, 8.0, 9.2),
    ("Cihangir Camii",              41.0278, 28.9826, 8.5, 7.5),
    ("Taksim Camii",               41.0395, 28.9834, 7.5, 7.8),
    ("AKM Atatürk Kültür Merkezi", 41.0367, 28.9885, 8.3, 8.0),
    # ── Beşiktaş / Yıldız ───────────────────────────────────────────────────
    ("Beşiktaş İskele Meydanı",     41.0430, 29.0082, 7.8, 8.0),
    ("Yıldız Parkı",                41.0524, 29.0103, 8.5, 8.0),
]

# Polygon dışındaki tüm noktaları otomatik filtrele (cerrahi temizlik)
_SEED_PLACES = [
    Place(name=n, latitude=la, longitude=lo, photo_score=ps, tourist_score=ts)
    for (n, la, lo, ps, ts) in _RAW_PLACES if _in_zone(la, lo)
]


def _seed_places() -> None:
    """Kayıt sayısı seed listesi ile eşleşmiyorsa tabloyu temizleyip tüm mekanları ekle."""
    db = SessionLocal()
    try:
        if db.query(Place).count() != len(_SEED_PLACES):
            db.query(Place).delete()
            db.add_all(_SEED_PLACES)
            db.commit()
    finally:
        db.close()


_seed_places()

app = FastAPI(title="Spotly API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(places_router)
app.include_router(routes_router)
app.include_router(saved_routes_router)


@app.get("/health")
def health():
    return {"status": "ok"}
