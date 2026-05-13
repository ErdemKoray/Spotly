import { Link } from 'react-router-dom';
import { THEME_COLORS } from '../constants';

export default function Home() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', background: `linear-gradient(180deg, ${THEME_COLORS.sageBg} 0%, ${THEME_COLORS.white} 100%)` }}>
      <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '80px', marginTop: '40px' }}>
        <div style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: THEME_COLORS.sageLight, color: THEME_COLORS.sageDark, borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', marginBottom: '20px' }}>YAPAY ZEKA DESTEKLİ</div>
        <h1 style={{ fontSize: '56px', fontWeight: '800', color: THEME_COLORS.textDark, margin: '0 0 20px 0', lineHeight: '1.2' }}>Şehrini Keşfet,<br/><span style={{ color: THEME_COLORS.sagePrimary }}>Rotanı Sen Belirle.</span></h1>
        <p style={{ fontSize: '18px', color: THEME_COLORS.textMuted, lineHeight: '1.6', marginBottom: '40px', padding: '0 20px' }}>Spotly, kişisel zevklerine ve karakterine en uygun rotaları yapay zeka ile saniyeler içinde çizen akıllı bir şehir planlama asistanıdır.</p>
        <Link
          to="/map"
          style={{ display: 'inline-block', backgroundColor: THEME_COLORS.sageDark, color: 'white', textDecoration: 'none', padding: '16px 40px', borderRadius: '30px', fontSize: '16px', fontWeight: '700', boxShadow: '0 8px 20px rgba(95, 126, 100, 0.3)' }}
        >
          Haritayı Aç ve Keşfet 🚀
        </Link>
      </div>

      <div style={{ maxWidth: '1000px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '28px', color: THEME_COLORS.textDark, marginBottom: '50px', fontWeight: '800' }}>Nasıl Çalışır?</h2>
        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: '📍', title: '1. Konumunu Seç', desc: 'Harita üzerinden başlangıç ve varmak istediğin hedef noktayı tıkla ve belirle.' },
            { icon: '🎛️', title: '2. Karakterini Yansıt', desc: 'Manzara, Gurme veya Tarih! Yapay zeka çubuklarını kaydırarak güncel modunu ayarla.' },
            { icon: '✨', title: '3. Rotayı Çiz', desc: "Rota Öner butonuna bas ve Spotly'nin sana özel sunduğu kusursuz mekanları keşfet." },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ flex: '1 1 280px', backgroundColor: 'white', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', textAlign: 'center', border: `1px solid ${THEME_COLORS.border}` }}>
              <div style={{ fontSize: '40px', marginBottom: '20px' }}>{icon}</div>
              <h3 style={{ fontSize: '18px', color: THEME_COLORS.textDark, marginBottom: '12px' }}>{title}</h3>
              <p style={{ fontSize: '14px', color: THEME_COLORS.textMuted, lineHeight: '1.6' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: '80px' }} />
    </div>
  );
}
