import { cn } from './utils'
import { evTier, type EvTier } from './liveMetrics'

export type { EvTier }

/** Styles par palier EV — lisibles d'un coup d'œil (lime / teal / neutre / rouge). */
export const EV_TIER = {
  strong: {
    pill: 'border-accent/55 bg-accent/18 text-accent shadow-[0_0_12px_rgba(200,241,53,0.2)]',
    text: 'text-accent',
    card: 'border-l-2 border-l-accent/70',
    glow: 'glow-ev-hot',
  },
  ok: {
    pill: 'border-teal/45 bg-teal/12 text-teal',
    text: 'text-teal',
    card: 'border-l-2 border-l-teal/70',
    glow: '',
  },
  weak: {
    pill: 'border-border bg-bg-elevated text-muted',
    text: 'text-white',
    card: 'border-l-2 border-l-border',
    glow: '',
  },
  neg: {
    pill: 'border-danger/45 bg-danger/12 text-danger',
    text: 'text-danger',
    card: 'border-l-2 border-l-danger/70',
    glow: '',
  },
} as const satisfies Record<EvTier, { pill: string; text: string; card: string; glow: string }>

export function tierStyles(tier: EvTier) {
  return EV_TIER[tier]
}

export function evPctStyles(evPct: number) {
  return tierStyles(evTier(evPct))
}

export function formatEvPct(evPct: number, digits = 1) {
  const sign = evPct >= 0 ? '+' : ''
  return `${sign}${evPct.toFixed(digits)}%`
}

export function evPillClass(evPct: number, className?: string) {
  const s = evPctStyles(evPct)
  return cn(
    'quant inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold tabular-nums sm:text-sm',
    s.pill,
    className,
  )
}

/** Cote « intéressante » si EV custom ≥ 8 %. */
export function oddsHighlightClass(evPct: number) {
  const tier = evTier(evPct)
  if (tier === 'strong') return 'text-accent'
  if (tier === 'ok') return 'text-teal'
  if (tier === 'neg') return 'text-danger'
  return 'text-white'
}

export function impliedEvPct(bookOdd: number, probaPct: number | null): number | null {
  if (probaPct == null || probaPct <= 0 || probaPct >= 100 || bookOdd <= 1) return null
  const trueProb = probaPct / 100
  const expectedYield = trueProb * (bookOdd - 1) - (1 - trueProb)
  return expectedYield * 100
}
