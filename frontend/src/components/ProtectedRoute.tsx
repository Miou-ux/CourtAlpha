import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../lib/auth'

type ProtectedRouteProps = {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { user, authRequired, loading } = useAuth()
  if (loading) return <p className="text-sm text-muted">Vérification session…</p>
  if (authRequired && !user) return <Navigate to="/login" replace />
  if (adminOnly) {
    if (!user) return <Navigate to="/login" replace />
    if (!isAdmin(user)) return <Navigate to="/live" replace />
  }
  return <>{children}</>
}
