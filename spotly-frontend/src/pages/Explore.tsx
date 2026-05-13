import { useState, useEffect, useRef } from 'react'
import { Camera, Landmark, ArrowRight, Navigation, MapPin, X, CheckCircle2 } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import SpotlyMap from '../features/maps/SpotlyMap'
import type { Place, Coords } from '../types'
import api from '../lib/api'

type RouteType = 'photo' | 'tourist' | null

const ROUTE_OPTIONS = [
  {
    id: 'photo' as const,
    icon: Camera,
    label: 'Fotoğraf Odaklı Rota',
    desc: 'En estetik ve Instagramlanabilir mekanları keşfet.',
    color: 'from-sage/5 to-sage-light/10',
    border: 'border-sage-light',
    ring: 'ring-sage/20',
    iconBg: 'bg-sage/10 text-sage-dark',
    dot: 'bg-sage',
    badge: 'text-sage-dark bg-sage/10 border-sage/30',
  },
  {
    id: 'tourist' as const,
    icon: Landmark,
    label: 'Turistik Odaklı Rota',
    desc: 'İkonik tarihi mekânları ve kültürel mirası gez.',
    color: 'from-sage-dark/5 to-sage/10',
    border: 'border-sage',
    ring: 'ring-sage-dark/20',
    iconBg: 'bg-sage-dark/10 text-sage-dark',
    dot: 'bg-sage-dark',
    badge: 'text-sage-dark bg-sage-dark/10 border-sage-dark/30',
  },
]

function fmt(n: number) { return n.toFixed(4) }

export default function Explore() {
  const [selected, setSelected]         = useState<RouteType>(null)
  const [places, setPlaces]             = useState<Place[]>([])
  const [startCoords, setStartCoords]   = useState<Coords | null>(null)
  const [endCoords, setEndCoords]       = useState<Coords | null>(null)
  const [startPlaceId, setStartPlaceId] = useState<number | null>(null)
  const [endPlaceId, setEndPlaceId]     = useState<number | null>(null)
  const [startName, setStartName]       = useState<string | null>(null)
  const [endName, setEndName]           = useState<string | null>(null)
  const [zoneError, setZoneError]       = useState(false)
  const zoneErrorTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api.get<Place[]>('/places').then(({ data }) => setPlaces(data))
  }, [])

  // Serbest harita tıklaması
  function handleMapClick(coords: Coords) {
    if (!startCoords) {
      setStartCoords(coords)
      setStartPlaceId(null)
      setStartName(null)
    } else if (!endCoords) {
      setEndCoords(coords)
      setEndPlaceId(null)
      setEndName(null)
    }
  }

  // Popup'tan başlangıç seçimi
  function handleSetStart(place: Place) {
    setStartCoords({ lat: place.latitude, lng: place.longitude })
    setStartPlaceId(place.id)
    setStartName(place.name)
  }

  // Popup'tan bitiş seçimi
  function handleSetEnd(place: Place) {
    setEndCoords({ lat: place.latitude, lng: place.longitude })
    setEndPlaceId(place.id)
    setEndName(place.name)
  }

  function handleOutOfZone() {
    setZoneError(true)
    if (zoneErrorTimer.current) clearTimeout(zoneErrorTimer.current)
    zoneErrorTimer.current = setTimeout(() => setZoneError(false), 3000)
  }

  function clearSelections() {
    setStartCoords(null); setStartPlaceId(null); setStartName(null)
    setEndCoords(null);   setEndPlaceId(null);   setEndName(null)
  }

  const selectionStep = !startCoords ? 'start' : !endCoords ? 'end' : 'done'
  const canSubmit     = selected && startCoords && endCoords

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-4rem)]">

        {/* ── Sol Panel ── */}
        <aside className="w-full max-w-sm flex-shrink-0 border-r border-sage/15 bg-offwhite flex flex-col overflow-y-auto z-10">

          <div className="px-6 pt-8 pb-6 border-b border-sage/15">
            <div className="flex items-center gap-2 text-sage-dark text-xs font-semibold uppercase tracking-widest mb-3">
              <Navigation size={12} />
              Rota Planlayıcı
            </div>
            <h1 className="text-xl font-bold text-stone-800 leading-snug">Rotanı haritadan çiz</h1>
            <p className="text-sm text-stone-400 mt-1.5">
              İğneye tıkla veya haritanın boş alanına dokunarak nokta seç.
            </p>
          </div>

          <div className="px-5 py-6 flex flex-col gap-5 flex-1">

            {/* ── Koordinat Seçim Durumu ── */}
            <div className="flex flex-col gap-2.5">

              {selectionStep !== 'done' && (
                <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border ${
                  selectionStep === 'start'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      selectionStep === 'start' ? 'bg-emerald-400' : 'bg-red-400'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      selectionStep === 'start' ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                  </span>
                  {selectionStep === 'start' ? 'Başlangıç noktasını seç' : 'Bitiş noktasını seç'}
                </div>
              )}

              {/* Başlangıç kutusu */}
              <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                startCoords ? 'border-emerald-200 bg-emerald-50' : 'border-dashed border-gray-200 bg-gray-50'
              }`}>
                <MapPin size={15} className={startCoords ? 'text-emerald-500 flex-shrink-0' : 'text-gray-300 flex-shrink-0'} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Başlangıç</p>
                  {startCoords ? (
                    <p className="text-xs text-emerald-700 font-medium mt-0.5 truncate">
                      {startName ?? <span className="font-mono">{fmt(startCoords.lat)}, {fmt(startCoords.lng)}</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-300 mt-0.5">Seçilmedi</p>
                  )}
                </div>
                {startCoords && <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />}
              </div>

              {/* Bitiş kutusu */}
              <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                endCoords ? 'border-red-200 bg-red-50' : 'border-dashed border-gray-200 bg-gray-50'
              }`}>
                <MapPin size={15} className={endCoords ? 'text-red-400 flex-shrink-0' : 'text-gray-300 flex-shrink-0'} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bitiş</p>
                  {endCoords ? (
                    <p className="text-xs text-red-600 font-medium mt-0.5 truncate">
                      {endName ?? <span className="font-mono">{fmt(endCoords.lat)}, {fmt(endCoords.lng)}</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-300 mt-0.5">Seçilmedi</p>
                  )}
                </div>
                {endCoords && <CheckCircle2 size={15} className="text-red-400 flex-shrink-0" />}
              </div>

              {(startCoords || endCoords) && (
                <button
                  onClick={clearSelections}
                  className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-2 transition-all"
                >
                  <X size={12} />
                  Seçimleri Temizle
                </button>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* ── Rota Tipi Kartları ── */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Rota Tipi</p>
              {ROUTE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isActive = selected === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(isActive ? null : opt.id)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                      isActive
                        ? `bg-gradient-to-br ${opt.color} ${opt.border} ring-4 ${opt.ring} shadow-sm`
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? opt.iconBg : 'bg-gray-100 text-gray-400'}`}>
                        <Icon size={17} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{opt.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isActive ? `${opt.border} bg-white` : 'border-gray-200'}`}>
                        {isActive && <div className={`w-2 h-2 rounded-full ${opt.dot}`} />}
                      </div>
                    </div>
                    {isActive && (
                      <span className={`inline-flex items-center mt-2.5 ml-12 text-xs font-medium border rounded-full px-2 py-0.5 ${opt.badge}`}>
                        Seçildi
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-5 pb-8">
            <button
              disabled={!canSubmit}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                canSubmit
                  ? 'bg-sage hover:bg-sage-dark text-white shadow-lg shadow-sage/20 cursor-pointer'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed'
              }`}
            >
              {canSubmit
                ? <><span>Bana Özel Rota Çiz</span><ArrowRight size={16} /></>
                : 'Tüm seçimleri tamamlayın'}
            </button>
          </div>
        </aside>

        {/* ── Harita ── */}
        <div className="flex-1 relative overflow-hidden">
          <SpotlyMap
            places={places}
            startCoords={startCoords}
            endCoords={endCoords}
            startPlaceId={startPlaceId}
            endPlaceId={endPlaceId}
            onMapClick={handleMapClick}
            onOutOfZone={handleOutOfZone}
            onSetStart={handleSetStart}
            onSetEnd={handleSetEnd}
          />

          {/* ── Hizmet Alanı Dışı Toast ── */}
          <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] transition-all duration-300 ${
              zoneError ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-2.5 bg-gray-900/90 backdrop-blur-sm text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl">
              <span className="text-base">📍</span>
              <span>Seçtiğiniz nokta Spotly hizmet alanı dışındadır.</span>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
