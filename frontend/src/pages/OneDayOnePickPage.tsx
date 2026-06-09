import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, type OneDayOnePickRow } from '../api/client'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { PickCard } from '../components/PickCard'
import { PickMatchupDisplay } from '../components/PickMatchupDisplay'
import { Card } from '../components/ui/card'
import { StatTile } from '../components/ui/stat-tile'
import { BRAND, CHART_TOOLTIP_STYLE } from '../lib/brand'
import { formatTennisScoreDisplay } from '../lib/scoreDisplay'
import { ShareTrackRecord } from '../components/ShareTrackRecord'
import { SeoEditorial } from '../components/SeoEditorial'
import { getOneDayOnePickEditorial } from '../lib/seo'
import { translateBetStatus } from '../lib/betStatus'
import { cn } from '../lib/utils'

function pickScore(p: OneDayOnePickRow): string {
  return p.score_display ?? formatTennisScoreDisplay(p.score_final) ?? '—'
}

function statusTone(pick: OneDayOnePickRow): 'success' | 'danger' | 'accent' | 'default' {
  if (pick.won) return 'success'
  if (pick.lost) return 'danger'
  if (pick.open) return 'accent'
  return 'default'
}

export function OneDayOnePickPage() {
  const { t, i18n } = useTranslation()
  const editorial = getOneDayOnePickEditorial(i18n.language)

  function statusLabel(pick: OneDayOnePickRow): string {
    if (pick.status) return translateBetStatus(pick.status, t)
    if (pick.won) return t('common.statusWon')
    if (pick.lost) return t('common.statusLost')
    if (pick.open) return t('common.statusOpen')
    return '—'
  }

  const q = useQuery({
    queryKey: ['one-day-one-pick'],
    queryFn: () => api.picksOneDayOnePick(),
    refetchInterval: 10 * 60 * 1000,
  })

  const summary = q.data?.summary
  const picks = q.data?.picks ?? []
  const pickToday = q.data?.pick_today ?? null
  const todayDate = q.data?.today_date
  const curve = q.data?.curve ?? []
  const period = q.data?.period

  return (
    <div>
      <PageHero
        kicker={t('oneDayOnePick.kicker')}
        title={t('oneDayOnePick.title')}
        subtitle={t('oneDayOnePick.subtitle')}
        stats={
          summary
            ? [
                { label: t('oneDayOnePick.initialBr'), value: '100 €' },
                { label: t('oneDayOnePick.picks'), value: String(summary.n_picks), highlight: true },
                { label: t('oneDayOnePick.hitPct'), value: `${summary.hit_pct.toFixed(1)}%` },
                {
                  label: t('oneDayOnePick.netPl'),
                  value: `${summary.net_profit_eur >= 0 ? '+' : ''}${summary.net_profit_eur.toFixed(0)} €`,
                },
                { label: t('oneDayOnePick.finalBr'), value: `${summary.bankroll_final_eur.toFixed(0)} €` },
              ]
            : [{ label: t('oneDayOnePick.initialBr'), value: '100 €' }]
        }
      />

      <ShareTrackRecord />

      {q.isLoading ? (
        <p className="text-sm text-muted">{t('oneDayOnePick.loading')}</p>
      ) : q.isError ? (
        <EmptyState
          title={t('oneDayOnePick.errorTitle')}
          hint={q.error instanceof Error ? q.error.message : t('oneDayOnePick.errorHint')}
        />
      ) : picks.length === 0 && !pickToday ? (
        <EmptyState title={t('oneDayOnePick.emptyTitle')} hint={t('oneDayOnePick.emptyHint')} />
      ) : (
        <div className="space-y-6">
          {pickToday && (
            <section>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{t('oneDayOnePick.pickOfDay')}</p>
                <Badge tone="accent">{todayDate ?? pickToday.calendar_date}</Badge>
                {pickToday.source === 'live' && <Badge tone="default">{t('oneDayOnePick.liveSnapshot')}</Badge>}
                {pickToday.won && <Badge tone="success">{t('common.statusWon')}</Badge>}
                {pickToday.lost && <Badge tone="danger">{t('common.statusLost')}</Badge>}
                {pickToday.open && !pickToday.won && !pickToday.lost && (
                  <Badge tone="accent">{t('common.statusOpen')}</Badge>
                )}
              </div>
              <PickCard pick={{ ...pickToday, rank: pickToday.day_rank }} index={0} featured showResult />
            </section>
          )}

          {period?.start_date && period.end_date && (
            <p className="text-sm text-muted">
              {t('oneDayOnePick.period', {
                start: period.start_date,
                end: period.end_date,
                days: period.n_days,
              })}
            </p>
          )}

          {summary && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  key: 'netPl',
                  label: t('oneDayOnePick.netPl'),
                  value: `${summary.net_profit_eur >= 0 ? '+' : ''}${summary.net_profit_eur.toFixed(0)} €`,
                },
                { key: 'growth', label: t('oneDayOnePick.growth'), value: `${summary.growth_pct.toFixed(1)}%` },
                { key: 'roi', label: t('oneDayOnePick.roiStaked'), value: `${summary.roi_on_staked_pct.toFixed(1)}%` },
                { key: 'dd', label: t('oneDayOnePick.maxDd'), value: `${summary.max_drawdown_pct.toFixed(1)}%` },
              ].map((k) => (
                <StatTile key={k.key} label={k.label} value={k.value} className="px-4 py-3" />
              ))}
            </div>
          )}

          {curve.length > 0 && (
            <Card variant="default" className="p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('oneDayOnePick.cumulativeCurve')}</p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={curve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
                  <XAxis dataKey="date" tick={{ fill: BRAND.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="bankroll" stroke={BRAND.teal} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-panel">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t('oneDayOnePick.colDate')}</th>
                  <th className="px-4 py-3">{t('oneDayOnePick.colMatch')}</th>
                  <th className="px-4 py-3">{t('oneDayOnePick.colTournament')}</th>
                  <th className="px-4 py-3">{t('oneDayOnePick.colProba')}</th>
                  <th className="px-4 py-3">{t('oneDayOnePick.colEv')}</th>
                  <th className="px-4 py-3">{t('oneDayOnePick.colOdds')}</th>
                  <th className="px-4 py-3">{t('oneDayOnePick.colStakePct')}</th>
                  <th className="px-4 py-3">{t('oneDayOnePick.colResult')}</th>
                  <th className="px-4 py-3">{t('oneDayOnePick.colScore')}</th>
                </tr>
              </thead>
              <tbody>
                {picks.map((p) => (
                  <tr
                    key={`${p.calendar_date}-${p.day_rank}`}
                    className={cn(
                      'border-b border-border/70 last:border-0 hover:bg-bg-elevated/60',
                      p.is_today && 'bg-accent/5',
                    )}
                  >
                    <td className="quant px-4 py-3 font-semibold text-accent">{p.day_rank}</td>
                    <td className="quant px-4 py-3 text-muted">{p.calendar_date}</td>
                    <td className="px-4 py-3">
                      <PickMatchupDisplay pick={p} variant="compact" showLabel={false} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span className="text-xs uppercase text-accent/80">{p.tour}</span>
                      <span className="block truncate">{p.tournament}</span>
                    </td>
                    <td className="quant px-4 py-3 text-success">{p.p_model_pct?.toFixed(1)}%</td>
                    <td className="quant px-4 py-3 text-success">
                      {p.ev_fav_pct != null ? `+${p.ev_fav_pct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="quant px-4 py-3">@{p.odd_fav?.toFixed(2) ?? '—'}</td>
                    <td className="quant px-4 py-3">
                      {p.theoretical_stake_pct != null ? `${p.theoretical_stake_pct.toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(p)}>{statusLabel(p)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{pickScore(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SeoEditorial
        title={editorial.title}
        paragraphs={editorial.paragraphs}
        links={editorial.links}
      />
    </div>
  )
}
