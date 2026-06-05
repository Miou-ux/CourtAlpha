import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/ui/card'
import { StatTile } from '../components/ui/stat-tile'
import { BRAND, CHART_TOOLTIP_STYLE } from '../lib/brand'
import { useAuth } from '../context/AuthContext'

function pct(v: number | undefined | null, digits = 1) {
  if (v == null || Number.isNaN(v)) return '—'
  return `${(v * 100).toFixed(digits)}%`
}

export function TrackingPage() {
  const { token } = useAuth()
  const q = useQuery({ queryKey: ['tracking', token], queryFn: () => api.tracking(token) })

  const data = q.data
  const g = data?.global
  const drift = data?.drift

  return (
    <div>
      <PageHero
        kicker="Réel vs modèle"
        title="Tracking modèle"
        subtitle="Paris enrichis clos · calibration et drift vs baseline 2025."
        stats={
          g
            ? [
                { label: 'Paris', value: String(g.n) },
                { label: 'Hit réel', value: pct(g.hit) },
                { label: 'ROI réel', value: pct(g.realised_roi) },
              ]
            : undefined
        }
      />

      {q.isLoading ? (
        <p className="text-sm text-muted">Chargement…</p>
      ) : !data?.ok ? (
        <EmptyState title="Pas assez de données" hint={data?.reason ?? 'Place des paris enrichis depuis la web UI.'} />
      ) : (
        <div className="space-y-6">
          {drift && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-panel px-4 py-3">
              <Badge
                tone={
                  drift.level === 'green'
                    ? 'success'
                    : drift.level === 'amber'
                      ? 'accent'
                      : drift.level === 'red'
                        ? 'danger'
                        : 'default'
                }
              >
                {drift.level}
              </Badge>
              <p className="text-sm">{drift.message}</p>
            </div>
          )}

          {g && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Hit attendu', value: pct(g.expected_hit) },
                { label: 'ROI attendu', value: pct(g.expected_roi) },
                { label: 'Brier', value: g.brier.toFixed(3) },
                { label: 'Brier baseline', value: g.baseline_brier.toFixed(3) },
              ].map((k) => (
                <StatTile key={k.label} label={k.label} value={k.value} className="px-4 py-3" />
              ))}
            </div>
          )}

          {(data.calibration?.length ?? 0) > 0 && (
            <Card variant="default" className="p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">Calibration (déciles p_model)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={(data.calibration ?? []).map((c) => ({
                    ...c,
                    bin_label: `${(c.mean_p * 100).toFixed(0)}%`,
                    observed_hit: c.observed,
                    mean_p_model: c.mean_p,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
                  <XAxis dataKey="bin_label" tick={{ fill: BRAND.muted, fontSize: 10 }} />
                  <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="observed_hit" fill={BRAND.teal} name="Hit observé" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mean_p_model" fill={BRAND.lime} name="Prédit moyen" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
