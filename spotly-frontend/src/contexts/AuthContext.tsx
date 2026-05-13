import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  age: number | null
  phone: string | null
}

interface AuthState {
  user: User | null
  token: string | null
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('spotly_token')
    const userRaw = localStorage.getItem('spotly_user')
    return {
      token,
      user: userRaw ? (JSON.parse(userRaw) as User) : null,
    }
  })

  function login(token: string, user: User) {
    localStorage.setItem('spotly_token', token)
    localStorage.setItem('spotly_user', JSON.stringify(user))
    setState({ token, user })
  }

  function logout() {
    localStorage.removeItem('spotly_token')
    localStorage.removeItem('spotly_user')
    setState({ token: null, user: null })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
