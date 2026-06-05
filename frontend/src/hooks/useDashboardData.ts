import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function useDashboardData() {
  const { token } = useAuth()
  const health = useQuery({ queryKey: ['health'], queryFn: api.health })
  const meta = useQuery({ queryKey: ['live-meta'], queryFn: api.liveMeta })
  const matches = useQuery({ queryKey: ['live-matches'], queryFn: api.liveMatches })
  const picks = useQuery({ queryKey: ['picks-jour'], queryFn: api.picksJour })
  const top5 = useQuery({ queryKey: ['picks-top5'], queryFn: api.picksTop5 })
  const portfolio = useQuery({
    queryKey: ['portfolio-summary', token],
    queryFn: () => api.portfolioSummary(token),
  })
  const bets = useQuery({
    queryKey: ['portfolio-bets', token],
    queryFn: () => api.portfolioBets({ limit: 80 }, token),
  })

  const loading =
    health.isLoading ||
    meta.isLoading ||
    matches.isLoading ||
    picks.isLoading ||
    top5.isLoading

  const error =
    health.error ||
    meta.error ||
    matches.error ||
    picks.error ||
    top5.error

  const refetchAll = () => {
    void health.refetch()
    void meta.refetch()
    void matches.refetch()
    void picks.refetch()
    void top5.refetch()
    void portfolio.refetch()
    void bets.refetch()
  }

  return {
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
