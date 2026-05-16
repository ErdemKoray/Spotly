import { Component, useEffect, type ReactNode, type ErrorInfo } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import { AuthModalProvider, useAuthModal } from './contexts/AuthModalContext'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Profile from './pages/Profile'

/* ─────────────────────────────────────────
   Error Boundary — beyaz ekrana karşı güvenlik ağı
───────────────────────────────────────── */
interface EBState { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-offwhite px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-stone-800">Beklenmedik bir hata oluştu</h2>
          <p className="text-sm text-stone-400 max-w-xs">
            {this.state.error?.message ?? 'Bilinmeyen hata'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            className="mt-2 px-5 py-2.5 bg-sage hover:bg-sage-dark text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

/* ─────────────────────────────────────────
   Sayfa Geçiş Sarmalayıcısı
───────────────────────────────────────── */
function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
      style={{ width: '100%', minHeight: '100%' }}
    >
      {children}
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   Protected Route
───────────────────────────────────────── */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const { openAuthModal } = useAuthModal()

  useEffect(() => {
    if (!token) openAuthModal('login')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!token) return <Navigate to="/" replace />
  return <>{children}</>
}

/* ─────────────────────────────────────────
   Route Tanımları
───────────────────────────────────────── */
function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <PageTransition><Explore /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageTransition><Profile /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*"     element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

/* ─────────────────────────────────────────
   App
───────────────────────────────────────── */
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthModalProvider>
          <AppRoutes />
        </AuthModalProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
