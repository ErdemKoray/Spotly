import { useState } from 'react';
import { THEME_COLORS } from './constants';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Auth from './pages/Auth';
import Profile from './pages/Profile';

const getInitials = (name: string) => {
  if (!name) return "U";
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'map' | 'auth' | 'profile'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  // 🔔 YENİ: Profil menüsünün açık olup olmadığını tutan state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLoginSuccess = (userName: string) => {
    setLoggedInUser(userName); 
    setCurrentView('map');     
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentView('home');
    setIsProfileMenuOpen(false); // Çıkış yapınca menüyü kapat
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: THEME_COLORS.sageBg, overflow: 'hidden' }}>
      
      {/* 🌿 NAVBAR */}
      <header style={{ height: '64px', backgroundColor: THEME_COLORS.white, borderBottom: `1px solid ${THEME_COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', flexShrink: 0, zIndex: 100 }}>
        
        <div onClick={() => setCurrentView('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: THEME_COLORS.sageDark, cursor: 'pointer' }}>
          <span style={{ fontSize: '24px' }}>🌿</span>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Spotly</h1>
        </div>
        
        <nav style={{ display: 'flex', gap: '30px', alignItems: 'center', fontSize: '14px', fontWeight: '600', color: THEME_COLORS.textMuted }}>
            <span onClick={() => { setCurrentView('home'); setIsProfileMenuOpen(false); }} style={{ cursor: 'pointer', color: currentView === 'home' ? THEME_COLORS.sagePrimary : THEME_COLORS.textMuted }}>Ana Sayfa</span>
            <span onClick={() => { setCurrentView('map'); setIsProfileMenuOpen(false); }} style={{ cursor: 'pointer', color: currentView === 'map' ? THEME_COLORS.sagePrimary : THEME_COLORS.textMuted }}>Akıllı Harita</span>
            
            {loggedInUser ? (
              /* PROFİL İKONU VE AÇILIR MENÜ ALANI */
              <div style={{ position: 'relative' }}> 
                <div 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} // Tıklayınca menüyü aç/kapat
                  style={{ 
                    width: '38px', height: '38px', borderRadius: '50%', 
                    backgroundColor: THEME_COLORS.sagePrimary, color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: '700', cursor: 'pointer', fontSize: '15px',
                    boxShadow: '0 2px 8px rgba(126, 161, 130, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {getInitials(loggedInUser)}
                </div>

                {/* 🧧 KÜÇÜK PROFİL KARTI (DROPDOWN) */}
                {isProfileMenuOpen && (
                  <div style={{ 
                    position: 'absolute', top: '50px', right: '0', 
                    width: '180px', backgroundColor: 'white', borderRadius: '16px', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: `1px solid ${THEME_COLORS.border}`,
                    padding: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '4px'
                  }}>
                    {/* Profil Butonu */}
                    <button 
                      onClick={() => { setCurrentView('profile'); setIsProfileMenuOpen(false); }}
                      style={{ 
                        padding: '10px 15px', textAlign: 'left', background: 'none', border: 'none', 
                        borderRadius: '10px', cursor: 'pointer', color: THEME_COLORS.textDark, 
                        fontWeight: '600', fontSize: '13px', transition: '0.2s' 
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = THEME_COLORS.sageBg}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      👤 Profilim
                    </button>

                    <div style={{ height: '1px', backgroundColor: THEME_COLORS.border, margin: '4px 8px' }}></div>

                    {/* Çıkış Yap Butonu */}
                    <button 
                      onClick={handleLogout}
                      style={{ 
                        padding: '10px 15px', textAlign: 'left', background: 'none', border: 'none', 
                        borderRadius: '10px', cursor: 'pointer', color: '#ef4444', 
                        fontWeight: '600', fontSize: '13px', transition: '0.2s' 
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      🚪 Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => { setAuthMode('login'); setCurrentView('auth'); }}
                style={{ backgroundColor: currentView === 'auth' ? THEME_COLORS.sageDark : THEME_COLORS.sagePrimary, color: 'white', border: 'none', padding: '8px 24px', borderRadius: '24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(126, 161, 130, 0.25)', transition: 'all 0.2s ease-in-out' }}>
                  Giriş Yap
              </button>
            )}
        </nav>
      </header>

      {/* DİNAMİK İÇERİK ALANI */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {currentView === 'home' && <Home onNavigate={setCurrentView} />}
        {currentView === 'map'  && <MapPage />}
        {currentView === 'auth' && <Auth initialMode={authMode} onLoginSuccess={handleLoginSuccess} />}
        {currentView === 'profile' && loggedInUser && (
          <Profile userName={loggedInUser} onLogout={handleLogout} onNavigate={setCurrentView} />
        )}
      </div>

      <footer style={{ height: '40px', background: THEME_COLORS.white, borderTop: `1px solid ${THEME_COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: THEME_COLORS.textMuted, zIndex: 100 }}>
          © 2026 Spotly • Adaçayı Teması • Akıllı Şehir Planlama
      </footer>
    </div>
  );
}