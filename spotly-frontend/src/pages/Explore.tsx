import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Landmark, ArrowRight, Navigation, MapPin, X,
  CheckCircle2, Zap, Star, RotateCcw, Loader2,
  Map, LogOut, Clock, Route, Bookmark, BookmarkCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import SpotlyMap from '../features/maps/SpotlyMap'
import type { Place, Coords, RouteOption } from '../types'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

type RouteType = 'photo' | 'tourist' | null

// Two-slot route card metadata (index 0 = shortest, index 1 = recommended)
const ROUTE_CARD_META = [
  {
    title: 'En Kısa Yol',
    Icon: Zap,
    activeBorder:  'border-amber-400',
    activeBg:      'bg-amber-50/60',
    activeRing:    'ring-1 ring-amber-200',
    passiveBorder: 'border-gray-200',
    passiveBg:     'bg-gray-50',
    iconActiveBg:  'bg-amber-100',
    iconActiveColor: 'text-amber-600',
    iconPassiveBg:  'bg-gray-100',
    iconPassiveColor: 'text-gray-400',
    titleColor:    'text-amber-700',
    hex:           '#d97706',
  },
  {
    title: 'Önerilen Keşif Rotası',
    Icon: Star,
    activeBorder:  'border-[#78938A]',
    activeBg:      'bg-[#78938A]/8',
    activeRing:    'ring-1 ring-[#78938A]/40',
    passiveBorder: 'border-gray-200',
    passiveBg:     'bg-gray-50',
    iconActiveBg:  'bg-[#78938A]/15',
    iconActiveColor: 'text-sage-dark',
    iconPassiveBg:  'bg-gray-100',
    iconPassiveColor: 'text-gray-400',
    titleColor:    'text-sage-dark',
    hex:           '#78938A',
  },
] as const

const ease = [0.25, 0.46, 0.45, 0.94] as const

function avatarUrl(first: string, last: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${first}+${last}`)}&background=879F84&color=fff&size=80`
}
function fmt(n: number) { return n.toFixed(4) }

/* ── Reusable animated glass button ── */
function GlassBtn({
  onClick, disabled, className, children,
}: {
  onClick?: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.015, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15, ease }}
      className={className}
    >
      {children}
    </motion.button>
  )
}

export default function Explore() {
  const { user, logout } = useAuth()

  const [selected, setSelected]               = useState<RouteType>(null)
  const [places, setPlaces]                   = useState<Place[]>([])
  const [startCoords, setStartCoords]         = useState<Coords | null>(null)
  const [endCoords, setEndCoords]             = useState<Coords | null>(null)
  const [startPlaceId, setStartPlaceId]       = useState<number | null>(null)
  const [endPlaceId, setEndPlaceId]           = useState<number | null>(null)
  const [startName, setStartName]             = useState<string | null>(null)
  const [endName, setEndName]                 = useState<string | null>(null)
  const [zoneError, setZoneError]             = useState(false)
  const [serverError, setServerError]         = useState<string | null>(null)
  const [routes, setRoutes]                   = useState<RouteOption[]>([])
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0)
  const [calculating, setCalculating]         = useState(false)
  const [routeError, setRouteError]           = useState<string | null>(null)
  const [isSaved, setIsSaved]                 = useState(false)
  const [saving, setSaving]                   = useState(false)
  const zoneTimer                             = useRef<ReturnType<typeof setTimeout> | null>(null)
  const serverTimer                           = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showServerError(msg: string) {
    setServerError(msg)
    if (serverTimer.current) clearTimeout(serverTimer.current)
    serverTimer.current = setTimeout(() => setServerError(null), 4000)
  }

  useEffect(() => {
    api.get<Place[]>('/places')
      .then(({ data }) => setPlaces(data))
      .catch(() => showServerError('Sunucuya bağlanılamadı, lütfen daha sonra tekrar deneyin.'))
  }, [])

  function handleMapClick(coords: Coords) {
    if (!startCoords)    { setStartCoords(coords); setStartPlaceId(null); setStartName(null) }
    else if (!endCoords) { setEndCoords(coords);   setEndPlaceId(null);   setEndName(null)   }
  }
  function handleSetStart(place: Place) {
    setStartCoords({ lat: place.latitude, lng: place.longitude })
    setStartPlaceId(place.id); setStartName(place.name)
  }
  function handleSetEnd(place: Place) {
    setEndCoords({ lat: place.latitude, lng: place.longitude })
    setEndPlaceId(place.id); setEndName(place.name)
  }
  function handleOutOfZone() {
    setZoneError(true)
    if (zoneTimer.current) clearTimeout(zoneTimer.current)
    zoneTimer.current = setTimeout(() => setZoneError(false), 3000)
  }
  function clearStart() {
    setStartCoords(null); setStartPlaceId(null); setStartName(null)
    if (routes.length) { setRoutes([]); setActiveRouteIndex(0) }
  }
  function clearEnd() {
    setEndCoords(null); setEndPlaceId(null); setEndName(null)
    if (routes.length) { setRoutes([]); setActiveRouteIndex(0) }
  }
  function clearAll() {
    setStartCoords(null); setStartPlaceId(null); setStartName(null)
    setEndCoords(null);   setEndPlaceId(null);   setEndName(null)
    setRoutes([]);        setActiveRouteIndex(0); setRouteError(null)
    setIsSaved(false);    setSaving(false)
  }

  async function handleCalculate() {
    if (!startCoords || !endCoords || !selected) return
    setCalculating(true); setRouteError(null); setRoutes([]); setActiveRouteIndex(0); setIsSaved(false)
    try {
      const { data } = await api.post('/routes/calculate', {
        start_lat: startCoords.lat, start_lng: startCoords.lng,
        end_lat:   endCoords.lat,   end_lng:   endCoords.lng,
        route_type: selected,
      })
      setRoutes(data.routes)
      setActiveRouteIndex(0)
    } catch (err: unknown) {
      const isNetwork = err instanceof Error && (err.message.includes('Network') || err.message.includes('ECONNREFUSED') || (err as { code?: string }).code === 'ERR_NETWORK')
      if (isNetwork) {
        showServerError('Sunucuya bağlanılamadı, lütfen daha sonra tekrar deneyin.')
      } else {
        setRouteError('Rota hesaplanamadı. Lütfen tekrar deneyin.')
      }
    } finally {
      setCalculating(false)
    }
  }

  async function handleSaveRecommended(e: React.MouseEvent) {
    e.stopPropagation()
    if (isSaved || saving || !startCoords || !endCoords || !selected) return
    const recommended = routes[1] ?? routes[0]
    if (!recommended) return
    setSaving(true)
    try {
      await api.post('/saved-routes', {
        route_type: selected,
        label: recommended.label,
        description: recommended.description,
        total_distance_km: recommended.total_distance_km,
        estimated_minutes: recommended.estimated_minutes,
        stop_count: recommended.places.length,
        start_lat: startCoords.lat,
        start_lng: startCoords.lng,
        end_lat: endCoords.lat,
        end_lng: endCoords.lng,
        start_name: startName ?? null,
        end_name: endName ?? null,
      })
      setIsSaved(true)
    } catch {
      showServerError('Rota kaydedilemedi. Lütfen tekrar giriş yapın.')
    } finally {
      setSaving(false)
    }
  }

  const step      = !startCoords ? 'start' : !endCoords ? 'end' : 'done'
  const canSubmit = !!(selected && startCoords && endCoords)
  const hasRoutes = routes.length > 0

  const panelTitle = hasRoutes ? 'Alternatif rotalar' : step !== 'done' ? 'Noktaları belirle' : 'Rota tipini seç'

  /* ─── shared spring ─── */
  const spring = { type: 'spring', stiffness: 380, damping: 30 } as const

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-stone-50">

      {/* ══ Üst Sabit Navbar ══ */}
      <header className="w-full h-16 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm flex items-center justify-between px-6 shrink-0 z-20">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-sage-dark font-bold text-sm tracking-tight hover:opacity-80 transition-opacity"
        >
          <Map size={17} strokeWidth={2.5} />
          Spotly
        </Link>

        {/* Sağ aksiyonlar */}
        {user && (
          <div className="flex items-center gap-2">
            <Link to="/profile" title={`${user.first_name} ${user.last_name}`}>
              <img
                src={avatarUrl(user.first_name, user.last_name)}
                alt="Profil"
                className="w-8 h-8 rounded-xl border-2 border-transparent hover:border-sage object-cover transition-colors cursor-pointer"
              />
            </Link>
            <div className="w-px h-4 bg-stone-300" />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              Çıkış
            </button>
          </div>
        )}
      </header>

      {/* ══ Alt İçerik Alanı ══ */}
      <div className="flex flex-1 overflow-hidden w-full">

        {/* ── Sol Sidebar — Rota Paneli ── */}
        <aside className="w-[320px] h-full bg-white/90 backdrop-blur-md border-r border-stone-200 flex-shrink-0 flex flex-col z-10" style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.08)' }}>

          {/* Panel başlığı */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-1.5 text-sage-dark text-[10px] font-bold uppercase tracking-widest mb-1.5">
              <Navigation size={10} />
              Rota Planlayıcı
            </div>
            <AnimatePresence mode="wait">
              <motion.h1
                key={panelTitle}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease }}
                className="text-base font-bold text-stone-900 leading-snug"
              >
                {panelTitle}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 panel-scroll">

          {/* ─── Koordinat Seçimi ─── */}
          <div className="space-y-1.5">

            {/* Adım göstergesi */}
            <AnimatePresence mode="wait">
              {step !== 'done' && (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.22, ease }}
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border ${
                    step === 'start'
                      ? 'bg-sage/10 border-sage/25 text-sage-dark'
                      : 'bg-blue-50/80 border-blue-100 text-blue-700'
                  }`}
                >
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${step === 'start' ? 'bg-sage' : 'bg-blue-400'}`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${step === 'start' ? 'bg-sage-dark' : 'bg-blue-500'}`} />
                  </span>
                  {step === 'start' ? 'Başlangıç noktasını seç' : 'Bitiş noktasını seç'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Başlangıç kutusu */}
            <motion.div
              layout
              animate={{
                background: startCoords ? 'rgba(120,147,138,0.08)' : 'rgba(249,250,251,1)',
                borderColor: startCoords ? 'rgba(120,147,138,0.50)' : step === 'start' ? 'rgba(120,147,138,0.35)' : 'rgba(229,231,235,1)',
              }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-sm"
              style={{ boxShadow: step === 'start' && !startCoords ? '0 0 0 2px rgba(120,147,138,0.15), 0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <motion.div
                animate={{ background: startCoords ? 'rgba(120,147,138,0.15)' : 'rgba(244,241,234,1)' }}
                transition={{ duration: 0.25 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                {startCoords
                  ? <CheckCircle2 size={15} className="text-sage" />
                  : <MapPin size={15} className="text-stone-400" />}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Başlangıç</p>
                <AnimatePresence mode="wait">
                  {startCoords ? (
                    <motion.p
                      key="val"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      className="text-xs font-semibold text-sage-dark truncate mt-0.5"
                    >
                      {startName ?? <span className="font-mono">{fmt(startCoords.lat)}, {fmt(startCoords.lng)}</span>}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-stone-400 mt-0.5"
                    >
                      Seçilmedi
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {startCoords && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    onClick={clearStart}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-5 h-5 rounded-full bg-gray-200/80 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <X size={9} className="text-gray-500" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Connector */}
            <div className="flex justify-center h-2.5 items-center">
              <div className="w-px h-full bg-gray-200" />
            </div>

            {/* Bitiş kutusu */}
            <motion.div
              layout
              animate={{
                background: endCoords ? 'rgba(219,234,254,0.35)' : 'rgba(249,250,251,1)',
                borderColor: endCoords ? 'rgba(147,197,253,0.65)' : step === 'end' ? 'rgba(147,197,253,0.40)' : 'rgba(229,231,235,1)',
              }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 rounded-2xl border px-3.5 py-3"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <motion.div
                animate={{ background: endCoords ? 'rgba(219,234,254,0.8)' : 'rgba(244,241,234,1)' }}
                transition={{ duration: 0.25 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                {endCoords
                  ? <CheckCircle2 size={15} className="text-blue-500" />
                  : <MapPin size={15} className="text-stone-400" />}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Bitiş</p>
                <AnimatePresence mode="wait">
                  {endCoords ? (
                    <motion.p
                      key="val"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      className="text-xs font-semibold text-blue-700 truncate mt-0.5"
                    >
                      {endName ?? <span className="font-mono">{fmt(endCoords.lat)}, {fmt(endCoords.lng)}</span>}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs text-stone-400 mt-0.5"
                    >
                      Seçilmedi
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {endCoords && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    onClick={clearEnd}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-5 h-5 rounded-full bg-gray-200/80 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <X size={9} className="text-gray-500" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Temizle butonu */}
            <AnimatePresence>
              {(startCoords || endCoords) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassBtn
                    onClick={clearAll}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-400 hover:text-red-500 hover:bg-red-50/60 border border-gray-200 hover:border-red-100 rounded-xl px-3 py-2 transition-colors mt-1"
                  >
                    <RotateCcw size={11} />
                    Tüm seçimleri temizle
                  </GlassBtn>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-stone-100 mx-0.5" />

          {/* ─── Rota Tipi — Segmented Control ─── */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-0.5">Rota Tipi</p>
            <div className="flex gap-1.5 bg-stone-100 p-1.5 rounded-2xl">
              {[
                { id: 'photo'   as const, Icon: Camera,  label: 'Fotoğraf' },
                { id: 'tourist' as const, Icon: Landmark, label: 'Turistik' },
              ].map(({ id, Icon, label }) => (
                <motion.button
                  key={id}
                  onClick={() => setSelected(selected === id ? null : id)}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
                    selected === id ? 'text-sage-dark' : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {selected === id && (
                    <motion.div
                      layoutId="segment-bg"
                      className="absolute inset-0 bg-[#78938A]/10 rounded-xl shadow-sm"
                      transition={spring}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <Icon size={12} strokeWidth={2.2} />
                    {label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ─── Rota Sonuçları — 2 Alternatif Kart ─── */}
          <AnimatePresence>
            {hasRoutes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease }}
                className="space-y-2.5 overflow-hidden"
              >
                <div className="border-t border-stone-100 mx-0.5 mb-1 mt-1" />

                <div className="flex items-center justify-between px-0.5 mb-1">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    Haritada Gösterilen Rotalar
                  </p>
                  <motion.button
                    onClick={clearAll}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <RotateCcw size={9} />
                    Sıfırla
                  </motion.button>
                </div>

                {routes.slice(0, 2).map((route, i) => {
                  const meta    = ROUTE_CARD_META[i]
                  const CardIcon = meta.Icon
                  const isActive = activeRouteIndex === i

                  // Comparison badge: only on card 1, vs card 0
                  let compBadge: { extraMin: number; extraM: number; pct: number } | null = null
                  if (i === 1 && routes.length >= 2) {
                    const r0 = routes[0]
                    const extraKm  = route.total_distance_km - r0.total_distance_km
                    const extraMin = route.estimated_minutes  - r0.estimated_minutes
                    const extraM   = Math.round(extraKm * 1000)
                    const pct      = r0.total_distance_km > 0
                      ? Math.round((extraKm / r0.total_distance_km) * 100) : 0
                    compBadge = { extraMin: Math.max(0, extraMin), extraM: Math.max(0, extraM), pct: Math.max(0, pct) }
                  }

                  return (
                    <motion.div
                      key={route.id}
                      initial={{ opacity: 0, y: 14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.08, duration: 0.3, ease }}
                    >
                      <motion.div
                        onClick={() => setActiveRouteIndex(i)}
                        whileHover={!isActive ? { scale: 1.015, y: -1.5 } : {}}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.18, ease }}
                        animate={{
                          boxShadow: isActive
                            ? '0 4px 20px -4px rgba(0,0,0,0.14)'
                            : '0 1px 4px -1px rgba(0,0,0,0.06)',
                        }}
                        className={`relative w-full text-left rounded-2xl border-2 p-3.5 cursor-pointer transition-all duration-200 ${
                          isActive
                            ? `${meta.activeBorder} ${meta.activeBg} ${meta.activeRing}`
                            : `${meta.passiveBorder} ${meta.passiveBg} hover:border-gray-300`
                        }`}
                      >
                        {/* Bookmark butonu — sadece önerilen kart (i===1), absolute sağ üst */}
                        {i === 1 && (
                          <motion.button
                            onClick={handleSaveRecommended}
                            whileHover={!isSaved ? { scale: 1.2 } : {}}
                            whileTap={!isSaved ? { scale: 0.88 } : {}}
                            transition={{ duration: 0.15 }}
                            disabled={saving}
                            title={isSaved ? 'Kaydedildi' : 'Rotayı kaydet'}
                            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer disabled:cursor-default"
                            style={{
                              background: isSaved ? 'rgba(106,130,103,0.18)' : 'rgba(120,147,138,0.12)',
                              color: isSaved ? '#6A8267' : '#879F84',
                            }}
                          >
                            {saving ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : isSaved ? (
                              <BookmarkCheck size={13} strokeWidth={2.5} />
                            ) : (
                              <Bookmark size={13} strokeWidth={2.5} />
                            )}
                          </motion.button>
                        )}

                        {/* Card header */}
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            isActive ? `${meta.iconActiveBg} ${meta.iconActiveColor}` : `${meta.iconPassiveBg} ${meta.iconPassiveColor}`
                          }`}>
                            <CardIcon size={14} strokeWidth={2.2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold leading-tight transition-colors ${isActive ? meta.titleColor : 'text-gray-500'}`}>
                              {meta.title}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{route.label}</p>
                          </div>
                          {/* Active indicator dot — tüm kartlarda */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                            style={{ background: meta.hex }} />
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-lg px-2 py-1 ${
                            isActive ? 'bg-white/70 text-gray-700' : 'bg-white text-gray-500'
                          }`}>
                            <Route size={9} strokeWidth={2} />
                            {route.total_distance_km >= 1
                              ? `${route.total_distance_km.toFixed(1)} km`
                              : `${Math.round(route.total_distance_km * 1000)} m`}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-lg px-2 py-1 ${
                            isActive ? 'bg-white/70 text-gray-700' : 'bg-white text-gray-500'
                          }`}>
                            <Clock size={9} strokeWidth={2} />
                            {route.estimated_minutes} dk
                          </span>
                          {route.places.length > 0 && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-lg px-2 py-1 ${
                              isActive ? 'bg-white/70 text-gray-700' : 'bg-white text-gray-500'
                            }`}>
                              <MapPin size={9} strokeWidth={2} />
                              {route.places.length} durak
                            </span>
                          )}
                        </div>

                        {/* Comparison badge (only card 1) */}
                        {compBadge && (
                          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400">En kısa yola göre:</span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5">
                              {compBadge.extraM >= 1000
                                ? `+${(compBadge.extraM / 1000).toFixed(1)} km`
                                : `+${compBadge.extraM} m`}
                              {' '}·{' '}+{compBadge.extraMin} dk
                            </span>
                          </div>
                        )}

                        {/* Waypoint list (active only) */}
                        <AnimatePresence>
                          {isActive && route.places.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.22, ease }}
                              className="mt-2.5 flex flex-col gap-1 overflow-hidden"
                            >
                              <div className="w-full border-t border-dashed border-gray-200 mb-1.5" />
                              {route.places.map((p, pi) => (
                                <motion.div
                                  key={p.id}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: pi * 0.04, duration: 0.18 }}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                                    style={{ background: '#78938A', fontSize: '9px' }}
                                  >
                                    {p.order}
                                  </div>
                                  <span className="text-[11px] text-gray-600 truncate">{p.name}</span>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hata */}
          <AnimatePresence>
            {routeError && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-red-500 bg-red-50/80 border border-red-100 rounded-xl px-3 py-2.5 leading-relaxed"
              >
                {routeError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── CTA Butonu ─── */}
        <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t border-stone-100">
          <AnimatePresence mode="wait">
            {!hasRoutes ? (
              <motion.div key="calculate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <GlassBtn
                  disabled={!canSubmit || calculating}
                  onClick={handleCalculate}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors duration-300 ${
                    canSubmit && !calculating
                      ? 'bg-sage hover:bg-sage-dark text-white shadow-lg shadow-sage/25 cursor-pointer'
                      : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  {calculating
                    ? <><Loader2 size={15} className="animate-spin" /><span>Hesaplanıyor...</span></>
                    : canSubmit
                      ? <><span>Bana Özel Rota Çiz</span><ArrowRight size={15} /></>
                      : 'Tüm seçimleri tamamlayın'
                  }
                </GlassBtn>
              </motion.div>
            ) : (
              <motion.div key="recalc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-2">
                <p className="text-center text-[10px] text-gray-400 font-medium">
                  Her iki rota haritada gösteriliyor
                </p>
                <GlassBtn
                  onClick={clearAll}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white bg-[#78938A] hover:bg-[#6A8267] transition-colors duration-200 cursor-pointer shadow-sm"
                >
                  <RotateCcw size={13} />
                  Yeniden Başla
                </GlassBtn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </aside>

        {/* ── Sağ Alan — Harita ── */}
        <div className="flex-1 h-full relative z-0">
        <SpotlyMap
          places={places}
          startCoords={startCoords}
          endCoords={endCoords}
          startPlaceId={startPlaceId}
          endPlaceId={endPlaceId}
          routes={routes}
          activeRouteIndex={activeRouteIndex}
          onMapClick={handleMapClick}
          onOutOfZone={handleOutOfZone}
          onSetStart={handleSetStart}
          onSetEnd={handleSetEnd}
        />

        {/* Zone Error Toast */}
        <AnimatePresence>
          {zoneError && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.25, ease }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            >
              <div
                className="flex items-center gap-2.5 text-white text-xs font-semibold px-5 py-3 rounded-2xl border border-white/10 whitespace-nowrap"
                style={{
                  background: 'rgba(17,24,39,0.92)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 20px 40px -8px rgba(0,0,0,0.35)',
                }}
              >
                <span>📍</span>
                <span>Seçilen nokta Spotly hizmet alanı dışında.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Server Error Toast */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.25, ease }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
            >
              <div
                className="flex items-center gap-2.5 text-white text-xs font-semibold px-5 py-3 rounded-2xl border border-red-500/20 whitespace-nowrap"
                style={{
                  background: 'rgba(127,29,29,0.92)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 20px 40px -8px rgba(0,0,0,0.35)',
                }}
              >
                <span>⚠️</span>
                <span>{serverError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>{/* ── Sağ Alan sonu ── */}
      </div>{/* ── Alt İçerik Alanı sonu ── */}

    </div>
  )
}
