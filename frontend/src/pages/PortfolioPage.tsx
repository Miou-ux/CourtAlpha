import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, type BetRow, type PortfolioSummary } from '../api/client'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { FieldLabel, Input, Select } from '../components/ui/input'
import { StatTile } from '../components/ui/stat-tile'
import { useAuth } from '../context/AuthContext'
import { BRAND, CHART_TOOLTIP_STYLE } from '../lib/brand'

const STATUS_OPTIONS = ['Tous', 'En cours', 'Gagné', 'Perdu', 'Annulé'] as const
const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'profit_desc', label: 'Profit décroissant' },
  { value: 'profit_asc', label: 'Profit croissant' },
] as const

function fmtEur(v: number | undefined | null, digits = 2) {
  if (v == null || Number.isNaN(v)) return '—'
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(digits)} €`
}

function fmtPct(v: number | undefined | null, digits = 1) {
  if (v == null || Number.isNaN(v)) return '—'
  return `${v.toFixed(digits)}%`
}

function statusTone(status?: string): 'success' | 'danger' | 'accent' | 'default' {
  if (status === 'Gagné') return 'success'
  if (status === 'Perdu') return 'danger'
  if (status === 'En cours') return 'accent'
  return 'default'
}

function trackerLabel(src?: string) {
  const map: Record<string, string> = {
    telegram_bet: 'Telegram',
    live_tracker: 'Live Tracker',
    top5_proba_action: 'Paris du jour',
    live_inplay_manual: 'In-play',
    live_tracker_web: 'Web',
  }
  const key = (src ?? '').trim()
  if (!key) return 'Legacy'
  return map[key] ?? key
}

type PortfolioPageProps = {
  summary: PortfolioSummary | null
  bets: BetRow[]
  loading?: boolean
  onRefresh?: () => void
}

export function PortfolioPage({ summary: summaryProp, bets: betsProp, loading: loadingProp, onRefresh }: PortfolioPageProps) {
  const { token, user } = useAuth()
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('Tous')
  const [minStake, setMinStake] = useState(0)
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]['value']>('recent')

  const summaryQ = useQuery({
    queryKey: ['portfolio-summary', token],
    queryFn: () => api.portfolioSummary(token),
    initialData: summaryProp ?? undefined,
  })
  const betsQ = useQuery({
    queryKey: ['portfolio-bets', token, statusFilter, minStake, sort],
    queryFn: () =>
      api.portfolioBets(
        { limit: 500, status: statusFilter, min_stake: minStake, sort },
        token,
      ),
    initialData: betsProp.length ? { count: betsProp.length, bets: betsProp } : undefined,
  })
  const reconQ = useQuery({
    queryKey: ['portfolio-reconcile-status', token],
    queryFn: () => api.portfolioReconcileStatus(token),
  })

  const summary = summaryQ.data ?? summaryProp
  const bets = betsQ.data?.bets ?? betsProp
  const loading = loadingProp || summaryQ.isLoading || betsQ.isLoading

  const pending = useMemo(() => bets.filter((b) => b.status === 'En cours'), [bets])
  const br = summary?.bankroll
  const kelly = summary?.kelly

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['portfolio-summary'] })
    void qc.invalidateQueries({ queryKey: ['portfolio-bets'] })
    onRefresh?.()
  }

  const settleMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'Gagné' | 'Perdu' }) =>
      api.portfolioSettleBet(id, status, token),
    onSuccess: invalidate,
  })

  const clvMut = useMutation({
    mutationFn: () => api.portfolioClvSync(token),
    onSuccess: invalidate,
  })
  const resultsMut = useMutation({
    mutationFn: () => api.portfolioUpdateResults(token),
    onSuccess: invalidate,
  })
  const reconMut = useMutation({
    mutationFn: () => api.portfolioReconcile(token),
    onSuccess: () => {
      invalidate()
      void reconQ.refetch()
    },
  })

  const scopeHint =
    summary?.scope === 'telegram'
      ? `Portefeuille Telegram @${user?.telegram_username ?? summary.telegram_user_id}`
      : 'Portefeuille global (tous les paris SQLite)'

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Mon portefeuille"
        title="Suivi des paris"
        subtitle={`${scopeHint} — bankroll Kelly, P/L, CLV et actions ops comme Streamlit.`}
        stats={
          br
            ? [
                { label: 'BR dispo', value: `${br.available_eur.toFixed(0)} €`, highlight: true },
                {
                  label: 'P/L net',
                  value: fmtEur(summary?.total_profit_eur ?? br.settled_profit_eur, 0),
                  highlight: (summary?.total_profit_eur ?? 0) >= 0,
                },
                { label: 'ROI', value: fmtPct(summary?.roi_pct) },
                { label: 'Ouverts', value: String(summary?.n_bets_open ?? 0) },
              ]
            : undefined
        }
      />

      {loading && !summary ? (
        <p className="text-sm text-muted">Chargement du portefeuille…</p>
      ) : !summary || summary.n_total === 0 ? (
        <EmptyState
          title="Aucun pari enregistré"
          hint="Confirme un pick depuis Paris du jour ou le Live Tracker pour alimenter le portefeuille."
        />
      ) : (
        <>
          {kelly && kelly.n_bets > 0 && (
            <Card variant="default" className="p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">Bankroll Kelly (app)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatTile label="Paris Kelly" value={String(kelly.n_bets)} className="px-4 py-3" />
                <StatTile label="En cours" value={String(kelly.n_open)} className="px-4 py-3" />
                <StatTile label="BR dispo" value={`${br?.available_eur.toFixed(2) ?? '—'} €`} className="px-4 py-3" highlight />
                <StatTile label="Engagé" value={`${br?.committed_open_eur.toFixed(2) ?? '—'} €`} className="px-4 py-3" />
                <StatTile label="Capital total" value={`${br?.equity_eur.toFixed(2) ?? '—'} €`} className="px-4 py-3" />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <StatTile label="Profit net (clos)" value={fmtEur(kelly.settled_profit_eur)} className="px-4 py-3" />
                <StatTile label="ROI clôturé" value={fmtPct(kelly.roi_pct)} className="px-4 py-3" />
                <StatTile label="Winrate clos" value={fmtPct(kelly.win_rate_pct)} className="px-4 py-3" />
              </div>
              {kelly.n_top5 > 0 && (
                <p className="mt-2 text-xs text-muted">{kelly.n_top5} pari(s) Paris du jour inclus.</p>
              )}
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[
              { label: 'Paris totaux', value: String(summary.n_total) },
              { label: 'Gagnés', value: String(summary.n_won) },
              { label: 'Perdus', value: String(summary.n_lost) },
              { label: 'Annulés', value: String(summary.n_void) },
              { label: 'Winrate', value: fmtPct(summary.win_rate_pct) },
              { label: 'Mises totales', value: `${summary.total_staked_eur.toFixed(1)} €` },
              { label: 'Cote moy.', value: summary.avg_odds.toFixed(2) },
            ].map((k) => (
              <StatTile key={k.label} label={k.label} value={k.value} className="px-4 py-3" />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              {(summary.daily_curve?.length ?? 0) > 0 && (
                <Card variant="default" className="p-4">
                  <p className="mb-3 text-xs uppercase tracking-wide text-muted">Évolution du profit cumulé</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={summary.daily_curve}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
                      <XAxis dataKey="date" tick={{ fill: BRAND.muted, fontSize: 10 }} />
                      <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="cumulative_profit_eur"
                        stroke={BRAND.lime}
                        strokeWidth={2}
                        dot={false}
                        name="P/L cumulé"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-xs text-muted">
                    Drawdown max {fmtPct(summary.max_drawdown_pct)} · agrégé par jour de match
                  </p>
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={summary.daily_curve}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{ fill: BRAND.muted, fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Area
                        type="monotone"
                        dataKey="drawdown_pct"
                        stroke="#FF4757"
                        fill="rgba(255,71,87,0.15)"
                        name="Drawdown %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {summary.clv && (
                <Card variant="default" className="p-4">
                  <p className="mb-3 text-xs uppercase tracking-wide text-muted">Closing Line Value (CLV)</p>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile label="CLV moyenne" value={`${summary.clv.mean_pct >= 0 ? '+' : ''}${summary.clv.mean_pct.toFixed(2)}%`} />
                    <StatTile label="CLV médiane" value={`${summary.clv.median_pct >= 0 ? '+' : ''}${summary.clv.median_pct.toFixed(2)}%`} />
                    <StatTile label="Avec closing" value={`${summary.clv.n_with_closing}/${summary.n_total}`} />
                    <StatTile label="Couverture" value={fmtPct(summary.clv.coverage_pct)} />
                  </div>
                  {(summary.clv_curve?.length ?? 0) > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={summary.clv_curve}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
                        <XAxis dataKey="date" tick={{ fill: BRAND.muted, fontSize: 10 }} />
                        <YAxis yAxisId="clv" tick={{ fill: BRAND.muted, fontSize: 10 }} />
                        <YAxis yAxisId="pl" orientation="right" tick={{ fill: BRAND.muted, fontSize: 10 }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Line yAxisId="clv" type="monotone" dataKey="cum_clv_pct" stroke={BRAND.teal} dot={false} name="CLV cumulée %" />
                        <Line yAxisId="pl" type="monotone" dataKey="cum_profit_eur" stroke={BRAND.lime} dot={false} name="P/L cumulé €" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {summary.clv_by_tour.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs text-muted">CLV par circuit</p>
                        <div className="space-y-1 text-sm">
                          {summary.clv_by_tour.map((r) => (
                            <div key={r.tour} className="flex justify-between border-b border-border/50 py-1">
                              <span>{r.tour}</span>
                              <span className="quant text-teal">{r.clv_mean_pct >= 0 ? '+' : ''}{r.clv_mean_pct.toFixed(2)}% · n={r.n}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {summary.clv_by_segment.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs text-muted">CLV par segment</p>
                        <div className="space-y-1 text-sm">
                          {summary.clv_by_segment.slice(0, 8).map((r) => (
                            <div key={r.segment} className="flex justify-between border-b border-border/50 py-1">
                              <span className="truncate pr-2">{r.segment}</span>
                              <span className="quant shrink-0 text-teal">{r.clv_mean_pct >= 0 ? '+' : ''}{r.clv_mean_pct.toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            <Card variant="elevated" className="h-fit p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">Actions</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={clvMut.isPending}
                  onClick={() => clvMut.mutate()}
                >
                  {clvMut.isPending ? 'CLV…' : 'Forcer MAJ CLV'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={resultsMut.isPending}
                  onClick={() => resultsMut.mutate()}
                >
                  {resultsMut.isPending ? 'Résultats…' : 'Mettre à jour résultats'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={reconMut.isPending}
                  onClick={() => reconMut.mutate()}
                >
                  {reconMut.isPending
                    ? 'Réconciliation…'
                    : `Réconciliation 3 sources${reconQ.data?.due ? ' ⏰' : ''}`}
                </Button>
              </div>
              {reconQ.data && (
                <p className="mt-3 text-xs text-muted">
                  {reconQ.data.days_since == null
                    ? 'Réconciliation jamais exécutée'
                    : `Dernière réconciliation : il y a ${reconQ.data.days_since.toFixed(1)} j`}
                </p>
              )}
              {(clvMut.data || resultsMut.data || reconMut.data) && (
                <p className="mt-2 text-xs text-success">
                  {clvMut.data && `CLV : ${clvMut.data.updated} mis à jour. `}
                  {resultsMut.data && `${resultsMut.data.updated} pari(s) résolus. `}
                  {reconMut.data?.summary &&
                    `${String(reconMut.data.summary.checked ?? '?')} vérifiés.`}
                </p>
              )}
              {(clvMut.error || resultsMut.error || reconMut.error) && (
                <p className="mt-2 text-xs text-danger">{String(clvMut.error ?? resultsMut.error ?? reconMut.error)}</p>
              )}
            </Card>
          </div>

          <Card variant="default" className="p-4">
            <div className="mb-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm">
                <FieldLabel>Statut</FieldLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-sm">
                <FieldLabel>Mise min (€)</FieldLabel>
                <Input type="number" quant min={0} step={0.5} value={minStake} onChange={(e) => setMinStake(Number(e.target.value))} />
              </label>
              <label className="text-sm">
                <FieldLabel>Tri</FieldLabel>
                <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            {pending.length > 0 && statusFilter !== 'Gagné' && statusFilter !== 'Perdu' && statusFilter !== 'Annulé' && (
              <div className="mb-6">
                <p className="mb-3 text-xs uppercase tracking-wide text-muted">Paris en attente</p>
                <div className="space-y-2">
                  {pending.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{b.match_name}</p>
                        <p className="text-sm text-muted">
                          {b.bet_on} · @{b.odds?.toFixed(2)} · {b.stake?.toFixed(2)} €
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={settleMut.isPending}
                          onClick={() => settleMut.mutate({ id: b.id, status: 'Gagné' })}
                        >
                          Gagné
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={settleMut.isPending}
                          onClick={() => settleMut.mutate({ id: b.id, status: 'Perdu' })}
                        >
                          Perdu
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="mb-3 text-xs uppercase tracking-wide text-muted">Historique ({bets.length})</p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">Match (jour)</th>
                    <th className="px-3 py-2">Pari (jour)</th>
                    <th className="px-3 py-2">Match</th>
                    <th className="px-3 py-2">Sélection</th>
                    <th className="px-3 py-2">Cote</th>
                    <th className="px-3 py-2">Mise</th>
                    <th className="px-3 py-2">P/L</th>
                    <th className="px-3 py-2">CLV</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {bets.map((b) => (
                    <tr key={b.id} className="border-b border-border/70 last:border-0 hover:bg-bg-elevated/50">
                      <td className="px-3 py-2 text-muted">{b.match_date ?? '—'}</td>
                      <td className="px-3 py-2 text-muted">{b.date ?? '—'}</td>
                      <td className="max-w-[180px] truncate px-3 py-2">{b.match_name}</td>
                      <td className="px-3 py-2 font-medium">{b.bet_on}</td>
                      <td className="quant px-3 py-2">@{b.odds?.toFixed(2)}</td>
                      <td className="quant px-3 py-2">{b.stake?.toFixed(2)} €</td>
                      <td className={`quant px-3 py-2 ${(b.profit ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                        {b.profit != null ? fmtEur(b.profit) : '—'}
                      </td>
                      <td className="quant px-3 py-2 text-teal">
                        {b.clv_score != null ? `${(b.clv_score * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">{trackerLabel(b.tracker_source)}</td>
                      <td className="px-3 py-2">
                        <Badge tone={statusTone(b.status)}>{b.status || '—'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
