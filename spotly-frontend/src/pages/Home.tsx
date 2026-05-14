import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map, Route, Camera, Landmark, ArrowRight } from 'lucide-react'
import { AnimatedHero } from '@/components/ui/animated-hero-section-1'
import { Button } from '@/components/ui/button'
import Footer from '../components/layout/Footer'
import { useAuth } from '../contexts/AuthContext'

/* ─── İstanbul Fotoğrafı — Galata/Boğaz panoraması ─── */
const BG_URL =
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1920&q=85'

/* ─── Feature kartları ─── */
const features = [
  {
    icon: Route,
    title: 'Sana Özel Rotalar',
    desc: 'Yapay zeka, hedeflerine ve zevklerine göre en verimli rotayı saniyeler içinde hesaplar.',
    accent: 'bg-sage/10 text-sage-dark',
    border: 'hover:border-sage/30',
  },
  {
    icon: Camera,
    title: 'Gizli Fotoğraf Noktaları',
    desc: "Turistlerin gözden kaçırdığı, ışığı ve açısı mükemmel estetik köşeleri bir bir keşfet.",
    accent: 'bg-violet-50 text-violet-600',
    border: 'hover:border-violet-200',
  },
  {
    icon: Landmark,
    title: 'Tarihi Dokular',
    desc: "İstanbul'un yüzyıllık kültürel mirasını sokak sokak, katman katman hissederek geç.",
    accent: 'bg-amber-50 text-amber-600',
    border: 'hover:border-amber-200',
  },
]

function fadeUpView(delay = 0) {
  return {
    initial:     { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport:    { once: true, margin: '-60px' },
    transition:  { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const, delay },
  }
}

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  /* Sağ üst köşe için auth-aware aksiyon */
  const topRightAction = user ? (
    <div className="flex items-center gap-2">
      <Link to="/explore">
        <Button
          size="sm"
          className="bg-sage hover:bg-sage-dark text-white border-0 transition-colors"
        >
          Haritaya Git
        </Button>
      </Link>
      <button
        onClick={logout}
        className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
      >
        Çıkış
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link to="/auth">
        <button className="px-3.5 py-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors">
          Giriş Yap
        </button>
      </Link>
      <Link to="/auth?mode=register">
        <Button
          size="sm"
          className="bg-white/10 backdrop-blur-sm border border-white/25 text-white hover:bg-white/20 transition-colors"
        >
          Kaydol
        </Button>
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-offwhite">

      {/* ══ AnimatedHero ══ */}
      <AnimatedHero
        backgroundImageUrl={BG_URL}
        logo={
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Map size={20} strokeWidth={2.5} />
            <span>Spotly</span>
          </div>
        }
        navLinks={[
          { label: 'Nasıl Çalışır?', href: '#features' },
          { label: 'Keşfet',         href: '/explore'   },
        ]}
        topRightAction={topRightAction}
        title="İstanbul'u Kendi Rotanla Keşfet"
        description="En iyi fotoğraf noktalarını bul, tarihi sokaklarda kaybol ve kendi maceranı yarat."
        ctaButton={{
          text:    'Keşfetmeye Başla',
          onClick: () => navigate('/explore'),
        }}
        secondaryCta={{
          text:    'Rotaları Gör',
          onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }),
        }}
      />

      {/* ══ Feature Grid ══ */}
      <section id="features" className="py-28 bg-offwhite">
        <div className="max-w-5xl mx-auto px-6">

          <motion.div {...fadeUpView(0)} className="text-center mb-16">
            <p className="text-xs font-bold text-sage-dark uppercase tracking-widest mb-3">
              Özellikler
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 tracking-tight leading-tight">
              Her şey senin için tasarlandı
            </h2>
            <p className="mt-4 text-base text-stone-500 max-w-md mx-auto leading-relaxed">
              Tek bir tıklamayla üç farklı rota seçeneği — hız, keşif veya tam deneyim.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  {...fadeUpView(i * 0.1)}
                  whileHover={{ y: -5, boxShadow: '0 16px 40px -8px rgba(0,0,0,0.10)' }}
                  transition={{ duration: 0.22 }}
                  className={`bg-white border border-gray-100 ${f.border} rounded-2xl p-7 flex flex-col gap-5 cursor-default transition-colors`}
                  style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)' }}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.accent}`}>
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-semibold text-stone-800">{f.title}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ CTA Band ══ */}
      <section className="py-24 bg-stone-900">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div {...fadeUpView(0)} className="flex flex-col items-center gap-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Hemen başlamaya hazır mısın?
            </h2>
            <p className="text-stone-400 text-base leading-relaxed max-w-sm">
              Ücretsiz hesap oluştur, ilk rotanı dakikalar içinde planla.
            </p>
            <motion.div
              whileHover={{ y: -3, boxShadow: '0 20px 40px -8px rgba(135,159,132,0.5)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl"
            >
              <Link
                to="/auth?mode=register"
                className="flex items-center gap-2.5 px-8 py-3.5 bg-sage hover:bg-sage-dark text-white font-semibold text-sm rounded-xl transition-colors duration-200"
              >
                Ücretsiz Kaydol
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══ Footer ══ */}
      <Footer />
    </div>
  )
}
