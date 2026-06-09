import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { PickMatchupDisplay } from '../components/PickMatchupDisplay'
import { archiveMonthPaths } from '../lib/seo'
import { formatTennisScoreDisplay } from '../lib/scoreDisplay'
import { translateBetStatus } from '../lib/betStatus'

function monthLabel(yearMonth: string, locale: string): string {
  const [y, m] = yearMonth.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
}

export function OneDayOnePickArchivePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en-GB' : 'fr-FR'
  const { yearMonth } = useParams<{ yearMonth?: string }>()
  const q = useQuery({
    queryKey: ['one-day-one-pick', 'archive', yearMonth ?? 'index'],
    queryFn: () => api.picksOneDayOnePick(),
    staleTime: 5 * 60 * 1000,
  })

  const months = useMemo(() => archiveMonthPaths(12), [])

  const monthPicks = useMemo(() => {
    if (!yearMonth || !q.data?.picks) return []
    const prefix = `${yearMonth}-`
    return q.data.picks.filter((p) => String(p.calendar_date).startsWith(prefix))
  }, [q.data?.picks, yearMonth])

  const monthStats = useMemo(() => {
    if (!monthPicks.length) return null
    const settled = monthPicks.filter((p) => p.won || p.lost)
    const wins = settled.filter((p) => p.won).length
    const hit = settled.length ? (100 * wins) / settled.length : 0
    return { n: monthPicks.length, settled: settled.length, hit }
  }, [monthPicks])

  function pickStatusLabel(p: { won?: boolean; lost?: boolean; open?: boolean }) {
    if (p.won) return translateBetStatus('Gagné', t)
    if (p.lost) return translateBetStatus('Perdu', t)
    if (p.open) return translateBetStatus('En cours', t)
    return '—'
  }

  if (!yearMonth) {
    return (
      <div>
        <PageHero kicker={t('archive.kicker')} title={t('archive.title')} subtitle={t('archive.subtitle')} />
        {q.isLoading ? (
          <p className="text-sm text-muted">{t('common.loading')}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {months.map((path) => {
              const ym = path.split('/').pop()!
              return (
                <li key={path}>
                  <Link
                    to={path}
                    className="block rounded-xl border border-border bg-panel px-4 py-3 text-sm hover:border-accent/40"
                  >
                    <span className="font-medium text-white">{monthLabel(ym, locale)}</span>
                    <span className="mt-1 block text-xs text-muted">{t('archive.viewMonthPicks')}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-6 text-sm text-muted">
          <Link to="/1-day-1-pick" className="text-accent hover:underline">
            {t('archive.backToReplay')}
          </Link>
        </p>
      </div>
    )
  }

  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return <EmptyState title={t('archive.notFoundTitle')} hint={t('archive.notFoundHint')} />
  }

  const monthName = monthLabel(yearMonth, locale)

  return (
    <div>
      <PageHero
        kicker={t('archive.monthlyKicker')}
        title={monthName}
        subtitle={t('archive.monthSubtitle', { month: monthName })}
        stats={
          monthStats
            ? [
                { label: t('oneDayOnePick.picks'), value: String(monthStats.n), highlight: true },
                { label: t('archive.settled'), value: String(monthStats.settled) },
                { label: t('oneDayOnePick.hitPct'), value: `${monthStats.hit.toFixed(1)}%` },
              ]
            : undefined
        }
      />

      {q.isLoading ? (
        <p className="text-sm text-muted">{t('common.loading')}</p>
      ) : monthPicks.length === 0 ? (
        <EmptyState title={t('archive.emptyMonthTitle')} hint={t('archive.emptyMonthHint')} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">{t('archive.colDate')}</th>
                <th className="px-4 py-3">{t('archive.colMatch')}</th>
                <th className="px-4 py-3">{t('archive.colProba')}</th>
                <th className="px-4 py-3">{t('archive.colEv')}</th>
                <th className="px-4 py-3">{t('archive.colResult')}</th>
                <th className="px-4 py-3">{t('archive.colScore')}</th>
              </tr>
            </thead>
            <tbody>
              {monthPicks.map((p) => (
                <tr key={p.calendar_date} className="border-b border-border/70 last:border-0">
                  <td className="quant px-4 py-3 text-muted">{p.calendar_date}</td>
                  <td className="px-4 py-3">
                    <PickMatchupDisplay pick={p} variant="compact" showLabel={false} />
                  </td>
                  <td className="quant px-4 py-3 text-success">{p.p_model_pct?.toFixed(1)}%</td>
                  <td className="quant px-4 py-3">
                    {p.ev_fav_pct != null ? `+${p.ev_fav_pct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.won ? 'success' : p.lost ? 'danger' : 'accent'}>{pickStatusLabel(p)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {p.score_display ?? formatTennisScoreDisplay(p.score_final) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
        <Link to="/1-day-1-pick/archive" className="text-accent hover:underline">
          {t('archive.allArchives')}
        </Link>
        <Link to="/1-day-1-pick" className="text-accent hover:underline">
          {t('archive.fullReplay')}
        </Link>
      </p>
    </div>
  )
}
