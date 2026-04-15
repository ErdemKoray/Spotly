import { useState, useEffect } from 'react';
import { THEME_COLORS, API_BASE_URL } from '../constants';

export default function Auth({ initialMode, onLoginSuccess }: { initialMode: 'login' | 'register', onLoginSuccess: (name: string) => void }) {
  const [isLoginView, setIsLoginView] = useState(initialMode === 'login');
  const [isLoading, setIsLoading] = useState(false);

  // --- KAYIT OL FORMU STATE'LERİ ---
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // --- GİRİŞ YAP FORMU STATE'LERİ ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Şifre eşleşme kontrolü
  const isPasswordError = regConfirm.length > 0 && regPassword !== regConfirm;

  // Navbar'dan tıklanan butona göre vagonu kaydırır
  useEffect(() => {
    setIsLoginView(initialMode === 'login');
  }, [initialMode]);

  // GERÇEK GİRİŞ YAP İŞLEMİ
  const handleLogin = async (e: any) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return alert("Lütfen tüm alanları doldurun.");
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setIsLoading(false);
        onLoginSuccess(data.name); 
      } else {
        setIsLoading(false);
        alert("Hata: " + data.message); 
      }
    } catch (error) {
      setIsLoading(false);
      alert("Sunucuya bağlanılamadı. .NET API'nin 5094 portunda çalıştığından emin olun.");
    }
  };

  // GERÇEK KAYIT OL İŞLEMİ
  const handleRegister = async (e: any) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || isPasswordError) return alert("Lütfen formdaki hataları giderin.");
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: regName, email: regEmail, phone: regPhone, age: Number(regAge), password: regPassword 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsLoading(false);
        onLoginSuccess(data.name); 
      } else {
        setIsLoading(false);
        alert("Kayıt Hatası: " + data.message); 
      }
    } catch (error) {
      setIsLoading(false);
      alert("Sunucuya bağlanılamadı. .NET API'nin 5094 portunda çalıştığından emin olun.");
    }
  };

  // Ortak input tasarımı
  const inputStyle = {
    width: '100%', padding: '12px 14px', marginBottom: '12px', borderRadius: '10px',
    border: `1px solid ${THEME_COLORS.border}`, backgroundColor: THEME_COLORS.sageBg,
    fontSize: '13px', outline: 'none', color: THEME_COLORS.textDark, boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s'
  };

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: `linear-gradient(135deg, ${THEME_COLORS.sageBg} 0%, ${THEME_COLORS.sageLight} 100%)` }}>
      
      <div style={{ width: '420px', backgroundColor: THEME_COLORS.white, borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', overflow: 'hidden', position: 'relative', border: `1px solid ${THEME_COLORS.border}` }}>
        <div style={{ display: 'flex', width: '200%', transform: isLoginView ? 'translateX(-50%)' : 'translateX(0)', transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          
          {/* ================= VAGON 1: ÜYE OL ================= */}
          <form onSubmit={handleRegister} style={{ width: '50%', padding: '35px 40px', flexShrink: 0, boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '26px', color: THEME_COLORS.textDark, margin: '0 0 6px 0', fontWeight: '800' }}>Aramıza Katıl</h2>
              <p style={{ margin: 0, fontSize: '13px', color: THEME_COLORS.textMuted }}>Kendi rotanı çizmeye başla.</p>
            </div>
            
            <input type="text" placeholder="Ad Soyad" value={regName} onChange={e => setRegName(e.target.value)} style={inputStyle} required />
            <input type="email" placeholder="E-posta Adresi" value={regEmail} onChange={e => setRegEmail(e.target.value)} style={inputStyle} required />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="tel" placeholder="Telefon (5XX...)" value={regPhone} onChange={e => setRegPhone(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
              <input type="number" placeholder="Yaş" min="18" max="100" value={regAge} onChange={e => setRegAge(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            </div>

            <input type="password" placeholder="Şifre" value={regPassword} onChange={e => setRegPassword(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="Şifre (Tekrar)" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} style={{ ...inputStyle, borderColor: isPasswordError ? '#ef4444' : THEME_COLORS.border, marginBottom: isPasswordError ? '4px' : '12px' }} required />

            {isPasswordError && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '10px', fontWeight: '600', paddingLeft: '4px' }}>Şifreler eşleşmiyor!</div>}

            <button disabled={isPasswordError || regPassword.length === 0 || isLoading} style={{ width: '100%', padding: '14px', backgroundColor: (isPasswordError || regPassword.length === 0) ? '#CBD5E1' : THEME_COLORS.sagePrimary, color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: (isPasswordError || regPassword.length === 0 || isLoading) ? 'not-allowed' : 'pointer', marginTop: '5px', boxShadow: '0 4px 12px rgba(126, 161, 130, 0.25)', transition: '0.2s' }}>
              {isLoading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'}
            </button>
            
            <p style={{ textAlign: 'center', fontSize: '13px', color: THEME_COLORS.textMuted, marginTop: '20px', marginBottom: 0 }}>
              Zaten hesabın var mı? <strong onClick={() => setIsLoginView(true)} style={{ color: THEME_COLORS.sageDark, cursor: 'pointer', borderBottom: `1px solid ${THEME_COLORS.sageDark}` }}>Giriş Yap</strong>
            </p>
          </form>

          {/* ================= VAGON 2: GİRİŞ YAP ================= */}
          <form onSubmit={handleLogin} style={{ width: '50%', padding: '35px 40px', flexShrink: 0, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '26px', color: THEME_COLORS.textDark, margin: '0 0 6px 0', fontWeight: '800' }}>Hoş Geldin</h2>
              <p style={{ margin: 0, fontSize: '13px', color: THEME_COLORS.textMuted }}>Kaldığın yerden devam et.</p>
            </div>
            
            <input type="email" placeholder="E-posta Adresi" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="Şifre" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={inputStyle} required />
            
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: THEME_COLORS.sagePrimary, cursor: 'pointer', fontWeight: '600' }}>Şifremi Unuttum</span>
            </div>

            <button disabled={isLoading} style={{ width: '100%', padding: '14px', backgroundColor: isLoading ? '#CBD5E1' : THEME_COLORS.sageDark, color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(95, 126, 100, 0.25)', transition: '0.2s' }}>
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
            
            <p style={{ textAlign: 'center', fontSize: '13px', color: THEME_COLORS.textMuted, marginTop: '20px', marginBottom: 0 }}>
              Hesabın yok mu? <strong onClick={() => setIsLoginView(false)} style={{ color: THEME_COLORS.sageDark, cursor: 'pointer', borderBottom: `1px solid ${THEME_COLORS.sageDark}` }}>Üye Ol</strong>
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}