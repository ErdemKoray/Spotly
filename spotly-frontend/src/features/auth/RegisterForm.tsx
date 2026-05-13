import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  onSwitch: () => void
}

export default function RegisterForm({ onSwitch }: Props) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    age: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        phone: form.phone || undefined,
      }
      const { data } = await api.post('/auth/register', payload)
      login(data.access_token, data.user)
      navigate('/explore', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Kayıt oluşturulamadı.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">Hesap oluştur</h2>
      <p className="text-sm text-gray-500 mb-8">Spotly'ye katıl</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Ad</label>
            <input
              name="first_name"
              required
              value={form.first_name}
              onChange={handleChange}
              placeholder="Adın"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Soyad</label>
            <input
              name="last_name"
              required
              value={form.last_name}
              onChange={handleChange}
              placeholder="Soyadın"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">E-posta</label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="ornek@email.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Şifre</label>
          <input
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              Yaş <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <input
              name="age"
              type="number"
              min="1"
              max="120"
              value={form.age}
              onChange={handleChange}
              placeholder="25"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              Telefon <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="0555 000 00 00"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm placeholder-stone-300 outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition"
            />
          </div>
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
          {loading ? 'Kaydediliyor…' : 'Kayıt Ol'}
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-6">
        Zaten hesabın var mı?{' '}
        <button
          onClick={onSwitch}
          className="text-sage-dark hover:underline font-medium"
        >
          Giriş yap
        </button>
      </p>
    </div>
  )
}
