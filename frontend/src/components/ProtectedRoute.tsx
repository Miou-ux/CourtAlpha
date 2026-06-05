import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../lib/auth'

type ProtectedRouteProps = {
  children: React.ReactNode
  /** Pages réservées aux admins (backtest, tracking, settings). */
  adminOnly?: boolean
  /** Si false : page visible sans connexion (live, paris, top5). */
  requireAuth?: boolean
}

export function ProtectedRoute({ children, adminOnly, requireAuth = true }: ProtectedRouteProps) {
  const { user, authRequired, loading } = useAuth()
  if (loading) return <p className="text-sm text-muted">Vérification session…</p>
  if (requireAuth && authRequired && !user) return <Navigate to="/login" replace />
  if (adminOnly) {
    if (!user) return <Navigate to="/login" replace />
    if (!isAdmin(user)) return <Navigate to="/live" replace />
  }
  return <>{children}</>
}

/** Routes accessibles sans compte en PROD. */
export const PUBLIC_APP_PATHS = new Set(['/live', '/paris', '/top5'])

export function isPublicAppPath(pathname: string): boolean {
  return PUBLIC_APP_PATHS.has(pathname)
}
