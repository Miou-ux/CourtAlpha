import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { captureUtmSession } from '../lib/utmCapture'

/** Envoie une pageview à chaque changement de route (dédupliqué côté API). */
export function usePageViewAnalytics() {
  const location = useLocation()
  const { token } = useAuth()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    const path = location.pathname
    if (path === lastPath.current) return
    lastPath.current = path

    const utm = captureUtmSession(location.search)

    void api.analyticsPageView(
      {
        path,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        ...utm,
      },
      token,
    ).catch(() => {
      /* analytics non bloquant */
    })
  }, [location.pathname, location.search, token])
}
