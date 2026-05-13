import { Link } from 'react-router-dom'
import { SlidersHorizontal, Cpu, Navigation } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'

const steps = [
  {
    icon: <SlidersHorizontal size={22} strokeWidth={1.8} />,
    title: 'Tercihlerini Seç',
    desc: 'Fotoğraf, gurme veya turistik deneyim — ne istediğini ağırlıklarla belirt.',
  },
  {
    icon: <Cpu size={22} strokeWidth={1.8} />,
    title: 'Yapay Zeka Hesaplasın',
    desc: 'Algoritmamız binlerce mekan arasından sana özel en iyi rotayı oluşturur.',
  },
  {
    icon: <Navigation size={22} strokeWidth={1.8} />,
    title: 'Rotanı Takip Et',
    desc: 'Adım adım yönlendirmeyle İstanbul\'un kalbini keşfetmeye başla.',
  },
]

export default function Home() {
  return (
    <MainLayout>
      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden">
        {/* Arka plan görseli */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1800&q=80"
            alt="İstanbul silueti"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/50 to-transparent" />
        </div>

        {/* İçerik */}
        <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage-light bg-sage/20 border border-sage/30 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-sage-light animate-pulse" />
              Yapay Zeka Destekli
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
              İstanbul'un Kalbinde<br />
              <span className="text-sage-light">Kendi Rotanı Çiz.</span>
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              Zevklerine göre optimize edilmiş, yapay zeka destekli akıllı gezi planlayıcı.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/explore"
                className="px-6 py-3 bg-sage hover:bg-sage-light text-white font-medium rounded-xl transition shadow-lg shadow-sage/30"
              >
                Rotanı Planla
              </Link>
              <a
                href="#how-it-works"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition backdrop-blur-sm"
              >
                Nasıl Çalışır?
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Nasıl Çalışır ── */}
      <section id="how-it-works" className="py-24 bg-offwhite">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-sage-dark uppercase tracking-widest mb-3">Nasıl Çalışır?</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 tracking-tight">
              Üç adımda mükemmel gezi
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-sage/15 p-8 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-sage/10 text-sage-dark flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <span className="text-xs font-semibold text-sage uppercase tracking-widest">
                    Adım {i + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-stone-800 mt-1 mb-2">{step.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-sage-dark">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Hemen başlamaya hazır mısın?
          </h2>
          <p className="text-sage-light mb-8">
            Ücretsiz hesap oluştur, ilk rotanı dakikalar içinde planla.
          </p>
          <Link
            to="/auth?mode=register"
            className="inline-block px-8 py-3.5 bg-offwhite text-sage-dark font-semibold rounded-xl hover:bg-white transition shadow-lg shadow-black/10"
          >
            Ücretsiz Kaydol
          </Link>
        </div>
      </section>
    </MainLayout>
  )
}
