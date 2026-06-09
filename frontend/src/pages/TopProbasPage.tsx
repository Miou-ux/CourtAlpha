import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { useAuth } from '../context/AuthContext'
import { BRAND, CHART_TOOLTIP_STYLE } from '../lib/brand'

const TOUR_COLORS: Record<string, string> = { ATP: BRAND.atp, WTA: BRAND.wta, '—': BRAND.muted }

export function TopProbasPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [includeChallengers, setIncludeChallengers] = useState(false)
  const q = useQuery({
    queryKey: ['top-probas', includeChallengers, token],
    queryFn: () => api.picksTopProbas({ include_challengers: includeChallengers }, token),
    enabled: !!token,
  })

  const rows = q.data?.rows ?? []
  const chart = q.data?.chart ?? []

  return (
    <div>
      <PageHero
        kicker={t('topProbas.kicker')}
        title={t('topProbas.title')}
        subtitle={t('topProbas.subtitle')}
        stats={[
          { label: t('topProbas.top'), value: String(rows.length) },
          { label: t('topProbas.pool'), value: String(q.data?.n_pool ?? 0) },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={includeChallengers}
            onChange={(e) => setIncludeChallengers(e.target.checked)}
            className="accent-accent"
          />
          {t('topProbas.includeChallengers')}
        </label>
        {q.data?.snapshot_age_min != null && (
          <span className="text-xs text-muted">
            {t('topProbas.snapshotAge', { min: Math.round(q.data.snapshot_age_min) })}
          </span>
        )}
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted">{t('common.loading')}</p>
      ) : q.isError ? (
        <EmptyState
          title={t('topProbas.loadErrorTitle')}
          hint={q.error instanceof Error ? q.error.message : t('topProbas.loadErrorHint')}
        />
      ) : rows.length === 0 ? (
        <EmptyState title={t('topProbas.emptyTitle')} hint={t('topProbas.emptyHint')} />
      ) : (
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-border p-4">
            <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('topProbas.chartTitle')}</p>
            <div className="h-[max(360px,26px*var(--n))]" style={{ ['--n' as string]: chart.length }}>
              <ResponsiveContainer width="100%" height={Math.max(360, chart.length * 26 + 48)}>
                <BarChart data={chart} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} horizontal={false} />
                  <XAxis type="number" domain={[40, 100]} tick={{ fill: BRAND.muted, fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="favori" width={120} tick={{ fill: '#e8edf5', fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  {[50, 70, 80].map((pct) => (
                    <ReferenceLine key={pct} x={pct} stroke={BRAND.refLine} strokeDasharray="4 4" />
                  ))}
                  <Bar dataKey="proba_model_pct" name={t('topProbas.modelProba')} radius={[0, 4, 4, 0]}>
                    {chart.map((row) => (
                      <Cell key={row.rank} fill={TOUR_COLORS[row.tour] ?? BRAND.navy} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-panel">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t('topProbas.colProba')}</th>
                  <th className="px-4 py-3">{t('topProbas.colFavorite')}</th>
                  <th className="px-4 py-3">{t('topProbas.colOpponent')}</th>
                  <th className="px-4 py-3">{t('topProbas.colTournament')}</th>
                  <th className="px-4 py-3">{t('topProbas.colEvFav')}</th>
                  <th className="px-4 py-3">{t('topProbas.colGapBook')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.rank} className="border-b border-border/70 last:border-0 hover:bg-bg-elevated/50">
                    <td className="quant px-4 py-3 text-muted">{r.rank}</td>
                    <td className="quant px-4 py-3 font-semibold text-accent">{r.proba_fav_pct}%</td>
                    <td className="px-4 py-3 font-medium">{r.favori}</td>
                    <td className="px-4 py-3 text-muted">{r.adversaire}</td>
                    <td className="px-4 py-3 text-muted">{r.tournament}</td>
                    <td className="quant px-4 py-3">
                      {r.ev_fav_pct != null ? `${r.ev_fav_pct >= 0 ? '+' : ''}${r.ev_fav_pct.toFixed(1)}%` : '—'}
                    </td>
                    <td className={`quant px-4 py-3 ${r.gap_warn ? 'text-warning' : ''}`}>
                      {r.gap_pp != null ? `${r.gap_pp.toFixed(1)} pp` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
