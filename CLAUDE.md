# Spotly — Proje Hafızası

Akıllı şehir gezi planlayıcı. Kullanıcıların seçtiği ağırlıklara (Fotoğraf, Gurme, Turistik) göre İstanbul/Galata bölgesindeki en uygun mekanları hesaplayıp rota çizen sistem.

## Mimari

- **Mimari Yapı:** Vertical Slice Architecture (`core/` + `features/`)
- **Backend:** FastAPI + PostgreSQL (SQLAlchemy ORM) + Docker Compose
- **Frontend:** React + Vite + TypeScript + TailwindCSS (v4, `@tailwindcss/vite`)
- **Şifreleme:** `bcrypt` (doğrudan, passlib yok) + `PyJWT`
- **Kullanıcı UX Kararı:** Rota hesaplaması için ağırlık slider'ı değil, 2 net seçenek kullanılacak: **Fotoğraf Odaklı** veya **Turistik Odaklı**. Sadelik ve karar hızı öncelikli.

## Klasör Yapısı

```
/
├── docker-compose.yml          ← PostgreSQL (5433:5432) + FastAPI (8000)
├── spotly-fastapi/             ← Python/FastAPI backend
│   ├── main.py
│   ├── core/
│   │   ├── config.py           ← env değişkenleri
│   │   ├── database.py         ← SQLAlchemy engine (retry mekanizmalı)
│   │   └── security.py         ← bcrypt + PyJWT + get_current_user
│   └── features/
│       └── auth/
│           ├── models.py       ← User ORM modeli
│           ├── schemas.py      ← Pydantic request/response
│           └── router.py       ← /auth/register, /login, /profile
└── spotly-frontend/            ← React/Vite/TS frontend
    └── src/
        ├── lib/api.ts          ← axios instance (token interceptor)
        ├── contexts/AuthContext.tsx  ← JWT + user state (localStorage)
        ├── components/layout/
        │   ├── Navbar.tsx      ← sticky glassmorphism navbar (logo + nav + auth)
        │   ├── Footer.tsx      ← slogan + sosyal medya ikonları
        │   └── MainLayout.tsx  ← Navbar + Footer sarmalayıcı
        ├── pages/
        │   ├── Home.tsx        ← Landing page (hero + nasıl çalışır + CTA)
        │   └── Explore.tsx     ← Korumalı placeholder (harita gelecek)
        └── features/auth/
            ├── AuthPage.tsx    ← split layout, query param ?mode=register, zaten giriş yaptıysa /explore'a yönlendir
            ├── LoginForm.tsx   ← giriş sonrası /explore'a navigate
            ├── RegisterForm.tsx← kayıt sonrası /explore'a navigate
            └── Dashboard.tsx   ← (artık kullanılmıyor, Explore sayfasına taşındı)
```

## Çalıştırma

```bash
# Backend + DB
docker compose up -d

# Frontend (dev)
cd spotly-frontend && npm run dev
```

- Backend: http://localhost:8000  (Swagger: /docs)
- Frontend: http://localhost:5173
- DB dışarıdan: postgresql://spotly_user:spotly_password@localhost:5433/SpotlyDb

## Auth API Uç Noktaları

| Metot | Yol | Açıklama |
|-------|-----|----------|
| POST | /auth/register | Kayıt → JWT + user |
| POST | /auth/login | Giriş → JWT + user |
| PATCH | /auth/profile | Profil güncelle (Bearer token) |

## Mevcut Durum

### ✅ Faz 1 — Backend Altyapı (Tamamlandı)
- Docker Compose: PostgreSQL (5433) + FastAPI (8000)
- DB race condition: `healthcheck` + `depends_on: condition: service_healthy`
- Auth feature: register / login / profile update
- bcrypt doğrudan kullanımı, PyJWT token üretimi

### ✅ Faz 2 — Frontend Auth Ekranları (Tamamlandı)
- Vite + React + TypeScript projesi (`spotly-frontend/`)
- TailwindCSS v4 (`@tailwindcss/vite` plugin)
- `AuthContext`: JWT ve user nesnesini localStorage'da tutar
- `LoginForm` + `RegisterForm`: API'ye axios ile bağlı, hata mesajları gösterir
- Giriş başarılı → `/explore` rotasına yönlendirilir
- Split layout: sol marka paneli (indigo) / sağ form paneli

### ✅ Faz 3 — Frontend Layout ve Landing Page (Tamamlandı)
- `react-router-dom` + `lucide-react` eklendi
- **Routing:** `/` → Home, `/auth` → AuthPage, `/explore` → Explore (korumalı), `*` → Home
- `ProtectedRoute`: token yoksa `/auth`'a yönlendirir
- **MainLayout**: sticky glassmorphism Navbar + Footer tüm public sayfaları sarar
- **Navbar**: Spotly logosu (Map ikonu), Nasıl Çalışır? / Keşfet linkleri, auth durumuna göre Giriş/Kaydol veya Çıkış butonu
- **Footer**: slogan "Şehri senin ritminle keşfet.", sosyal medya ikonları (Instagram, X, LinkedIn), telif
- **Home (Landing)**: İstanbul/Galata hero görseli (Unsplash), gradient overlay, CTA butonlar, 3 adım kartları, indigo CTA band
- **Explore**: korumalı placeholder, harita entegrasyonu için hazır

### ✅ Faz 4 — Explore Ekranı UI (Tamamlandı)
- Sol panel: başlık + 2 büyük seçilebilir kart (Fotoğraf / Turistik), aktif kart gradient + border + "Seçildi" rozeti
- "Bana Özel Rota Çiz" butonu: seçim olmadan disabled/gri, seçim yapılınca indigo + ok ikonu aktifleşir
- Sağ panel: ızgara desen harita placeholder, MapPin ikonu, demo mekan etiketleri (Galata, Kapalıçarşı, Ayasofya)
- Tüm arayüz iskeleti tamamlandı; API bağlantısı ve gerçek harita entegrasyonu sonraki fazda

### ✅ Faz 5 — Harita Entegrasyonu ve Dramatik Maskeleme (Tamamlandı)
- `leaflet`, `react-leaflet`, `@types/leaflet` kuruldu
- `leaflet/dist/leaflet.css` → `main.tsx`'e import edildi
- Vite bundle'ında Leaflet default ikon kırılması düzeltildi (`_getIconUrl` delete)
- `src/features/maps/SpotlyMap.tsx` oluşturuldu:
  - Merkez: Galata Kulesi (41.0259, 28.9744), Zoom: 15
  - Tile: CartoDB Positron (minimalist beyaz tema)
  - **Inverted Polygon Mask**: dünya dış ring + Galata/Karaköy delik poligonu → `fillColor: black, fillOpacity: 0.65, stroke: false`
  - Sonuç: Galata bölgesi parlak, dışarısı %65 koyu sis tabakası
- `Explore.tsx` sağ paneli `<SpotlyMap routeType={selected} />` ile dolduruldu; `routeType` prop'u gelecekte pin render için hazır

### ✅ Faz 6 — Place Modeli, Seed Data ve Başlangıç/Bitiş Seçimi (Tamamlandı)
- **Backend** `features/places/` slice oluşturuldu:
  - `models.py`: Place (id, name, latitude, longitude, photo_score, tourist_score)
  - `schemas.py`: PlaceResponse + PlaceBriefResponse
  - `router.py`: `GET /places` — tüm mekanları döner (auth gerektirmez)
  - `main.py`'de `_seed_places()`: tablo boşsa 5 Galata/Karaköy mekanını otomatik ekler
- **Seed mekanlar:** Galata Kulesi, Kamondo Merdivenleri, Karaköy Güllüoğlu, Galata Köprüsü, Neve Şalom Sinagogu
- **Frontend** `Explore.tsx` güncellendi:
  - `useEffect` ile `GET /places` fetch → `places` state'e yazılır
  - Başlangıç ve Bitiş `<select>` dropdown'ları rota tipi kartlarının üzerinde
  - Çift taraflı engelleme: başlangıçta seçilen mekan bitiş listesinde disabled, tersi de geçerli
  - CTA butonu: start + end + routeType üçü birden seçilmeden aktifleşmez

### ✅ Faz 7 — Haritadan Dinamik Koordinat Seçimi (Tamamlandı)
- Dropdown menüler kaldırıldı; koordinat seçimi tamamen harita üzerinden yapılıyor
- `SpotlyMap.tsx` güncellendi:
  - `useMapEvents` hook → harita tıklamalarını yakalar
  - Seçim tamamlandıysa (`selectionDone`) tıklama devre dışı; imleç `crosshair` olur
  - `START_ICON` (emerald yeşil) + `END_ICON` (kırmızı) — `L.divIcon` ile özel pin tasarımı, shadow yok
  - Props: `startCoords`, `endCoords`, `onMapClick`
- `Explore.tsx` güncellendi:
  - `handleMapClick`: ilk tık → startCoords, ikinci tık → endCoords
  - Sol panelde canlı adım göstergesi (yeşil/kırmızı ping animasyonu)
  - Başlangıç/Bitiş kutucukları: seçilince koordinat + `CheckCircle2` ikonu
  - "Seçimleri Temizle" butonu: sadece en az bir koordinat seçiliyken görünür
  - CTA butonu: start + end + routeType üçü tam dolmadan disabled

### ✅ Faz 8 — 20 İnteraktif POI + Hover/Click Aksiyonları (Tamamlandı)
- **Backend**: `_seed_places` 5 → 20 mekana genişledi (Galata, Karaköy, Pera bölgeleri)
  - `count < 20` kontrolü: eksik kayıt varsa tablo temizlenip tümü yeniden seed edilir
- **Frontend** `src/types/index.ts` oluşturuldu: `Place` ve `Coords` interface'leri paylaşımlı
- **SpotlyMap.tsx** köklü güncelleme:
  - `PLACE_ICON` (indigo 16px) — normal mekan pin'i
  - `PlaceMarker` bileşeni: her mekan için ayrı Marker + Tooltip + Popup
  - **Tooltip (hover)**: mekan adı, minimalist, direction="top"
  - **Popup (click)**: mekan adı, 📸/🏛 skor rozetleri, "🚩 Başlangıç" + "🏁 Bitiş" butonları; seçili durumda buton rengi koyulaşır + ✓ işareti
  - Seçilen place için pin rengi otomatik START_ICON (yeşil) veya END_ICON (kırmızı)'ya dönüşür
  - Serbest tıklama ile seçilen koordinatlar (place seçimi yoksa) ayrıca render edilir
- **Explore.tsx**: `startPlaceId`, `endPlaceId`, `startName`, `endName` state'leri eklendi
  - Sol panel başlangıç/bitiş kutucuklarında place adı gösterilir (koordinat yerine)
  - `handleSetStart` / `handleSetEnd`: place popup butonlarından tetiklenir

### ✅ Faz 9 — Operasyon Alanı V4: Hardcoded Spotly Zone + Dış Pin Temizliği (Tamamlandı)
- **Mimari Karar**: Harita maskesi hardcoded koordinatlarla (Spotly Zone) kusursuz hale getirildi ve dış pinler temizlendi. Backend ve Frontend %100 aynı 19-vertex polygon kullanır.
- **Spotly Zone polygon (lat, lon)** — kullanıcı tarafından sabitlenmiş:
  - Batı (Surlar): `[40.991,28.920] → [41.040,28.943]` (Yedikule → Ayvansaray)
  - Kuzey (İç): `[41.033,28.955] → [41.053,29.010]` (Kasımpaşa → Taksim → Yıldız)
  - Doğu Ucu: `[41.048,29.027]` (Ortaköy)
  - Boğaz Sahili: `[41.042,29.008] → [41.022,28.976]` (Beşiktaş → Kabataş → Karaköy, denize taşmadan)
  - Tarihi Yarımada Sahili: `[41.016,28.976] → [40.995,28.940]` (Eminönü → Sarayburnu → Kumkapı → Yedikule)
- **Backend** `main.py`:
  - `_SPOTLY_ZONE` polygon + `_in_zone()` ray-casting fonksiyonu eklendi
  - `_RAW_PLACES` (tuple list, 57 mekan) → `_SEED_PLACES` otomatik filtre ile **46 mekan**
  - Dışarı düşen 11 mekan: Topkapı Sarayı, Küçük Ayasofya, Galataport, Tophane Çeşmesi, Tophane-i Amire, Kabataş, Dolmabahçe, Ortaköy Camii, Çırağan, Eyüp Sultan Camii, Pierre Loti Tepesi
- **Frontend** `SpotlyMap.tsx`:
  - `SPOTLY_ZONE` 19-vertex polygon, Backend ile birebir aynı
  - `MAP_CENTER (41.022, 28.974)`, `MAP_ZOOM = 13`
  - `fillOpacity: 0.70`, `weight: 0`, `stroke: false`
  - `PLACE_ICON` kırmızı `#ef4444`, `START_ICON` emerald, `END_ICON` mavi `#3b82f6`

### ✅ Faz 10 — Hizmet Alanı Sınır Kontrolü (Tamamlandı)
- Harita dışı tıklamalar engellendi; Point-in-Polygon algoritması ile hizmet alanı sınır kontrolü eklendi.
- **SpotlyMap.tsx**: `isPointInPolygon(lat, lng, polygon)` yardımcı fonksiyonu eklendi (Ray-Casting, harici kütüphane yok).
- `MapClickHandler` güncellendi: tıklanan nokta `SPOTLY_ZONE` içindeyse pin eklenir, dışındaysa `onOutOfZone` callback'i tetiklenir.
- `SpotlyMapProps`'a `onOutOfZone?: () => void` prop'u eklendi.
- **Explore.tsx**: `zoneError` state + `useRef` timer ile 3 saniyelik otomatik kapanan toast bildirimi eklendi.
- Toast: `absolute bottom-6 left-1/2` konumlu, `bg-gray-900/90 backdrop-blur-sm` cam efektli, CSS `opacity/translate` geçişiyle animasyonlu.

### ✅ Faz 11 — Navbar Profil Avatarı ve /profile Sayfası İskeleti (Tamamlandı)
- **Navbar.tsx**: Giriş yapan kullanıcı için sağ üst köşeye `ui-avatars.com` tabanlı dairesel profil avatarı eklendi.
  - `avatarUrl(firstName, lastName)` yardımcı fonksiyonu; indigo arka plan, beyaz harf
  - `<Link to="/profile">` ile sarılı; `hover:border-indigo-300` geçiş animasyonu
  - İsim span kaldırıldı, yerine avatar geldi; Çıkış butonu korundu
- **Profile.tsx** (`src/pages/Profile.tsx`): Yeni sayfa oluşturuldu.
  - İndigo → mor gradient banner + `ui-avatars` büyük avatar + ad-soyad + e-posta
  - "Geçmiş Rotalarım" placeholder bölümü (boş durum görseli ile)
  - `MainLayout` sarmalayıcısı ile mevcut tasarım diline uyumlu
- **App.tsx**: `/profile` rotası eklendi; `ProtectedRoute` ile korumalı

### ✅ Faz 12 — Premium Tema: Kırık Beyaz & Adaçayı Yeşili (Tamamlandı)
- Sitenin genel teması Kırık Beyaz ve Adaçayı Yeşili olarak premium estetiğe güncellendi.
- **index.css**: `@theme` bloğu ile `offwhite (#FAF9F6)`, `sage (#879F84)`, `sage-light (#A3B8A0)`, `sage-dark (#6A8267)` renkleri tanımlandı. Body bg güncellendi. Leaflet popup/tooltip için offwhite CSS override eklendi.
- **Navbar**: `bg-offwhite/80`, `border-sage/20`, logo `text-sage-dark`, aktif link `bg-sage/10`, Kaydol butonu `bg-sage`
- **Explore**: Sol panel `bg-offwhite`, rota kartları sage ton paleti, CTA butonu `bg-sage hover:bg-sage-dark`
- **Home**: "Nasıl Çalışır" `bg-offwhite`, adım ikonları `bg-sage/10 text-sage-dark`, CTA band `bg-sage-dark`, "Rotanı Planla" `bg-sage`
- **Profile**: Banner `from-sage to-sage-dark`, avatar arka plan sage rengi
- **AuthPage**: Sol panel `bg-sage-dark`, alt metin `text-sage-light`
- **LoginForm / RegisterForm**: Submit buton `bg-sage hover:bg-sage-dark`, input focus `border-sage ring-sage/20`, link `text-sage-dark`
- **SpotlyMap maskes ve pinler dokunulmadı** — siyah maske + kırmızı/yeşil/mavi pinler amaçlı kontrast olarak korundu

### ✅ Faz 13 — SPA Routing Hatası Giderildi (Tamamlandı)
- SPA routing hatası giderildi; geçişlerde sayfa yenileme sorunu çözülerek react-router-dom Link entegrasyonu kusursuzlaştırıldı.
- **Kök Neden**: `spotly-client` projesi `useState`-tabanlı view switching kullanıyordu (`setCurrentView`). URL hiç değişmiyordu; doğrudan URL erişiminde uygulama her zaman 'home' state ile başlıyordu.
- **spotly-client — Tam Yeniden Yazım**:
  - `react-router-dom` v7 kuruldu (`npm install react-router-dom`)
  - `App.tsx`: `currentView` state'i kaldırıldı → `BrowserRouter + Routes + Route` eklendi
  - `AppContent()` iç bileşeni: `useNavigate()` + `useLocation()` hook'ları ile programatik navigasyon
  - Auth state `sessionStorage`'a taşındı (sayfa yenilemelerinde korunur)
  - `ProtectedRoute` bileşeni: `loggedInUser` null ise `/auth`'a yönlendirir
  - Navbar `<span onClick>` → `<Link to="...">` bileşenlerine dönüştürüldü
  - `handleLoginSuccess` → `navigate('/map')`, `handleLogout` → `navigate('/')`
  - `Home.tsx`: `onNavigate` prop'u kaldırıldı, `<Link to="/map">` kullanıldı
  - `Profile.tsx`: `onNavigate` prop'u kaldırıldı, `<Link to="/map">` kullanıldı; `onLogout` korundu
- **spotly-frontend — Küçük Düzeltmeler**:
  - `MainLayout.tsx`: `bg-white` → `bg-offwhite`
  - `Navbar.tsx`: `to="/#how-it-works"` → `to="/"` (hash router React Router'da güvenilir scroll yapmaz)

### 🔜 Faz 14 — Sonraki Adım
- `POST /routes/calculate` endpoint'i: start/end koordinatları + rota tipi alıp sıralı mekan listesi dönsün
- "Bana Özel Rota Çiz" butonunu bu endpoint'e bağla
- Hesaplanan rotanın mekanlarını haritada Leaflet Polyline ile birleştir



