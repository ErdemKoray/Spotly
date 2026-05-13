import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  onSwitch: () => void
}

export default function LoginForm({ onSwitch }: Props) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(data.access_token, data.user)
      navigate('/explore', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Giriş yapılamadı.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Tekrar hoş geldin</h2>
      <p className="text-sm text-gray-500 mb-8">Hesabına giriş yap</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            E-posta
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            Şifre
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-sage hover:bg-sage-dark active:bg-sage-dark text-white text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-6">
        Hesabın yok mu?{' '}
        <button
          onClick={onSwitch}
          className="text-sage-dark hover:underline font-medium"
        >
          Kayıt ol
        </button>
      </p>
    </div>
  )
}
