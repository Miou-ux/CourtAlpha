import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

import { isAdmin, isPremium } from '../lib/auth'



type ProtectedRouteProps = {

  children: React.ReactNode

  adminOnly?: boolean

  /** false = page publique (1 Day 1 Pick, pricing). */

  requireAuth?: boolean

  /** Live, Top 5, Top probas, Paris — login + premium. */

  premiumOnly?: boolean

}



export function ProtectedRoute({

  children,

  adminOnly,

  requireAuth = true,

  premiumOnly,

}: ProtectedRouteProps) {

  const { user, authRequired, loading } = useAuth()



  if (loading) return <p className="text-sm text-muted">Vérification session…</p>



  if (requireAuth && authRequired && !user) {

    return <Navigate to="/login" replace />

  }



  if (adminOnly) {

    if (!user) return <Navigate to="/login" replace />

    if (!isAdmin(user)) return <Navigate to="/1-day-1-pick" replace />

  }



  if (premiumOnly) {
    if (!user) {
      return authRequired ? <Navigate to="/login" replace /> : <Navigate to="/pricing" replace />
    }
    if (!isPremium(user) && !isAdmin(user)) return <Navigate to="/pricing" replace />
  }



  return <>{children}</>

}



/** Routes accessibles sans compte. */

export const PUBLIC_APP_PATHS = new Set(['/1-day-1-pick', '/pricing', '/login'])



export function isPublicAppPath(pathname: string): boolean {

  return PUBLIC_APP_PATHS.has(pathname)

}


