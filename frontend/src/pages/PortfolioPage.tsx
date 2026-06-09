import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { BankrollAdjustModal } from '../components/BankrollAdjustModal'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { FieldLabel, Input, Select } from '../components/ui/input'
import { StatTile } from '../components/ui/stat-tile'
import { useAuth } from '../context/AuthContext'
import { BRAND, CHART_TOOLTIP_STYLE } from '../lib/brand'
import { API_BET_STATUSES, translateBetStatus, type ApiBetStatusFilter } from '../lib/betStatus'

const SORT_OPTION_KEYS = [
  { value: 'recent', labelKey: 'portfolioExt.sortRecent' },
  { value: 'oldest', labelKey: 'portfolioExt.sortOldest' },
  { value: 'profit_desc', labelKey: 'portfolioExt.sortProfitDesc' },
  { value: 'profit_asc', labelKey: 'portfolioExt.sortProfitAsc' },
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

function trackerLabel(src: string | undefined, t: (key: string) => string) {
  const map: Record<string, string> = {
    telegram_bet: t('portfolioExt.trackerTelegram'),
    live_tracker: t('portfolioExt.trackerLive'),
    top5_proba_action: t('portfolioExt.trackerParis'),
    live_inplay_manual: t('portfolioExt.trackerInplay'),
    live_tracker_web: t('portfolioExt.trackerWeb'),
  }
  const key = (src ?? '').trim()
  if (!key) return t('portfolioExt.trackerLegacy')
  return map[key] ?? key
}

type PortfolioPageProps = {
  summary: PortfolioSummary | null
  bets: BetRow[]
  loading?: boolean
  onRefresh?: () => void
}

export function PortfolioPage({ summary: summaryProp, bets: betsProp, loading: loadingProp, onRefresh }: PortfolioPageProps) {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<ApiBetStatusFilter>('Tous')
  const [minStake, setMinStake] = useState(0)
  const [sort, setSort] = useState<(typeof SORT_OPTION_KEYS)[number]['value']>('recent')
  const [brAdjustMode, setBrAdjustMode] = useState<'add' | 'withdraw' | null>(null)

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
    void qc.invalidateQueries({ queryKey: ['live-value-bets'] })
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
      ? t('portfolio.scopeTelegram', { handle: user?.telegram_username ?? summary.telegram_user_id })
      : summary?.scope === 'web'
        ? t('portfolio.scopeWeb', { name: user?.display_name ?? user?.username ?? 'compte' })
        : t('portfolio.scopeGuest')

  const canAdjustBankroll = !!user && !!br && summary?.scope !== 'unlinked'
  const bankrollAvail = br?.available_eur ?? 0

  return (
    <div className="space-y-6">
      <PageHero
        kicker={t('portfolio.kicker')}
        title={t('portfolio.title')}
        subtitle={`${scopeHint} ${t('portfolio.subtitleSuffix')}`}
        stats={
          br
            ? [
                { label: t('header.available'), value: `${br.available_eur.toFixed(0)} €`, highlight: true },
                {
                  label: t('portfolio.netPl'),
                  value: fmtEur(summary?.total_profit_eur ?? br.settled_profit_eur, 0),
                  highlight: (summary?.total_profit_eur ?? 0) >= 0,
                },
                { label: t('portfolio.roi'), value: fmtPct(summary?.roi_pct) },
                { label: t('portfolio.open'), value: String(summary?.n_bets_open ?? 0) },
              ]
            : undefined
        }
      />

      {loading && !summary ? (
        <p className="text-sm text-muted">{t('portfolio.loading')}</p>
      ) : (
        <>
          {br && (
            <Card variant="default" className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wide text-muted">{t('portfolio.bankroll')}</p>
                {canAdjustBankroll && (
                  <div className="flex gap-2">
                    <Button variant="success" size="sm" onClick={() => setBrAdjustMode('add')}>
                      {t('portfolioExt.add')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setBrAdjustMode('withdraw')}>
                      {t('portfolioExt.withdraw')}
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label={t('portfolioExt.brAvail')} value={`${bankrollAvail.toFixed(2)} €`} className="px-4 py-3" highlight />
                <StatTile label={t('portfolioExt.reference')} value={`${br.start_eur?.toFixed(2) ?? '—'} €`} className="px-4 py-3" />
                <StatTile label={t('portfolioExt.committed')} value={`${br.committed_open_eur.toFixed(2)} €`} className="px-4 py-3" />
                <StatTile label={t('portfolioExt.totalCapital')} value={`${br.equity_eur.toFixed(2)} €`} className="px-4 py-3" />
              </div>
              {br.manual_adjust_eur != null && Math.abs(br.manual_adjust_eur) > 1e-6 && (
                <p className="mt-2 text-xs text-muted">
                  {t('portfolioExt.manualAdjust')} : {br.manual_adjust_eur >= 0 ? '+' : ''}
                  {br.manual_adjust_eur.toFixed(2)} €
                </p>
              )}
              {user && summary?.scope === 'telegram' && (
                <p className="mt-2 text-xs text-muted">
                  {t('portfolioExt.telegramSync')}
                </p>
              )}
            </Card>
          )}

          {!summary || summary.n_total === 0 ? (
            <EmptyState
              title={t('portfolioExt.emptyTitle')}
              hint={t('portfolioExt.emptyHint')}
            />
          ) : (
        <>
          {kelly && kelly.n_bets > 0 && (
            <Card variant="default" className="p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('portfolioExt.kellyBankroll')}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatTile label={t('portfolioExt.kellyBets')} value={String(kelly.n_bets)} className="px-4 py-3" />
                <StatTile label={t('common.statusOpen')} value={String(kelly.n_open)} className="px-4 py-3" />
                <StatTile label={t('portfolioExt.brAvail')} value={`${br?.available_eur.toFixed(2) ?? '—'} €`} className="px-4 py-3" highlight />
                <StatTile label={t('portfolioExt.committed')} value={`${br?.committed_open_eur.toFixed(2) ?? '—'} €`} className="px-4 py-3" />
                <StatTile label={t('portfolioExt.totalCapital')} value={`${br?.equity_eur.toFixed(2) ?? '—'} €`} className="px-4 py-3" />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <StatTile label={t('portfolioExt.closedProfit')} value={fmtEur(kelly.settled_profit_eur)} className="px-4 py-3" />
                <StatTile label={t('portfolioExt.closedRoi')} value={fmtPct(kelly.roi_pct)} className="px-4 py-3" />
                <StatTile label={t('portfolioExt.closedWinrate')} value={fmtPct(kelly.win_rate_pct)} className="px-4 py-3" />
              </div>
              {kelly.n_top5 > 0 && (
                <p className="mt-2 text-xs text-muted">{t('portfolioExt.top5Included', { count: kelly.n_top5 })}</p>
              )}
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[
              { label: t('portfolioExt.totalBets'), value: String(summary.n_total) },
              { label: t('portfolioExt.won'), value: String(summary.n_won) },
              { label: t('portfolioExt.lost'), value: String(summary.n_lost) },
              { label: t('portfolioExt.void'), value: String(summary.n_void) },
              { label: t('portfolioExt.winrate'), value: fmtPct(summary.win_rate_pct) },
              { label: t('portfolioExt.totalStaked'), value: `${summary.total_staked_eur.toFixed(1)} €` },
              { label: t('portfolioExt.avgOdds'), value: summary.avg_odds.toFixed(2) },
            ].map((k) => (
              <StatTile key={k.label} label={k.label} value={k.value} className="px-4 py-3" />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              {(summary.daily_curve?.length ?? 0) > 0 && (
                <Card variant="default" className="p-4">
                  <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('portfolioExt.cumulativePl')}</p>
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
                        name={t('portfolioExt.cumulativePlChart')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-xs text-muted">
                    {t('portfolioExt.drawdownHint', { pct: fmtPct(summary.max_drawdown_pct) })}
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
                        name={t('portfolioExt.drawdownPct')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {summary.clv && (
                <Card variant="default" className="p-4">
                  <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('portfolioExt.clvTitle')}</p>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile label={t('portfolioExt.clvMean')} value={`${summary.clv.mean_pct >= 0 ? '+' : ''}${summary.clv.mean_pct.toFixed(2)}%`} />
                    <StatTile label={t('portfolioExt.clvMedian')} value={`${summary.clv.median_pct >= 0 ? '+' : ''}${summary.clv.median_pct.toFixed(2)}%`} />
                    <StatTile label={t('portfolioExt.withClosing')} value={`${summary.clv.n_with_closing}/${summary.n_total}`} />
                    <StatTile label={t('portfolioExt.coverage')} value={fmtPct(summary.clv.coverage_pct)} />
                  </div>
                  {(summary.clv_curve?.length ?? 0) > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={summary.clv_curve}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
                        <XAxis dataKey="date" tick={{ fill: BRAND.muted, fontSize: 10 }} />
                        <YAxis yAxisId="clv" tick={{ fill: BRAND.muted, fontSize: 10 }} />
                        <YAxis yAxisId="pl" orientation="right" tick={{ fill: BRAND.muted, fontSize: 10 }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Line yAxisId="clv" type="monotone" dataKey="cum_clv_pct" stroke={BRAND.teal} dot={false} name={t('portfolioExt.clvCumulative')} />
                        <Line yAxisId="pl" type="monotone" dataKey="cum_profit_eur" stroke={BRAND.lime} dot={false} name={t('portfolioExt.cumulativePlChart')} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {summary.clv_by_tour.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs text-muted">{t('portfolioExt.clvByTour')}</p>
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
                        <p className="mb-2 text-xs text-muted">{t('portfolioExt.clvBySegment')}</p>
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
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('portfolioExt.actions')}</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={clvMut.isPending}
                  onClick={() => clvMut.mutate()}
                >
                  {clvMut.isPending ? t('portfolioExt.clvPending') : t('portfolioExt.forceClv')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={resultsMut.isPending}
                  onClick={() => resultsMut.mutate()}
                >
                  {resultsMut.isPending ? t('portfolioExt.resultsPending') : t('portfolioExt.updateResults')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={reconMut.isPending}
                  onClick={() => reconMut.mutate()}
                >
                  {reconMut.isPending
                    ? t('portfolioExt.reconPending')
                    : `${t('portfolioExt.reconcile3')}${reconQ.data?.due ? ' ⏰' : ''}`}
                </Button>
              </div>
              {reconQ.data && (
                <p className="mt-3 text-xs text-muted">
                  {reconQ.data.days_since == null
                    ? t('portfolioExt.reconNever')
                    : t('portfolioExt.reconLast', { days: reconQ.data.days_since.toFixed(1) })}
                </p>
              )}
              {(clvMut.data || resultsMut.data || reconMut.data) && (
                <p className="mt-2 text-xs text-success">
                  {clvMut.data && t('portfolioExt.clvUpdated', { count: clvMut.data.updated }) + ' '}
                  {resultsMut.data && t('portfolioExt.betsResolved', { count: resultsMut.data.updated }) + ' '}
                  {reconMut.data?.summary &&
                    t('portfolioExt.checked', { count: String(reconMut.data.summary.checked ?? '?') })}
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
                <FieldLabel>{t('portfolioExt.statusFilter')}</FieldLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                  {API_BET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {translateBetStatus(s, t)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-sm">
                <FieldLabel>{t('portfolioExt.minStake')}</FieldLabel>
                <Input type="number" quant min={0} step={0.5} value={minStake} onChange={(e) => setMinStake(Number(e.target.value))} />
              </label>
              <label className="text-sm">
                <FieldLabel>{t('portfolioExt.sort')}</FieldLabel>
                <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                  {SORT_OPTION_KEYS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            {pending.length > 0 && statusFilter !== 'Gagné' && statusFilter !== 'Perdu' && statusFilter !== 'Annulé' && (
              <div className="mb-6">
                <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('portfolioExt.pendingBets')}</p>
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
                          {t('common.statusWon')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={settleMut.isPending}
                          onClick={() => settleMut.mutate({ id: b.id, status: 'Perdu' })}
                        >
                          {t('common.statusLost')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('portfolioExt.history', { count: bets.length })}</p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">{t('portfolioExt.colMatchDay')}</th>
                    <th className="px-3 py-2">{t('portfolioExt.colBetDay')}</th>
                    <th className="px-3 py-2">{t('portfolioExt.colMatch')}</th>
                    <th className="px-3 py-2">{t('portfolioExt.colSelection')}</th>
                    <th className="px-3 py-2">{t('portfolioExt.colOdds')}</th>
                    <th className="px-3 py-2">{t('portfolioExt.colStake')}</th>
                    <th className="px-3 py-2">{t('portfolioExt.colPl')}</th>
                    <th className="px-3 py-2">{t('portfolioExt.colClv')}</th>
                    <th className="px-3 py-2">{t('portfolioExt.colSource')}</th>
                    <th className="px-3 py-2">{t('portfolioExt.colStatus')}</th>
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
                      <td className="px-3 py-2 text-xs text-muted">{trackerLabel(b.tracker_source, t)}</td>
                      <td className="px-3 py-2">
                        <Badge tone={statusTone(b.status)}>{translateBetStatus(b.status, t)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
          )}
        </>
      )}

      <BankrollAdjustModal
        open={brAdjustMode != null}
        mode={brAdjustMode ?? 'add'}
        availableEur={bankrollAvail}
        onClose={() => setBrAdjustMode(null)}
        onSuccess={invalidate}
      />
    </div>
  )
}
