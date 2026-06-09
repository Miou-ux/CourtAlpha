import { Link } from 'react-router-dom'
import { BarChart3, Database, Shield, Target, TrendingUp, Zap } from 'lucide-react'
import { Badge } from '../components/Badge'
import { PageHero } from '../components/PageHero'
import { Card } from '../components/ui/card'
import { StatTile } from '../components/ui/stat-tile'
import { COURTALPHA_ABOUT } from '../lib/seo'
import {
  METHODO_BACKTEST_FOOTNOTE,
  METHODO_BACKTEST_ROWS,
  METHODO_DIFFERENTIATORS,
  METHODO_INTRO,
  METHODO_NOT_PUBLISHED,
  METHODO_STRATEGY_TEASER,
  METHODO_VS_COMPETITION,
} from '../lib/methodoContent'

const DIFF_ICONS = [Shield, Database, TrendingUp, Target, Zap] as const

export function MethodoPage() {
  return (
    <div className="space-y-8">
      <PageHero
        kicker="Methodo"
        title="Stratégie & conviction"
        subtitle={METHODO_INTRO.lead}
      />

      <section className="rounded-2xl border border-border bg-panel p-5">
        <h2 className="mb-3 text-lg font-semibold">{COURTALPHA_ABOUT.title}</h2>
        <p className="mb-4 text-sm leading-relaxed text-muted md:text-base">{COURTALPHA_ABOUT.summary}</p>
        <ul className="mb-4 space-y-2 text-sm text-muted">
          {COURTALPHA_ABOUT.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-accent">·</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">{COURTALPHA_ABOUT.disclaimer}</p>
      </section>

      <section className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <p className="text-sm leading-relaxed text-white md:text-base">{METHODO_INTRO.lead}</p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Ce qui me démarque</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {METHODO_DIFFERENTIATORS.map((item, i) => {
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
        <h2 className="mb-1 text-lg font-semibold">La stratégie — en bref</h2>
        <p className="mb-4 text-sm text-muted">
          Vue d’ensemble publique. Les détails d’implémentation restent internes.
        </p>
        <div className="space-y-3">
          {METHODO_STRATEGY_TEASER.map((step) => (
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
          <h2 className="text-lg font-semibold">Extraits backtest</h2>
          <Badge tone="default">Top 5 proba · EV 15–100 %</Badge>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Année</th>
                <th className="px-4 py-3">Paris</th>
                <th className="px-4 py-3">Hit %</th>
                <th className="px-4 py-3">ROI 1u</th>
                <th className="px-4 py-3">Brier</th>
              </tr>
            </thead>
            <tbody>
              {METHODO_BACKTEST_ROWS.map((row) => (
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
        <p className="mt-3 text-xs leading-relaxed text-muted">{METHODO_BACKTEST_FOOTNOTE}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatTile label="Meilleur hit %" value="76,5 %" className="px-4 py-3" />
          <StatTile label="Meilleur ROI 1u" value="+37,9 %" className="px-4 py-3" />
          <StatTile label="Calibration" value="Brier ~0,14–0,19" className="px-4 py-3" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">CourtAlpha vs l’ordinaire</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Ailleurs</th>
                <th className="px-4 py-3">CourtAlpha</th>
              </tr>
            </thead>
            <tbody>
              {METHODO_VS_COMPETITION.map((row) => (
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
        <h2 className="mb-2 text-base font-semibold">Ce que je ne dévoile pas</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted">
          {METHODO_NOT_PUBLISHED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          L’edge vient de l’exécution systématique et de la calibration — pas d’un « secret magique »
          à copier en un clic.
        </p>
      </section>

      <section className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/1-day-1-pick"
          className="rounded-lg bg-accent px-4 py-2 font-medium text-bg hover:opacity-90"
        >
          Voir le track record live
        </Link>
        <Link
          to="/pricing"
          className="rounded-lg border border-border px-4 py-2 text-white hover:border-accent/40"
        >
          Outils Premium
        </Link>
        <Link
          to="/1-day-1-pick/archive"
          className="rounded-lg border border-border px-4 py-2 text-muted hover:border-accent/40 hover:text-white"
        >
          Archives mensuelles
        </Link>
      </section>

      <p className="text-xs text-muted">
        Paris sportifs : risque de perte. 18+. Information statistique — pas un conseil en investissement.
        Les performances passées ne préjugent pas des résultats futurs.
      </p>
    </div>
  )
}
