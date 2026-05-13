import { Link, NavLink } from 'react-router-dom'
import { LogOut, Map } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

function avatarUrl(firstName: string, lastName: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName}+${lastName}`)}&background=879F84&color=fff&size=80`
}

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-sage/20 bg-offwhite/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-sage-dark font-bold text-xl tracking-tight">
          <Map size={20} strokeWidth={2.5} />
          Spotly
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/"
            className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800 hover:bg-sage/10 rounded-md transition"
          >
            Nasıl Çalışır?
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `px-3 py-1.5 text-sm rounded-md transition ${
                isActive
                  ? 'text-sage-dark bg-sage/10 font-medium'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-sage/10'
              }`
            }
          >
            Keşfet
          </NavLink>
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/profile" title={`${user.first_name} ${user.last_name}`}>
                <img
                  src={avatarUrl(user.first_name, user.last_name)}
                  alt="Profil"
                  className="w-10 h-10 rounded-full border-2 border-transparent hover:border-sage cursor-pointer object-cover transition-all"
                />
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800 hover:bg-sage/10 rounded-md transition"
              >
                <LogOut size={15} />
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800 hover:bg-sage/10 rounded-md transition"
              >
                Giriş Yap
              </Link>
              <Link
                to="/auth?mode=register"
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-sage hover:bg-sage-dark rounded-lg transition"
              >
                Kaydol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
