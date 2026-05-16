import { createContext, useContext, useState } from 'react'
import { AuthModal, type AuthMode } from '../components/auth-modal'

interface AuthModalContextType {
  openAuthModal: (mode?: AuthMode) => void
  closeAuthModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')

  function openAuthModal(m: AuthMode = 'login') {
    setMode(m)
    setOpen(true)
  }

  function closeAuthModal() {
    setOpen(false)
  }

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal open={open} onOpenChange={setOpen} initialMode={mode} />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
