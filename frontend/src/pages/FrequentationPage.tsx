import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { StatTile } from '../components/ui/stat-tile'
import { BRAND, CHART_TOOLTIP_STYLE } from '../lib/brand'
import { useAuth } from '../context/AuthContext'

export function FrequentationPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [days, setDays] = useState(30)

  const q = useQuery({
    queryKey: ['analytics-traffic', days, token],
    queryFn: () => api.analyticsTraffic({ days }, token),
  })

  const summary = q.data?.summary
  const daily = q.data?.daily ?? []
  const topPages = q.data?.top_pages ?? []
  const topSources = q.data?.top_sources ?? []
  const topCountries = q.data?.top_countries ?? []
  const topReferrers = q.data?.top_referrers ?? []
  const hourly = q.data?.hourly_today ?? []

  return (
    <div>
      <PageHero
        kicker={t('frequentation.kicker')}
        title={t('frequentation.title')}
        subtitle={t('frequentation.subtitle')}
        stats={
          summary
            ? [
                { label: t('frequentation.today'), value: String(summary.views_today), highlight: true },
                { label: t('frequentation.visitors'), value: String(summary.unique_today) },
                { label: t('frequentation.days7'), value: String(summary.views_7d) },
                { label: t('frequentation.signedIn'), value: `${summary.authenticated_share_pct.toFixed(0)}%` },
              ]
            : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[7, 14, 30, 90].map((d) => (
          <Button
            key={d}
            type="button"
            variant={days === d ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setDays(d)}
          >
            {t('frequentation.daysShort', { count: d })}
          </Button>
        ))}
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted">{t('common.loading')}</p>
      ) : q.isError ? (
        <EmptyState title={t('frequentation.loadErrorTitle')} hint={String(q.error)} />
      ) : !summary ? (
        <EmptyState title={t('frequentation.emptyTitle')} hint={t('frequentation.emptyHint')} />
      ) : (
        <div className="space-y-6">
          {q.data?.data_since && (
            <p className="text-sm text-muted">
              {t('frequentation.dataSince', { date: q.data.data_since })}
              {summary.views_period === 0 ? t('frequentation.noViewsYet') : null}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label={t('frequentation.viewsYesterday')} value={String(summary.views_yesterday)} className="px-4 py-3" />
            <StatTile label={t('frequentation.uniques7d')} value={String(summary.unique_7d)} className="px-4 py-3" />
            <StatTile label={t('frequentation.viewsPeriod', { days })} value={String(summary.views_period)} className="px-4 py-3" />
            <StatTile label={t('frequentation.uniquesPeriod', { days })} value={String(summary.unique_period)} className="px-4 py-3" />
          </div>

          {daily.some((d) => d.views > 0) && (
            <Card variant="default" className="p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('frequentation.viewsPerDay')}</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
                  <XAxis dataKey="date" tick={{ fill: BRAND.muted, fontSize: 10 }} />
                  <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="views" name={t('frequentation.views')} stroke={BRAND.teal} strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="uniques"
                    name={t('frequentation.visitors')}
                    stroke={BRAND.lime}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {hourly.some((h) => h.views > 0) && (
            <Card variant="default" className="p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted">{t('frequentation.hourlyToday')}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.grid} />
                  <XAxis dataKey="hour" tick={{ fill: BRAND.muted, fontSize: 10 }} tickFormatter={(h) => `${h}h`} />
                  <YAxis tick={{ fill: BRAND.muted, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="views" name={t('frequentation.views')} fill={BRAND.teal} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {topSources.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-panel">
              <p className="border-b border-border bg-bg-elevated px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {t('frequentation.trafficSources')}
              </p>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">{t('frequentation.source')}</th>
                    <th className="px-4 py-3">{t('frequentation.views')}</th>
                    <th className="px-4 py-3">{t('frequentation.visitors')}</th>
                    <th className="px-4 py-3">{t('frequentation.share')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topSources.map((s) => (
                    <tr key={s.source} className="border-b border-border/70 last:border-0 hover:bg-bg-elevated/60">
                      <td className="px-4 py-3 font-medium text-white">{s.label}</td>
                      <td className="quant px-4 py-3">{s.views}</td>
                      <td className="quant px-4 py-3">{s.uniques}</td>
                      <td className="quant px-4 py-3 text-accent">{s.share_pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {topCountries.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-panel">
              <p className="border-b border-border bg-bg-elevated px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {t('frequentation.countries')}
              </p>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">{t('frequentation.country')}</th>
                    <th className="px-4 py-3">{t('frequentation.code')}</th>
                    <th className="px-4 py-3">{t('frequentation.views')}</th>
                    <th className="px-4 py-3">{t('frequentation.visitors')}</th>
                    <th className="px-4 py-3">{t('frequentation.share')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topCountries.map((c) => (
                    <tr
                      key={c.country_code ?? 'unknown'}
                      className="border-b border-border/70 last:border-0 hover:bg-bg-elevated/60"
                    >
                      <td className="px-4 py-3 font-medium text-white">{c.label}</td>
                      <td className="quant px-4 py-3 text-muted">{c.country_code ?? '—'}</td>
                      <td className="quant px-4 py-3">{c.views}</td>
                      <td className="quant px-4 py-3">{c.uniques}</td>
                      <td className="quant px-4 py-3 text-accent">{c.share_pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {topReferrers.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-panel">
              <p className="border-b border-border bg-bg-elevated px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {t('frequentation.referrerDomains')}
              </p>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">{t('frequentation.site')}</th>
                    <th className="px-4 py-3">{t('frequentation.views')}</th>
                    <th className="px-4 py-3">{t('frequentation.share')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topReferrers.map((r) => (
                    <tr key={r.host} className="border-b border-border/70 last:border-0 hover:bg-bg-elevated/60">
                      <td className="quant px-4 py-3 text-white">{r.host}</td>
                      <td className="quant px-4 py-3">{r.views}</td>
                      <td className="quant px-4 py-3 text-accent">{r.share_pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {topPages.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-panel">
              <p className="border-b border-border bg-bg-elevated px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {t('frequentation.visitedPages')}
              </p>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">{t('frequentation.page')}</th>
                    <th className="px-4 py-3">{t('frequentation.route')}</th>
                    <th className="px-4 py-3">{t('frequentation.views')}</th>
                    <th className="px-4 py-3">{t('frequentation.visitors')}</th>
                    <th className="px-4 py-3">{t('frequentation.share')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((p) => (
                    <tr key={p.path} className="border-b border-border/70 last:border-0 hover:bg-bg-elevated/60">
                      <td className="px-4 py-3 font-medium text-white">{p.label}</td>
                      <td className="quant px-4 py-3 text-muted">{p.path}</td>
                      <td className="quant px-4 py-3">{p.views}</td>
                      <td className="quant px-4 py-3">{p.uniques}</td>
                      <td className="quant px-4 py-3 text-accent">{p.share_pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
