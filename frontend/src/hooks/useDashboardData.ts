import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { isPremium } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

export function useDashboardData() {
  const { token, user } = useAuth()
  const loggedIn = !!user && !!token
  const premium = isPremium(user)

  const health = useQuery({ queryKey: ['health'], queryFn: api.health })
  const meta = useQuery({
    queryKey: ['live-meta', token],
    queryFn: () => api.liveMeta(token),
    enabled: premium,
  })
  const matches = useQuery({
    queryKey: ['live-matches', token],
    queryFn: () => api.liveMatches(token),
    enabled: premium,
  })
  const picks = useQuery({
    queryKey: ['picks-jour', token],
    queryFn: () => api.picksJour(token),
    enabled: premium,
  })
  const top5 = useQuery({
    queryKey: ['picks-top5', token],
    queryFn: () => api.picksTop5(token),
    enabled: premium,
  })
  const portfolio = useQuery({
    queryKey: ['portfolio-summary', token],
    queryFn: () => api.portfolioSummary(token),
    enabled: loggedIn,
  })
  const bets = useQuery({
    queryKey: ['portfolio-bets', token],
    queryFn: () => api.portfolioBets({ limit: 80 }, token),
    enabled: loggedIn,
  })

  const loading =
    health.isLoading ||
    (premium && (meta.isLoading || matches.isLoading || picks.isLoading || top5.isLoading))

  const error =
    health.error ||
    (premium ? meta.error || matches.error || picks.error || top5.error : null)

  const refetchAll = () => {
    void health.refetch()
    if (premium) {
      void meta.refetch()
      void matches.refetch()
      void picks.refetch()
      void top5.refetch()
    }
    if (loggedIn) {
      void portfolio.refetch()
      void bets.refetch()
    }
  }

  return {
    user,
    root: health.data?.bettinghud_root ?? '',
    meta: meta.data ?? null,
    matches: matches.data?.matches ?? [],
    picks: picks.data?.picks ?? [],
    top5: top5.data?.picks ?? [],
    portfolio: portfolio.data ?? null,
    bets: bets.data?.bets ?? [],
    loading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetchAll,
  }
}
