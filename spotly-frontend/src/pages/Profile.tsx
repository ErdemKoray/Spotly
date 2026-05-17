import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Mail, Phone, Calendar, MapPin, Route,
  Camera, ArrowRight, Aperture, Pencil,
  Clock, Footprints, Trash2, X,
} from 'lucide-react'
import RoutePreviewMap from '../features/maps/RoutePreviewMap'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import MainLayout from '../components/layout/MainLayout'
import { useAuth } from '../contexts/AuthContext'
import { ImagePickerModal, type PickerTarget } from '../components/image-picker-modal'
import api from '../lib/api'
import type { SavedRoute } from '../types'

/* ─── Default görseller ─── */
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1920&q=80'

function defaultAvatar(first: string, last: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${first}+${last}`)}&background=879F84&color=fff&size=256`
}

/* ─── Demo ekipman ─── */
const GEAR = ['Fujifilm X-T5', '16-80mm f/4', 'DJI Mini 4 Pro', '35mm f/1.4', 'ND Filtre Seti']

/* ─── Animasyon ─── */
const container = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}
const item = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

/* ─── Bento Kart ─── */
function BentoCard({ children, className = '', style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <motion.div variants={item}
      className={`bg-offwhite rounded-2xl border border-stone-100 shadow-sm overflow-hidden ${className}`}
      style={style}>
      {children}
    </motion.div>
  )
}

/* ─── Bilgi Satırı ─── */
function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: string
}) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-stone-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-stone-700 truncate">{value}</p>
      </div>
    </li>
  )
}

/* ─── Glass Edit Button ─── */
function GlassEditBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      aria-label={label}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white
        bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20
        rounded-xl transition-colors duration-150 cursor-pointer"
    >
      <Pencil size={12} strokeWidth={2.5} />
      Düzenle
    </motion.button>
  )
}

/* ══════════════════════════════════════════
   Ana Sayfa
══════════════════════════════════════════ */
export default function Profile() {
  const { user } = useAuth()

  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Kullanıcı'
  const birthStr = user?.birth_date
    ? format(new Date(user.birth_date), 'd MMMM yyyy', { locale: tr })
    : null

  /* ─── Geçmiş rotalar ─── */
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([])
  const [routesLoading, setRoutesLoading] = useState(true)

  useEffect(() => {
    api.get<SavedRoute[]>('/saved-routes')
      .then(({ data }) => setSavedRoutes(data))
      .catch(() => {/* sessizce devam et */})
      .finally(() => setRoutesLoading(false))
  }, [])

  function handleDeleteRoute(id: number) {
    api.delete(`/saved-routes/${id}`)
      .then(() => setSavedRoutes(prev => prev.filter(r => r.id !== id)))
      .catch(() => {/* sessizce devam et */})
  }

  const totalStops = savedRoutes.reduce((sum, r) => sum + r.stop_count, 0)
  const totalKm    = savedRoutes.reduce((sum, r) => sum + r.total_distance_km, 0)

  const STATS = [
    { value: totalStops.toString(),         label: 'Keşfedilen\nNokta',  icon: MapPin  },
    { value: savedRoutes.length.toString(), label: 'Tamamlanan\nRota',    icon: Route   },
    { value: `${totalKm.toFixed(1)} km`,    label: 'Toplam\nMesafe',      icon: Footprints },
  ]

  /* ─── Görsel state'leri ─── */
  const [coverUrl, setCoverUrl] = useState<string>(DEFAULT_COVER)
  const [avatarUrl, setAvatarUrl] = useState<string>(
    defaultAvatar(user?.first_name ?? 'S', user?.last_name ?? 'U')
  )

  /* ─── Rota detay modalı ─── */
  const [selectedRoute, setSelectedRoute] = useState<SavedRoute | null>(null)

  /* ─── Modal state ─── */
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('banner')

  function openPicker(target: PickerTarget) {
    setPickerTarget(target)
    setPickerOpen(true)
  }

  function handleSave(url: string) {
    if (pickerTarget === 'banner') setCoverUrl(url)
    else setAvatarUrl(url)
  }

  /* Mevcut URL'yi modala ilet */
  const currentPickerUrl = pickerTarget === 'banner' ? coverUrl : avatarUrl

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 pt-6">

        {/* ══ HERO ══ */}
        <motion.div variants={item} initial="hidden" animate="visible" className="relative mb-6">

          {/* ── Kapak ── */}
          <div className="relative h-56 sm:h-64 rounded-3xl overflow-hidden group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${coverUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

            {/* Konum rozeti */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Düzenle butonu — hover'da beliriyor */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <GlassEditBtn onClick={() => openPicker('banner')} label="Kapak fotoğrafını düzenle" />
              </motion.div>

              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80
                bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sage-light animate-pulse" />
                İstanbul · Fatih & Beyoğlu
              </span>
            </div>

            {/* İsim overlay */}
            <div className="absolute bottom-5 left-5">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-md">
                {fullName}
              </h1>
              <p className="text-white/60 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* ── Avatar — kapağa overlap ── */}
          <div className="absolute -bottom-6 left-7">
            <div className="relative group/av">
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl object-cover"
              />
              {/* Online rozeti */}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-sage border-2 border-white z-10" />

              {/* Avatar düzenle — hover overlay */}
              <button
                type="button"
                onClick={() => openPicker('avatar')}
                aria-label="Profil fotoğrafını düzenle"
                className="absolute inset-0 rounded-2xl flex items-center justify-center
                  bg-black/0 group-hover/av:bg-black/50 transition-all duration-200 cursor-pointer"
              >
                <span className="opacity-0 group-hover/av:opacity-100 transition-opacity duration-200
                  flex items-center justify-center">
                  <Pencil size={16} strokeWidth={2.5} className="text-white drop-shadow" />
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Avatar boşluğu */}
        <div className="h-8" />

        {/* ══ BENTO GRID ══ */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-12 gap-4"
        >
          {/* 1. Kişisel Bilgiler */}
          <BentoCard className="md:col-span-5 p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-sage/10 flex items-center justify-center">
                <Aperture size={15} className="text-sage-dark" />
              </div>
              <h2 className="text-sm font-semibold text-stone-800">Profil Bilgileri</h2>
            </div>
            <ul className="flex flex-col gap-3.5">
              <InfoRow icon={Mail}     label="E-posta"      value={user?.email ?? '—'} />
              {user?.phone  && <InfoRow icon={Phone}    label="Telefon"      value={user.phone} />}
              {birthStr     && <InfoRow icon={Calendar} label="Doğum Tarihi" value={birthStr} />}
              <InfoRow icon={MapPin} label="Şehir" value="İstanbul, Türkiye" />
            </ul>
          </BentoCard>

          {/* 2. İstatistikler */}
          <BentoCard className="md:col-span-3 p-6 flex flex-col justify-between">
            <h2 className="text-sm font-semibold text-stone-800 mb-5">İstatistikler</h2>
            <div className="flex flex-col gap-4">
              {STATS.map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sage/8 border border-sage/15 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-sage-dark" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-stone-800 leading-none">{value}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5 leading-tight whitespace-pre-line">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* 3. Ekipmanlarım */}
          <BentoCard className="md:col-span-4 p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-sage/10 flex items-center justify-center">
                <Camera size={15} className="text-sage-dark" />
              </div>
              <h2 className="text-sm font-semibold text-stone-800">Ekipmanlarım</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {GEAR.map((gear) => (
                <span key={gear}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                    bg-stone-50 border border-stone-200 text-xs font-medium text-stone-600
                    hover:border-sage/40 hover:bg-sage/5 hover:text-sage-dark
                    transition-colors duration-200 cursor-default">
                  <span className="w-1 h-1 rounded-full bg-sage/60" />
                  {gear}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-stone-300 mt-4 leading-relaxed">
              Ekipman listeni yakında profilinden düzenleyebileceksin.
            </p>
          </BentoCard>

          {/* 4. Geçmiş Rotalarım */}
          <BentoCard className="md:col-span-12 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sage/10 flex items-center justify-center">
                  <Route size={15} className="text-sage-dark" />
                </div>
                <h2 className="text-sm font-semibold text-stone-800">Geçmiş Rotalarım</h2>
              </div>
              {savedRoutes.length > 0 && (
                <Link to="/explore"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sage hover:bg-sage-dark
                    text-white text-xs font-semibold rounded-xl transition-all duration-200
                    hover:-translate-y-0.5 shadow-sm cursor-pointer">
                  Yeni Rota
                  <ArrowRight size={12} strokeWidth={2.5} />
                </Link>
              )}
            </div>

            {routesLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-sage/30 border-t-sage animate-spin" />
              </div>
            ) : savedRoutes.length === 0 ? (
              /* Boş durum */
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex items-center gap-1.5 mb-6">
                  {[
                    'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=80&q=70',
                    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=80&q=70',
                    'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=80&q=70',
                  ].map((src, i) => (
                    <div key={i}
                      className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-md"
                      style={{
                        backgroundImage: `url(${src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transform: `rotate(${[-3, 0, 3][i]}deg)`,
                      }} />
                  ))}
                </div>
                <h3 className="text-base font-semibold text-stone-800 max-w-xs leading-snug mb-2">
                  Kameranı kap, Fatih'in gizemli sokaklarında ilk dramatik fotoğraf rotanı oluştur!
                </h3>
                <p className="text-sm text-stone-400 max-w-sm leading-relaxed mb-6">
                  Galata'nın sisli sabahları, Karaköy'ün neon ışıkları seni bekliyor. Her köşe bir kare.
                </p>
                <Link to="/explore"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-sage hover:bg-sage-dark
                    text-white text-sm font-semibold rounded-xl transition-all duration-200
                    hover:-translate-y-0.5 shadow-md hover:shadow-sage/30 cursor-pointer">
                  Rota Oluştur
                  <ArrowRight size={15} strokeWidth={2.5} />
                </Link>
              </div>
            ) : (
              /* Rota kartları */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedRoutes.map((route) => (
                  <motion.div
                    key={route.id}
                    variants={item}
                    onClick={() => setSelectedRoute(route)}
                    className="group relative flex flex-col gap-3 p-4 rounded-2xl border border-stone-100
                      bg-stone-50/60 hover:bg-white hover:border-sage/25 hover:shadow-md
                      transition-all duration-200 cursor-pointer"
                  >
                    {/* Tip rozeti + silme */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide
                        px-2.5 py-1 rounded-full ${
                          route.route_type === 'photo'
                            ? 'bg-violet-50 text-violet-600 border border-violet-100'
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                        {route.route_type === 'photo' ? '📸 Fotoğraf' : '🏛 Turistik'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRoute(route.id) }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center
                          justify-center text-stone-300 hover:text-red-400 hover:bg-red-50
                          transition-all duration-150 cursor-pointer"
                        aria-label="Rotayı sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Başlangıç → Bitiş */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium truncate">
                        <span className="w-2 h-2 rounded-full bg-sage flex-shrink-0" />
                        <span className="truncate">{route.start_name ?? `${route.start_lat.toFixed(4)}, ${route.start_lng.toFixed(4)}`}</span>
                      </div>
                      <div className="ml-[3.5px] w-px h-3 bg-stone-200" />
                      <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium truncate">
                        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="truncate">{route.end_name ?? `${route.end_lat.toFixed(4)}, ${route.end_lng.toFixed(4)}`}</span>
                      </div>
                    </div>

                    {/* İstatistikler */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                        bg-white border border-stone-100 rounded-lg px-2 py-1 text-stone-600">
                        <Route size={9} strokeWidth={2} />
                        {route.total_distance_km >= 1
                          ? `${route.total_distance_km.toFixed(1)} km`
                          : `${Math.round(route.total_distance_km * 1000)} m`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                        bg-white border border-stone-100 rounded-lg px-2 py-1 text-stone-600">
                        <Clock size={9} strokeWidth={2} />
                        {route.estimated_minutes} dk
                      </span>
                      {route.stop_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                          bg-white border border-stone-100 rounded-lg px-2 py-1 text-stone-600">
                          <MapPin size={9} strokeWidth={2} />
                          {route.stop_count} durak
                        </span>
                      )}
                    </div>

                    {/* Tarih */}
                    <p className="text-[10px] text-stone-300 mt-auto">
                      {format(new Date(route.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </BentoCard>
        </motion.div>
      </div>

      {/* ══ Görsel Seçici Modal ══ */}
      <ImagePickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        target={pickerTarget}
        currentUrl={currentPickerUrl}
        onSave={handleSave}
      />

      {/* ══ Rota Detay Modalı ══ */}
      <AnimatePresence>
        {selectedRoute && (
          <motion.div
            key="route-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
            onClick={() => setSelectedRoute(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-[95vw] max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
              style={{ height: '68vh' }}
            >
              {/* Kapat */}
              <button
                onClick={() => setSelectedRoute(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-white transition-all duration-150 cursor-pointer shadow-md"
                aria-label="Kapat"
              >
                <X size={16} strokeWidth={2} />
              </button>

              {/* ── Sol: Harita (65%) ── */}
              <div className="md:w-[65%] h-64 md:h-full bg-stone-100 shrink-0">
                <RoutePreviewMap
                  startLat={selectedRoute.start_lat}
                  startLng={selectedRoute.start_lng}
                  endLat={selectedRoute.end_lat}
                  endLng={selectedRoute.end_lng}
                />
              </div>

              {/* ── Sağ: Bilgi Paneli (35%) ── */}
              <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto border-l border-stone-100">

                {/* Başlık + Tip rozeti */}
                <div className="pr-8">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-2 ${
                    selectedRoute.route_type === 'photo'
                      ? 'bg-violet-50 text-violet-600 border border-violet-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {selectedRoute.route_type === 'photo' ? '📸 Fotoğraf' : '🏛 Turistik'}
                  </span>
                  <h3 className="text-base font-bold text-stone-800 leading-snug">{selectedRoute.label}</h3>
                  {selectedRoute.description && (
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">{selectedRoute.description}</p>
                  )}
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      Icon: Route,
                      label: 'Mesafe',
                      value: selectedRoute.total_distance_km >= 1
                        ? `${selectedRoute.total_distance_km.toFixed(1)} km`
                        : `${Math.round(selectedRoute.total_distance_km * 1000)} m`,
                    },
                    { Icon: Clock,  label: 'Süre',  value: `${selectedRoute.estimated_minutes} dk` },
                    { Icon: MapPin, label: 'Durak', value: `${selectedRoute.stop_count}` },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-stone-50 border border-stone-100">
                      <div className="w-8 h-8 rounded-xl bg-[#78938A]/10 flex items-center justify-center">
                        <Icon size={14} className="text-[#78938A]" />
                      </div>
                      <p className="text-xl font-bold text-stone-800 leading-none">{value}</p>
                      <p className="text-[10px] text-stone-400 font-medium">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Güzergah */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Güzergah</p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-[#78938A] shrink-0 ring-2 ring-[#78938A]/20" />
                      <p className="text-sm text-stone-700 font-medium truncate">
                        {selectedRoute.start_name ?? `${selectedRoute.start_lat.toFixed(4)}, ${selectedRoute.start_lng.toFixed(4)}`}
                      </p>
                    </div>
                    <div className="ml-[5px] w-px h-4 bg-stone-200" />
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-blue-400 shrink-0 ring-2 ring-blue-400/20" />
                      <p className="text-sm text-stone-700 font-medium truncate">
                        {selectedRoute.end_name ?? `${selectedRoute.end_lat.toFixed(4)}, ${selectedRoute.end_lng.toFixed(4)}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tarih */}
                <p className="text-[11px] text-stone-300 mt-auto pt-2 border-t border-stone-100">
                  {format(new Date(selectedRoute.created_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  )
}
