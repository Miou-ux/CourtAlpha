import { Link } from 'react-router-dom'
import { BarChart3, Database, Shield, Target, TrendingUp, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '../components/Badge'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/ui/card'
import { StatTile } from '../components/ui/stat-tile'
import { getCourtAlphaAbout } from '../lib/seo'
import * as methodoFr from '../lib/methodoContent'
import * as methodoEn from '../lib/methodoContentEn'

const DIFF_ICONS = [Shield, Database, TrendingUp, Target, Zap] as const

export function MethodoPage() {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language.startsWith('en')
  const content = isEn ? methodoEn : methodoFr
  const about = getCourtAlphaAbout(i18n.language)

  return (
    <div className="space-y-8">
      <PageHero kicker={t('methodo.kicker')} title={t('methodo.title')} subtitle={content.METHODO_INTRO.lead} />

      <section className="rounded-2xl border border-border bg-panel p-5">
        <h2 className="mb-3 text-lg font-semibold">{about.title}</h2>
        <p className="mb-4 text-sm leading-relaxed text-muted md:text-base">{about.summary}</p>
        <ul className="mb-4 space-y-2 text-sm text-muted">
          {about.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-accent">·</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">{about.disclaimer}</p>
      </section>

      <section className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <p className="text-sm leading-relaxed text-white md:text-base">{content.METHODO_INTRO.lead}</p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('methodo.differentiators')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {content.METHODO_DIFFERENTIATORS.map((item, i) => {
            const Icon = DIFF_ICONS[i] ?? Shield
            return (
              <Card key={item.title} variant="default" className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-accent" />
                  <h3 className="font-medium">{item.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </Card>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">{t('methodo.strategyBrief')}</h2>
        <p className="mb-4 text-sm text-muted">{t('methodo.strategyNote')}</p>
        <div className="space-y-3">
          {content.METHODO_STRATEGY_TEASER.map((step) => (
            <div
              key={step.step}
              className="flex gap-4 rounded-2xl border border-border bg-panel p-4"
            >
              <span className="quant text-2xl font-bold text-accent/60">{step.step}</span>
              <div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">{t('methodo.backtestExcerpts')}</h2>
          <Badge tone="default">Top 5 proba · EV 15–100 %</Badge>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">{t('methodo.colYear')}</th>
                <th className="px-4 py-3">{t('methodo.colBets')}</th>
                <th className="px-4 py-3">{t('methodo.colHit')}</th>
                <th className="px-4 py-3">{t('methodo.colRoi')}</th>
                <th className="px-4 py-3">{t('methodo.colBrier')}</th>
              </tr>
            </thead>
            <tbody>
              {content.METHODO_BACKTEST_ROWS.map((row) => (
                <tr key={row.year} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {row.year}
                    {row.note && (
                      <span className="mt-0.5 block text-xs font-normal text-muted">{row.note}</span>
                    )}
                  </td>
                  <td className="quant px-4 py-3 text-muted">{row.bets}</td>
                  <td className="quant px-4 py-3 text-success">{row.hitPct.toFixed(1)}%</td>
                  <td className="quant px-4 py-3 text-success">+{row.roiPct.toFixed(1)}%</td>
                  <td className="quant px-4 py-3 text-muted">{row.brier.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{content.METHODO_BACKTEST_FOOTNOTE}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatTile label={t('methodo.bestHit')} value="76,5 %" className="px-4 py-3" />
          <StatTile label={t('methodo.bestRoi')} value="+37,9 %" className="px-4 py-3" />
          <StatTile label={t('methodo.calibration')} value="Brier ~0,14–0,19" className="px-4 py-3" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('methodo.vsOrdinary')}</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">{t('methodo.elsewhere')}</th>
                <th className="px-4 py-3">CourtAlpha</th>
              </tr>
            </thead>
            <tbody>
              {content.METHODO_VS_COMPETITION.map((row) => (
                <tr key={row.them} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 text-muted">{row.them}</td>
                  <td className="px-4 py-3 text-accent">{row.us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-panel/80 p-5">
        <h2 className="mb-2 text-base font-semibold">{t('methodo.notPublished')}</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted">
          {content.METHODO_NOT_PUBLISHED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{t('methodo.notPublishedNote')}</p>
      </section>

      <section className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/1-day-1-pick"
          className="rounded-lg bg-accent px-4 py-2 font-medium text-bg hover:opacity-90"
        >
          {t('methodo.seeTrackRecord')}
        </Link>
        <Link
          to="/pricing"
          className="rounded-lg border border-border px-4 py-2 text-white hover:border-accent/40"
        >
          {t('methodo.premiumTools')}
        </Link>
        <Link
          to="/1-day-1-pick/archive"
          className="rounded-lg border border-border px-4 py-2 text-muted hover:border-accent/40 hover:text-white"
        >
          {t('methodo.monthlyArchives')}
        </Link>
      </section>

      <p className="text-xs text-muted">{t('methodo.disclaimer')}</p>
    </div>
  )
}
