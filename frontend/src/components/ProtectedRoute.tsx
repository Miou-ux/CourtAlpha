import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../context/AuthContext'

import { isAdmin, isPremium } from '../lib/auth'
import { PRICING_ENABLED } from '../lib/features'

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
  const { t } = useTranslation()

  if (loading) return <p className="text-sm text-muted">{t('protected.checkingSession')}</p>

  if (requireAuth && authRequired && !user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly) {
    if (!user) return <Navigate to="/login" replace />
    if (!isAdmin(user)) return <Navigate to="/1-day-1-pick" replace />
  }

  if (premiumOnly) {
    const premiumFallback = PRICING_ENABLED ? '/pricing' : '/1-day-1-pick'
    if (!user) {
      return authRequired ? <Navigate to="/login" replace /> : <Navigate to={premiumFallback} replace />
    }
    if (!isPremium(user) && !isAdmin(user)) return <Navigate to={premiumFallback} replace />
  }

  return <>{children}</>
}

/** Routes accessibles sans compte. */
export const PUBLIC_APP_PATHS = new Set([
  '/1-day-1-pick',
  '/login',
  ...(PRICING_ENABLED ? (['/pricing'] as const) : []),
])

export function isPublicAppPath(pathname: string): boolean {
  return PUBLIC_APP_PATHS.has(pathname)
}
