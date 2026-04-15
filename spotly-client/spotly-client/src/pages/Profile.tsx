import { THEME_COLORS } from '../constants';

interface ProfileProps {
  userName: string;
  onLogout: () => void;
  onNavigate: (view: 'map') => void;
}

// İsmin baş harflerini bulan yardımcı fonksiyon (Örn: "Koray Erdem" -> "KE")
const getInitials = (name: string) => {
  if (!name) return "U";
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export default function Profile({ userName, onLogout, onNavigate }: ProfileProps) {
  const initials = getInitials(userName);

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', background: `linear-gradient(180deg, ${THEME_COLORS.sageBg} 0%, ${THEME_COLORS.white} 100%)` }}>
      
      <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: `1px solid ${THEME_COLORS.border}`, textAlign: 'center' }}>
        
        {/* BÜYÜK AVATAR */}
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: THEME_COLORS.sageLight, color: THEME_COLORS.sageDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '800', margin: '0 auto 20px auto', border: `4px solid white`, boxShadow: '0 8px 16px rgba(126, 161, 130, 0.2)' }}>
          {initials}
        </div>

        <h2 style={{ fontSize: '24px', color: THEME_COLORS.textDark, margin: '0 0 5px 0', fontWeight: '800' }}>{userName}</h2>
        <p style={{ color: THEME_COLORS.textMuted, fontSize: '14px', margin: '0 0 30px 0' }}>Maceracı • Yeni Üye</p>

        {/* BİLGİ KARTLARI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px', textAlign: 'left' }}>
          <div style={{ padding: '16px', backgroundColor: THEME_COLORS.sageBg, borderRadius: '12px', border: `1px solid ${THEME_COLORS.border}` }}>
            <small style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: THEME_COLORS.textMuted, marginBottom: '4px' }}>HESAP DURUMU</small>
            <span style={{ fontSize: '14px', color: THEME_COLORS.textDark, fontWeight: '600' }}>Aktif</span>
          </div>
          <div style={{ padding: '16px', backgroundColor: THEME_COLORS.sageBg, borderRadius: '12px', border: `1px solid ${THEME_COLORS.border}` }}>
            <small style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: THEME_COLORS.textMuted, marginBottom: '4px' }}>KAYITLI ROTALAR</small>
            <span style={{ fontSize: '14px', color: THEME_COLORS.textDark, fontWeight: '600' }}>Henüz rota kaydedilmedi.</span>
          </div>
        </div>

        {/* AKSİYON BUTONLARI */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => onNavigate('map')}
            style={{ flex: 1, padding: '14px', backgroundColor: THEME_COLORS.sageDark, color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(95, 126, 100, 0.25)', transition: '0.2s' }}>
            Haritaya Dön
          </button>
          <button 
            onClick={onLogout}
            style={{ padding: '14px 24px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>
            Çıkış Yap
          </button>
        </div>

      </div>
    </div>
  );
}