import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Map, Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { DatePicker } from './ui/date-picker'

/* ─── Tipler ─── */
export type AuthMode = 'login' | 'register'

export interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: AuthMode
}

/* ─── Zod Şemaları ─── */
const loginSchema = z.object({
  email:    z.string().email('Geçerli bir e-posta girin.'),
  password: z.string().min(1, 'Şifre zorunludur.'),
})

const registerSchema = z.object({
  first_name:      z.string().min(1, 'Ad zorunludur.'),
  last_name:       z.string().min(1, 'Soyad zorunludur.'),
  email:           z.string().email('Geçerli bir e-posta girin.'),
  password:        z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  confirmPassword: z.string().min(1, 'Şifreyi onaylamanız gerekiyor.'),
  birth_date:      z.date().nullable().refine((d): d is Date => d !== null, { message: 'Doğum tarihi zorunludur.' }),
  phone:           z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Şifreler eşleşmiyor.',
  path: ['confirmPassword'],
})

type LoginFields = z.infer<typeof loginSchema>

/* Form state tipi — birth_date null olabilir (henüz seçilmemiş) */
type RegisterFields = {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
  birth_date: Date | null
  phone: string
}

type LoginErrors    = Partial<Record<keyof LoginFields, string>>
type RegisterErrors = Partial<Record<keyof RegisterFields, string>>

/* ─── Form slide animasyonu ─── */
const formVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center:              { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir * -40 }),
}
const easing = [0.25, 0.46, 0.45, 0.94] as const

/* ─────────────────────────────
   Sol Panel — Sage Green Marka
───────────────────────────────*/
function LeftPanel() {
  return (
    <div
      className="hidden md:flex flex-col justify-between w-[42%] shrink-0 p-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #5a7257 0%, #879F84 50%, #A3B8A0 100%)' }}
    >
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/5" />
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-32 h-32 rounded-full bg-white/5" />

      <div className="relative z-10 flex items-center gap-2.5 text-white">
        <div className="w-9 h-9 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl flex items-center justify-center">
          <Map size={18} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-lg tracking-tight">Spotly</span>
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            İstanbul Keşif Rehberi
          </p>
          <h2 className="text-4xl font-bold text-white leading-[1.1] tracking-tight">
            İstanbul'u<br />
            <span className="text-white/70">keşfetmeye</span><br />
            hazır mısın?
          </h2>
        </div>
        <p className="text-white/65 text-sm leading-relaxed max-w-[200px]">
          Yapay zeka destekli rotalar, gizli fotoğraf noktaları ve tarihi dokular — hepsi sana özel.
        </p>
        <ul className="flex flex-col gap-2.5 mt-1">
          {['Kişiselleştirilmiş AI rotaları', 'Gizli fotoğraf noktaları', 'Tarihi sokak rehberi'].map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-white/75 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 flex items-center gap-5 pt-6 border-t border-white/15">
        {[['46+', 'Mekan'], ['3', 'Rota Tipi'], ['∞', 'Keşif']].map(([n, l], i) => (
          <React.Fragment key={l}>
            {i > 0 && <div className="w-px h-8 bg-white/20" />}
            <div>
              <p className="text-white font-bold text-xl">{n}</p>
              <p className="text-white/55 text-xs mt-0.5">{l}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────
   Ortak Input
───────────────────────────────*/
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  rightEl?: React.ReactNode
}

function Input({ label, error, rightEl, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          className={`w-full px-4 py-2.5 rounded-xl border bg-stone-50 text-stone-800 text-sm
            placeholder-stone-300 outline-none transition-all duration-200
            focus:bg-white focus:border-sage focus:ring-2 focus:ring-sage/20
            ${error ? 'border-red-300 ring-2 ring-red-100' : 'border-stone-200'}
            ${rightEl ? 'pr-11' : ''} ${className}`}
          {...props}
        />
        {rightEl && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">{rightEl}</div>
        )}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500">{error}
        </motion.p>
      )}
    </div>
  )
}

/* ─────────────────────────────
   Submit Butonu
───────────────────────────────*/
function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={loading ? {} : { y: -1, boxShadow: '0 8px 25px -4px rgba(135,159,132,0.45)' }}
      whileTap={loading ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="w-full py-2.5 rounded-xl bg-sage hover:bg-sage-dark text-white text-sm font-semibold
        transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Lütfen bekleyin…
        </span>
      ) : label}
    </motion.button>
  )
}

/* ─────────────────────────────
   Giriş Formu
───────────────────────────────*/
function LoginPanel({ onSwitch, onClose }: { onSwitch: () => void; onClose: () => void }) {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [fields, setFields]   = React.useState<LoginFields>({ email: '', password: '' })
  const [errors, setErrors]   = React.useState<LoginErrors>({})
  const [apiError, setApiError] = React.useState('')
  const [showPw, setShowPw]   = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  function set(k: keyof LoginFields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((p) => ({ ...p, [k]: e.target.value }))
      setErrors((p) => ({ ...p, [k]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    const result = loginSchema.safeParse(fields)
    if (!result.success) {
      const errs: LoginErrors = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof LoginFields
        errs[key] = issue.message
      })
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email: fields.email, password: fields.password })
      login(data.access_token, data.user)
      onClose()
      navigate('/explore', { replace: true })
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          ?? 'E-posta veya şifre hatalı.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight">Tekrar hoş geldin</h2>
        <p className="text-sm text-stone-400 mt-1">Hesabına giriş yap ve keşfe başla</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="E-posta" type="email" value={fields.email}
          onChange={set('email')} placeholder="ornek@email.com" error={errors.email} />

        <Input
          label="Şifre" type={showPw ? 'text' : 'password'}
          value={fields.password} onChange={set('password')}
          placeholder="••••••••" error={errors.password}
          rightEl={
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="text-stone-400 hover:text-stone-600 transition cursor-pointer" tabIndex={-1}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        {apiError && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
            {apiError}
          </motion.p>
        )}

        <SubmitBtn loading={loading} label="Giriş Yap" />
      </form>

      <p className="text-sm text-stone-400 text-center">
        Hesabın yok mu?{' '}
        <button onClick={onSwitch} className="text-sage-dark font-semibold hover:underline cursor-pointer">
          Ücretsiz kayıt ol
        </button>
      </p>
    </div>
  )
}

/* ─────────────────────────────
   Kayıt Formu
───────────────────────────────*/
function RegisterPanel({ onSwitch, onClose }: { onSwitch: () => void; onClose: () => void }) {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [fields, setFields] = React.useState<RegisterFields>({
    first_name: '', last_name: '', email: '', password: '',
    confirmPassword: '', birth_date: null, phone: '',
  })
  const [errors, setErrors]     = React.useState<RegisterErrors>({})
  const [apiError, setApiError] = React.useState('')
  const [showPw, setShowPw]     = React.useState(false)
  const [showCp, setShowCp]     = React.useState(false)
  const [loading, setLoading]   = React.useState(false)

  function set(k: keyof Omit<RegisterFields, 'birth_date'>) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((p) => ({ ...p, [k]: e.target.value }))
      setErrors((p) => ({ ...p, [k]: undefined }))
    }
  }

  function setDate(d: Date | null) {
    setFields((p) => ({ ...p, birth_date: d }))
    setErrors((p) => ({ ...p, birth_date: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    const result = registerSchema.safeParse(fields)
    if (!result.success) {
      const errs: RegisterErrors = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof RegisterFields
        if (!errs[key]) errs[key] = issue.message
      })
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const payload = {
        first_name: fields.first_name,
        last_name:  fields.last_name,
        email:      fields.email,
        password:   fields.password,
        birth_date: fields.birth_date ? format(fields.birth_date, 'yyyy-MM-dd') : undefined,
        phone:      fields.phone || undefined,
      }
      const { data } = await api.post('/auth/register', payload)
      login(data.access_token, data.user)
      onClose()
      navigate('/explore', { replace: true })
    } catch (err: unknown) {
      setApiError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          ?? 'Kayıt oluşturulamadı.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight">Hesap oluştur</h2>
        <p className="text-sm text-stone-400 mt-1">Spotly'ye katıl, ücretsiz ve hızlı</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Ad / Soyad */}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Ad"    value={fields.first_name} onChange={set('first_name')} placeholder="Adın"     error={errors.first_name} />
          <Input label="Soyad" value={fields.last_name}  onChange={set('last_name')}  placeholder="Soyadın"  error={errors.last_name} />
        </div>

        {/* E-posta */}
        <Input label="E-posta" type="email" value={fields.email}
          onChange={set('email')} placeholder="ornek@email.com" error={errors.email} />

        {/* Doğum Tarihi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Doğum Tarihi
          </label>
          <DatePicker
            value={fields.birth_date}
            onChange={setDate}
            error={!!errors.birth_date}
          />
          {errors.birth_date && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500">{errors.birth_date}
            </motion.p>
          )}
        </div>

        {/* Şifre */}
        <Input
          label="Şifre" type={showPw ? 'text' : 'password'}
          value={fields.password} onChange={set('password')}
          placeholder="En az 6 karakter" error={errors.password}
          rightEl={
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="text-stone-400 hover:text-stone-600 transition cursor-pointer" tabIndex={-1}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        {/* Şifre Onayla */}
        <Input
          label="Şifreyi Onayla" type={showCp ? 'text' : 'password'}
          value={fields.confirmPassword} onChange={set('confirmPassword')}
          placeholder="Şifreni tekrar gir" error={errors.confirmPassword}
          rightEl={
            <button type="button" onClick={() => setShowCp((v) => !v)}
              className="text-stone-400 hover:text-stone-600 transition cursor-pointer" tabIndex={-1}>
              {showCp ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        {/* Telefon (opsiyonel) */}
        <Input label="Telefon (opsiyonel)" type="tel"
          value={fields.phone} onChange={set('phone')} placeholder="0555 000 00 00" />

        {apiError && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5">
            {apiError}
          </motion.p>
        )}

        <SubmitBtn loading={loading} label="Kayıt Ol" />
      </form>

      <p className="text-sm text-stone-400 text-center">
        Zaten hesabın var mı?{' '}
        <button onClick={onSwitch} className="text-sage-dark font-semibold hover:underline cursor-pointer">
          Giriş yap
        </button>
      </p>
    </div>
  )
}

/* ─────────────────────────────
   Ana Modal
───────────────────────────────*/
export function AuthModal({ open, onOpenChange, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = React.useState<AuthMode>(initialMode)
  const [dir, setDir]   = React.useState(1)

  React.useEffect(() => {
    if (open) setMode(initialMode)
  }, [open, initialMode])

  function switchTo(next: AuthMode) {
    setDir(next === 'register' ? 1 : -1)
    setMode(next)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed inset-0 z-[2001] flex items-center justify-center p-4 overflow-y-auto"
          onInteractOutside={() => onOpenChange(false)}
        >
          {/* Kart — layout ile yüksekliği akışkan şekilde animasyonlanır */}
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{
              opacity:  { duration: 0.25, ease: easing },
              scale:    { duration: 0.3,  ease: easing },
              y:        { duration: 0.3,  ease: easing },
              layout:   { duration: 0.4,  ease: easing },
            }}
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex my-auto"
          >
            <LeftPanel />

            {/* Sağ panel — içerik yüksekliğini belirler */}
            <div className="flex-1 relative flex items-start justify-center p-10 md:p-12">
              <Dialog.Close asChild>
                <button
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center
                    rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500
                    transition-colors cursor-pointer z-10"
                  aria-label="Kapat"
                >
                  <X size={15} />
                </button>
              </Dialog.Close>

              {/* Form geçişi — AnimatePresence ile slide/fade */}
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={mode}
                  custom={dir}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: easing }}
                  className="w-full max-w-sm pt-2"
                >
                  {mode === 'login'
                    ? <LoginPanel    onSwitch={() => switchTo('register')} onClose={() => onOpenChange(false)} />
                    : <RegisterPanel onSwitch={() => switchTo('login')}    onClose={() => onOpenChange(false)} />
                  }
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
