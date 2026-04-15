import { THEME_COLORS } from '../constants';

export default function Home({ onNavigate }: { onNavigate: (view: 'map') => void }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', background: `linear-gradient(180deg, ${THEME_COLORS.sageBg} 0%, ${THEME_COLORS.white} 100%)` }}>
      <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '80px', marginTop: '40px' }}>
        <div style={{ display: 'inline-block', padding: '8px 16px', backgroundColor: THEME_COLORS.sageLight, color: THEME_COLORS.sageDark, borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', marginBottom: '20px' }}>YAPAY ZEKA DESTEKLİ</div>
        <h1 style={{ fontSize: '56px', fontWeight: '800', color: THEME_COLORS.textDark, margin: '0 0 20px 0', lineHeight: '1.2' }}>Şehrini Keşfet,<br/><span style={{ color: THEME_COLORS.sagePrimary }}>Rotanı Sen Belirle.</span></h1>
        <p style={{ fontSize: '18px', color: THEME_COLORS.textMuted, lineHeight: '1.6', marginBottom: '40px', padding: '0 20px' }}>Spotly, kişisel zevklerine ve karakterine en uygun rotaları yapay zeka ile saniyeler içinde çizen akıllı bir şehir planlama asistanıdır.</p>
        <button onClick={() => onNavigate('map')} style={{ backgroundColor: THEME_COLORS.sageDark, color: 'white', border: 'none', padding: '16px 40px', borderRadius: '30px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 20px rgba(95, 126, 100, 0.3)', transition: 'transform 0.2s' }}>
          Haritayı Aç ve Keşfet 🚀
        </button>
      </div>

      <div style={{ maxWidth: '1000px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '28px', color: THEME_COLORS.textDark, marginBottom: '50px', fontWeight: '800' }}>Nasıl Çalışır?</h2>
        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', backgroundColor: 'white', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', textAlign: 'center', border: `1px solid ${THEME_COLORS.border}` }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>📍</div>
            <h3 style={{ fontSize: '18px', color: THEME_COLORS.textDark, marginBottom: '12px' }}>1. Konumunu Seç</h3>
            <p style={{ fontSize: '14px', color: THEME_COLORS.textMuted, lineHeight: '1.6' }}>Harita üzerinden başlangıç ve varmak istediğin hedef noktayı tıkla ve belirle.</p>
          </div>
          <div style={{ flex: '1 1 280px', backgroundColor: 'white', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', textAlign: 'center', border: `1px solid ${THEME_COLORS.border}` }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🎛️</div>
            <h3 style={{ fontSize: '18px', color: THEME_COLORS.textDark, marginBottom: '12px' }}>2. Karakterini Yansıt</h3>
            <p style={{ fontSize: '14px', color: THEME_COLORS.textMuted, lineHeight: '1.6' }}>Manzara, Gurme veya Tarih! Yapay zeka çubuklarını kaydırarak güncel modunu ayarla.</p>
          </div>
          <div style={{ flex: '1 1 280px', backgroundColor: 'white', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', textAlign: 'center', border: `1px solid ${THEME_COLORS.border}` }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>✨</div>
            <h3 style={{ fontSize: '18px', color: THEME_COLORS.textDark, marginBottom: '12px' }}>3. Rotayı Çiz</h3>
            <p style={{ fontSize: '14px', color: THEME_COLORS.textMuted, lineHeight: '1.6' }}>Rota Öner butonuna bas ve Spotly'nin sana özel sunduğu kusursuz mekanları keşfet.</p>
          </div>
        </div>
      </div>
      <div style={{ height: '80px' }}></div>
    </div>
  );
}