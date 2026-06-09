import { useQuery } from '@tanstack/react-query'
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
import { ONE_DAY_ONE_PICK_EDITORIAL } from '../lib/seo'
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

function statusLabel(pick: OneDayOnePickRow): string {
  if (pick.status) return pick.status
  if (pick.won) return 'Gagné'
  if (pick.lost) return 'Perdu'
  if (pick.open) return 'En cours'
  return '—'
}

export function OneDayOnePickPage() {
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
        kicker="Public replay"
        title="1 Day 1 Pick"
        subtitle="Un pick par jour calendaire sur les tournois majeurs : meilleur rank=1 entre ATP et WTA (proba favori modèle max). Bankroll initiale fixe de 100 € — courbe et P/L calculés sur cette base. Le pick du jour se met à jour depuis le snapshot live ; l'historique s'allonge automatiquement."
        stats={
          summary
            ? [
                { label: 'BR initiale', value: '100 €' },
                { label: 'Picks', value: String(summary.n_picks), highlight: true },
                { label: 'Hit %', value: `${summary.hit_pct.toFixed(1)}%` },
                { label: 'P/L net', value: `${summary.net_profit_eur >= 0 ? '+' : ''}${summary.net_profit_eur.toFixed(0)} €` },
                { label: 'BR finale', value: `${summary.bankroll_final_eur.toFixed(0)} €` },
              ]
            : [{ label: 'BR initiale', value: '100 €' }]
        }
      />

      <ShareTrackRecord />

      {q.isLoading ? (
        <p className="text-sm text-muted">Chargement du replay…</p>
      ) : q.isError ? (
        <EmptyState
          title="Impossible de charger le replay"
          hint={q.error instanceof Error ? q.error.message : 'Réessaie dans quelques instants.'}
        />
      ) : picks.length === 0 && !pickToday ? (
        <EmptyState
          title="Aucun pick dans le périmètre"
          hint="Aucun majeur rank=1 avec EV 15–100 % aujourd'hui. L'historique se remplit au fil des captures daemon."
        />
      ) : (
        <div className="space-y-6">
          {pickToday && (
            <section>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Pick du jour</p>
                <Badge tone="accent">{todayDate ?? pickToday.calendar_date}</Badge>
                {pickToday.source === 'live' && <Badge tone="default">Snapshot live</Badge>}
                {pickToday.open && <Badge tone="accent">En cours</Badge>}
              </div>
              <PickCard pick={{ ...pickToday, rank: pickToday.day_rank }} index={0} featured />
            </section>
          )}

          {period?.start_date && period.end_date && (
            <p className="text-sm text-muted">
              Période {period.start_date} → {period.end_date} · {period.n_days} jour(s)
            </p>
          )}

          {summary && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: 'P/L net',
                  value: `${summary.net_profit_eur >= 0 ? '+' : ''}${summary.net_profit_eur.toFixed(0)} €`,
                },
                { label: 'Croissance', value: `${summary.growth_pct.toFixed(1)}%` },
                { label: 'ROI misé', value: `${summary.roi_on_staked_pct.toFixed(1)}%` },
                { label: 'Max DD', value: `${summary.max_drawdown_pct.toFixed(1)}%` },
              ].map((k) => (
                <StatTile key={k.label} label={k.label} value={k.value} className="px-4 py-3" />
              ))}
            </div>
          )}

          {curve.length > 0 && (
            <Card variant="default" className="p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">Courbe bankroll cumulative</p>
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
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Match · pari sur le favori</th>
                  <th className="px-4 py-3">Tournoi</th>
                  <th className="px-4 py-3">Proba</th>
                  <th className="px-4 py-3">EV</th>
                  <th className="px-4 py-3">Cote</th>
                  <th className="px-4 py-3">Mise %</th>
                  <th className="px-4 py-3">Résultat</th>
                  <th className="px-4 py-3">Score</th>
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
        title={ONE_DAY_ONE_PICK_EDITORIAL.title}
        paragraphs={ONE_DAY_ONE_PICK_EDITORIAL.paragraphs}
        links={ONE_DAY_ONE_PICK_EDITORIAL.links}
      />
    </div>
  )
}
