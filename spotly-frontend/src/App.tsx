import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Profile from './pages/Profile'
import AuthPage from './features/auth/AuthPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
