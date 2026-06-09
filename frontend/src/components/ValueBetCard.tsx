import { useMemo, useState } from 'react'
import { ChevronDown, Target } from 'lucide-react'
import type { LiveValueBet } from '../api/client'
import { cn } from '../lib/utils'
import { computeEvPct, computeKellyStake, evTier, isPremiumSegment } from '../lib/liveMetrics'
import { evPctStyles, formatEvPct } from '../lib/evDisplay'
import { pickModelProbaPct } from '../lib/modelProba'
import { PickMatchupDisplay } from './PickMatchupDisplay'
import { Badge } from './Badge'
import { ProbaDisplay } from './ProbaDisplay'
import { WhyValuePanel } from './WhyValuePanel'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { FieldLabel, Input } from './ui/input'

type ValueBetCardProps = {
  pick: LiveValueBet
  bankrollAvail: number
  onBet: (pick: LiveValueBet, customOdd: number, stakeEur: number) => void
}

export function ValueBetCard({ pick, bankrollAvail, onBet }: ValueBetCardProps) {
  const bookOdd = pick.odd_book ?? pick.odd_fav ?? 1.01
  const trueOdd = pick.true_odd ?? 1.01
  const [customOdd, setCustomOdd] = useState(bookOdd)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const pModelPct = pickModelProbaPct(pick)
  const pModel = pModelPct != null ? pModelPct / 100 : 1 / trueOdd
  const segBrier = pick.segment_brier ?? 0.174
  const evBook = pick.ev_pct ?? pick.ev_fav_pct ?? computeEvPct(bookOdd, trueOdd)
  const evCustom = useMemo(() => computeEvPct(customOdd, trueOdd), [customOdd, trueOdd])
  const kelly = useMemo(
    () => computeKellyStake(pModel, customOdd, segBrier, bankrollAvail),
    [pModel, customOdd, segBrier, bankrollAvail],
  )
  const premium = isPremiumSegment(segBrier)
  const existingStake = pick.existing_stake_eur ?? 0
  const tour = (pick.tour || '').toUpperCase()
  const tier = evTier(evCustom)
  const evStyle = evPctStyles(evCustom)

  return (
    <Card
      as="article"
      variant="default"
      interactive
      className={cn(
        'overflow-hidden p-3 md:p-4',
        evStyle.card,
        tier === 'strong' && evStyle.glow,
        premium && tier !== 'strong' && 'glow-success',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <PickMatchupDisplay pick={pick} variant="stacked" />
          <p className="mt-2 text-xs text-muted">
            {pick.tournament} · {pick.match_time || pick.surface || '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {tour.includes('ATP') && <Badge tone="atp">ATP</Badge>}
          {tour.includes('WTA') && <Badge tone="wta">WTA</Badge>}
          {pick.is_value && <Badge tone="success">Value</Badge>}
          {premium && <Badge tone="success">Premium</Badge>}
          {existingStake > 0 && <Badge tone="atp">Déjà {existingStake.toFixed(2)} €</Badge>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
        <ProbaDisplay pct={pModelPct} label="Proba modèle" size="lg" />
        <Metric label="Mise reco" value={`${kelly.eur.toFixed(2)} €`} variant="stake" />
        <Metric label="Cote" value={`@${customOdd.toFixed(2)}`} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <FieldLabel className="mb-0 shrink-0">Cote observée</FieldLabel>
          <Input
            type="number"
            quant
            min={1.01}
            max={100}
            step={0.05}
            value={customOdd}
            onChange={(e) => setCustomOdd(Math.max(1.01, Number(e.target.value) || 1.01))}
            className="w-24"
          />
        </label>
        {Math.abs(customOdd - bookOdd) > 0.001 && (
          <p className="text-xs text-muted">Réf. book @{bookOdd.toFixed(2)}</p>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDetailsOpen((o) => !o)} aria-expanded={detailsOpen}>
            Détails
            <ChevronDown className={cn('h-4 w-4 transition', detailsOpen && 'rotate-180')} />
          </Button>
          <Button variant="success" size="sm" onClick={() => onBet(pick, customOdd, kelly.eur)}>
            <Target className="h-4 w-4" /> {existingStake > 0 ? 'Ajouter' : 'Parier'}
          </Button>
        </div>
      </div>

      {detailsOpen && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div
            className={cn(
              'grid grid-cols-3 gap-2 rounded-xl border p-3',
              tier === 'strong' && 'border-accent/40 bg-accent/5',
              tier === 'ok' && 'border-teal/35 bg-teal/5',
              tier === 'weak' && 'border-border bg-bg',
              tier === 'neg' && 'border-danger/30 bg-danger/5',
            )}
          >
            <OddsCompareCell label="Book" odd={bookOdd} evPct={evBook} />
            <OddsCompareCell
              label="Fair / modèle"
              odd={trueOdd}
              probaPct={pModelPct}
            />
            <OddsCompareCell label="Ta cote" odd={customOdd} evPct={evCustom} highlight />
          </div>

          <WhyValuePanel explain={pick.why_value} />

          <p className="text-xs text-muted">
            Kelly ½ × Brier {segBrier.toFixed(3)} (×{kelly.brierFactor.toFixed(2)}) · BR dispo {bankrollAvail.toFixed(2)} €
            {(pick.sharpe_ratio != null || pick.priority_score != null) && (
              <>
                {' '}
                · Sharpe {pick.sharpe_ratio?.toFixed(3) ?? '—'} · Priorité {pick.priority_score?.toFixed(4) ?? '—'}
              </>
            )}
          </p>
        </div>
      )}
    </Card>
  )
}

function Metric({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant?: 'stake'
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          'quant text-base font-semibold md:text-lg',
          variant === 'stake' && 'text-stake',
          !variant && 'text-white',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function OddsCompareCell({
  label,
  odd,
  evPct,
  probaPct,
  highlight,
}: {
  label: string
  odd: number
  evPct?: number
  probaPct?: number | null
  highlight?: boolean
}) {
  const evStyle = evPct != null ? evPctStyles(evPct) : null
  return (
    <div className="text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn('quant text-sm font-semibold', highlight && evStyle?.text)}>@{odd.toFixed(2)}</p>
      {evPct != null && (
        <p className={cn('quant mt-0.5 text-xs font-bold', evStyle?.text)}>{formatEvPct(evPct)}</p>
      )}
      {probaPct != null && (
        <div className="mt-1 flex justify-center">
          <ProbaDisplay pct={probaPct} size="sm" />
        </div>
      )}
    </div>
  )
}
