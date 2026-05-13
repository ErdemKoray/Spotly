import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function AuthPage() {
  const { token } = useAuth()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>(
    params.get('mode') === 'register' ? 'register' : 'login'
  )

  if (token) return <Navigate to="/explore" replace />

  return (
    <div className="min-h-screen bg-offwhite flex">
      {/* Sol panel — marka */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-sage-dark p-12 text-white">
        <div>
          <span className="text-2xl font-bold tracking-tight">Spotly</span>
        </div>
        <div>
          <p className="text-4xl font-semibold leading-tight mb-4">
            İstanbul'un en iyi<br />
            mekanlarını keşfet.
          </p>
          <p className="text-sage-light text-base">
            Fotoğraf, gurme veya turistik önceliğine göre<br />
            kişiselleştirilmiş rota planla.
          </p>
        </div>
        <p className="text-white/40 text-sm">© {new Date().getFullYear()} Spotly</p>
      </div>

      {/* Sağ panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        {mode === 'login' ? (
          <LoginForm onSwitch={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitch={() => setMode('login')} />
        )}
      </div>
    </div>
  )
}
