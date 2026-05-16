import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Landmark, ArrowRight, Navigation, MapPin, X,
  CheckCircle2, Zap, Scale, Star, RotateCcw, Loader2,
  Map, LogOut, ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import SpotlyMap from '../features/maps/SpotlyMap'
import type { Place, Coords, RouteOption } from '../types'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

type RouteType = 'photo' | 'tourist' | null

const TIER_META: Record<
  'A' | 'B' | 'C',
  { icon: typeof Zap; color: string; bg: string; border: string; ring: string; hex: string }
> = {
  A: { icon: Zap,   color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  ring: 'ring-amber-100',  hex: '#d97706' },
  B: { icon: Scale, color: 'text-sage-dark',  bg: 'bg-sage/10',   border: 'border-sage/40',    ring: 'ring-sage/20',    hex: '#6A8267' },
  C: { icon: Star,  color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-100', hex: '#7c3aed' },
}

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
  const [routes, setRoutes]                   = useState<RouteOption[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState<'A' | 'B' | 'C' | null>(null)
  const [calculating, setCalculating]         = useState(false)
  const [routeError, setRouteError]           = useState<string | null>(null)
  const [baselineDistKm, setBaselineDistKm]   = useState<number | null>(null)
  const zoneTimer                             = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api.get<Place[]>('/places').then(({ data }) => setPlaces(data))
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
    if (routes.length) { setRoutes([]); setSelectedRouteId(null) }
  }
  function clearEnd() {
    setEndCoords(null); setEndPlaceId(null); setEndName(null)
    if (routes.length) { setRoutes([]); setSelectedRouteId(null) }
  }
  function clearAll() {
    setStartCoords(null); setStartPlaceId(null); setStartName(null)
    setEndCoords(null);   setEndPlaceId(null);   setEndName(null)
    setRoutes([]);        setSelectedRouteId(null); setRouteError(null)
  }

  async function handleCalculate() {
    if (!startCoords || !endCoords || !selected) return
    setCalculating(true); setRouteError(null); setRoutes([]); setSelectedRouteId(null)
    try {
      const { data } = await api.post('/routes/calculate', {
        start_lat: startCoords.lat, start_lng: startCoords.lng,
        end_lat:   endCoords.lat,   end_lng:   endCoords.lng,
        route_type: selected,
      })
      setRoutes(data.routes)
      if (data.routes.length > 0) setSelectedRouteId(data.routes[0].id)
    } catch {
      setRouteError('Rota hesaplanamadı. Lütfen tekrar deneyin.')
    } finally {
      setCalculating(false)
    }
  }

  const step        = !startCoords ? 'start' : !endCoords ? 'end' : 'done'
  const canSubmit   = !!(selected && startCoords && endCoords)
  const hasRoutes   = routes.length > 0
  const activeRoute = routes.find(r => r.id === selectedRouteId) ?? null

  const panelTitle = hasRoutes ? 'Rotanı seç' : step !== 'done' ? 'Noktaları belirle' : 'Rota tipini seç'

  /* ─── shared spring ─── */
  const spring = { type: 'spring', stiffness: 380, damping: 30 } as const

  return (
    <div className="fixed inset-0 overflow-hidden">

      {/* ══ Harita ══ */}
      <div className="absolute inset-0 z-0">
        <SpotlyMap />
      </div>

      {/* ══ Floating Top Bar ══ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="absolute top-4 left-4 right-4 z-[1100] flex items-center justify-between pointer-events-none"
      >
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
          <Link
            to="/"
            className="pointer-events-auto flex items-center gap-2.5 bg-white/90 backdrop-blur-xl shadow-lg shadow-black/10 border border-white/70 rounded-2xl px-4 py-2.5 text-sage-dark font-bold text-sm tracking-tight"
          >
            <Map size={16} strokeWidth={2.5} />
            Spotly
          </Link>
        </motion.div>

        {/* User pill */}
        {user && (
          <div className="pointer-events-auto flex items-center gap-1 bg-white/90 backdrop-blur-xl shadow-lg shadow-black/10 border border-white/70 rounded-2xl px-2 py-1.5">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
              <Link to="/profile" title={`${user.first_name} ${user.last_name}`}>
                <img
                  src={avatarUrl(user.first_name, user.last_name)}
                  alt="Profil"
                  className="w-8 h-8 rounded-xl border-2 border-transparent hover:border-sage object-cover transition-colors"
                />
              </Link>
            </motion.div>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <motion.button
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-700 hover:bg-sage/10 rounded-xl transition-colors"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Çıkış</span>
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* ══ Floating Sol Panel ══ */}
      <motion.aside
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        className="absolute top-20 left-4 bottom-4 z-[1000] w-80 flex flex-col rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.6) inset',
        }}
      >
        {/* Panel header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-gray-100/60">
          <div className="flex items-center gap-1.5 text-sage-dark text-[10px] font-bold uppercase tracking-widest mb-2">
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
              className="text-base font-bold text-stone-800 leading-snug"
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
                      ? 'bg-emerald-50/80 border-emerald-100 text-emerald-700'
                      : 'bg-blue-50/80 border-blue-100 text-blue-700'
                  }`}
                >
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${step === 'start' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${step === 'start' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  </span>
                  {step === 'start' ? 'Başlangıç noktasını seç' : 'Bitiş noktasını seç'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Başlangıç kutusu */}
            <motion.div
              layout
              animate={{
                background: startCoords ? 'rgba(209,250,229,0.5)' : step === 'start' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                borderColor: startCoords ? 'rgba(110,231,183,0.7)' : step === 'start' ? 'rgba(135,159,132,0.4)' : 'rgba(229,231,235,0.8)',
              }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 rounded-2xl border px-3.5 py-3"
              style={{ boxShadow: step === 'start' && !startCoords ? '0 0 0 2px rgba(135,159,132,0.15)' : undefined }}
            >
              <motion.div
                animate={{ background: startCoords ? 'rgba(209,250,229,1)' : 'rgba(243,244,246,1)' }}
                transition={{ duration: 0.25 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                {startCoords
                  ? <CheckCircle2 size={15} className="text-emerald-500" />
                  : <MapPin size={15} className="text-gray-400" />}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Başlangıç</p>
                <AnimatePresence mode="wait">
                  {startCoords ? (
                    <motion.p
                      key="val"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      className="text-xs font-semibold text-emerald-700 truncate mt-0.5"
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
                      className="text-xs text-gray-300 mt-0.5"
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
                background: endCoords ? 'rgba(219,234,254,0.5)' : step === 'end' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                borderColor: endCoords ? 'rgba(147,197,253,0.7)' : step === 'end' ? 'rgba(147,197,253,0.4)' : 'rgba(229,231,235,0.8)',
              }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 rounded-2xl border px-3.5 py-3"
            >
              <motion.div
                animate={{ background: endCoords ? 'rgba(219,234,254,1)' : 'rgba(243,244,246,1)' }}
                transition={{ duration: 0.25 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                {endCoords
                  ? <CheckCircle2 size={15} className="text-blue-500" />
                  : <MapPin size={15} className="text-gray-300" />}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bitiş</p>
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
                      className="text-xs text-gray-300 mt-0.5"
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
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50/80 border border-gray-100 hover:border-red-100 rounded-xl px-3 py-2 transition-colors mt-1"
                  >
                    <RotateCcw size={11} />
                    Tüm seçimleri temizle
                  </GlassBtn>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-gray-100/60 mx-0.5" />

          {/* ─── Rota Tipi — Segmented Control ─── */}
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-0.5">Rota Tipi</p>
            <div className="flex gap-1.5 bg-gray-100/60 p-1.5 rounded-2xl">
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
                    selected === id ? 'text-sage-dark' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {selected === id && (
                    <motion.div
                      layoutId="segment-bg"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm"
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

          {/* ─── Rota Sonuçları ─── */}
          <AnimatePresence>
            {hasRoutes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease }}
                className="space-y-2 overflow-hidden"
              >
                <div className="border-t border-gray-100/60 mx-0.5 mb-3 mt-1" />

                <div className="flex items-center justify-between px-0.5">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    Hesaplanan Rotalar
                  </p>
                  <motion.button
                    onClick={clearAll}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-sage-dark transition-colors"
                  >
                    <RotateCcw size={9} />
                    Sıfırla
                  </motion.button>
                </div>

                {routes.map((route, i) => {
                  const meta     = TIER_META[route.id]
                  const TierIcon = meta.icon
                  const isActive = selectedRouteId === route.id

                  let extraBadge: string | null = null
                  if (baselineDistKm != null) {
                    const extraM = Math.max(0, Math.round((route.total_distance_km - baselineDistKm) * 1000))
                    extraBadge = extraM < 50 ? 'En kısa yol'
                      : extraM < 1000 ? `+${extraM} m` : `+${(extraM / 1000).toFixed(1)} km`
                  }

                  return (
                    <motion.div
                      key={route.id}
                      initial={{ opacity: 0, y: 14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.07, duration: 0.3, ease }}
                    >
                      <motion.button
                        onClick={() => setSelectedRouteId(route.id)}
                        whileHover={!isActive ? { scale: 1.015, y: -1.5, boxShadow: '0 8px 25px -4px rgba(0,0,0,0.12)' } : {}}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.18, ease }}
                        animate={{
                          boxShadow: isActive
                            ? '0 4px 20px -4px rgba(0,0,0,0.12)'
                            : '0 1px 4px -1px rgba(0,0,0,0.06)',
                        }}
                        className={`w-full text-left rounded-2xl border p-3.5 cursor-pointer transition-colors duration-200 ${
                          isActive
                            ? `${meta.bg} ${meta.border} ring-1 ${meta.ring}`
                            : 'bg-white/70 border-gray-100/80 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? `${meta.bg} ${meta.color}` : 'bg-gray-100 text-gray-400'}`}>
                            <TierIcon size={13} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 leading-tight">{route.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{route.description}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100/80 rounded-full px-2 py-0.5">📍 {route.places.length} durak</span>
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100/80 rounded-full px-2 py-0.5">🗺 {route.total_distance_km.toFixed(1)} km</span>
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100/80 rounded-full px-2 py-0.5">⏱ {route.estimated_minutes} dk</span>
                              {extraBadge && (
                                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                                  extraBadge === 'En kısa yol'
                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                                    : 'text-orange-600 bg-orange-50 border border-orange-100'
                                }`}>
                                  {extraBadge === 'En kısa yol' ? '✓ En kısa' : `${extraBadge} fazla`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${isActive ? meta.border : 'border-gray-200'}`}>
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: meta.hex }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Durak listesi */}
                        <AnimatePresence>
                          {isActive && route.places.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.22, ease }}
                              className="mt-2.5 ml-9 flex flex-col gap-1.5 overflow-hidden"
                            >
                              {route.places.map((p, pi) => (
                                <motion.div
                                  key={p.id}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: pi * 0.05, duration: 0.2 }}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                                    style={{ background: meta.hex, fontSize: '9px' }}
                                  >
                                    {p.order}
                                  </div>
                                  <span className="text-[11px] text-gray-600 truncate">{p.name}</span>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
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
        <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t border-gray-100/60">
          <AnimatePresence mode="wait">
            {!hasRoutes ? (
              <motion.div key="calculate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <GlassBtn
                  disabled={!canSubmit || calculating}
                  onClick={handleCalculate}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors duration-300 ${
                    canSubmit && !calculating
                      ? 'bg-sage hover:bg-sage-dark text-white shadow-lg shadow-sage/25 cursor-pointer'
                      : 'bg-stone-100 text-stone-300 cursor-not-allowed'
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
              <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <GlassBtn
                  disabled={!selectedRouteId}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-colors duration-300 ${
                    selectedRouteId
                      ? 'bg-sage hover:bg-sage-dark text-white shadow-lg shadow-sage/25 cursor-pointer'
                      : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                  }`}
                >
                  <span>Rotayı Haritada Göster</span>
                  <ChevronRight size={15} />
                </GlassBtn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* ══ Zone Error Toast ══ */}
      <AnimatePresence>
        {zoneError && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.25, ease }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none"
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

    </div>
  )
}
