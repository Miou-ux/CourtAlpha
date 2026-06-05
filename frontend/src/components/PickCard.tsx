import { Target } from 'lucide-react'
import type { PickRow } from '../api/client'
import { cn } from '../lib/utils'
import { evTier } from '../lib/liveMetrics'
import { evPctStyles } from '../lib/evDisplay'
import { pickModelProbaPct } from '../lib/modelProba'
import { Badge } from './Badge'
import { ProbaDisplay } from './ProbaDisplay'
import { Button } from './ui/button'
import { Card } from './ui/card'

type PickCardProps = {
  pick: PickRow
  index: number
  onBet?: (pick: PickRow) => void
  featured?: boolean
}

export function PickCard({ pick, index, onBet, featured }: PickCardProps) {
  const rank = pick.rank ?? index + 1
  const ev = pick.ev_fav_pct ?? pick.ev_pct ?? 0
  const proba = pickModelProbaPct(pick)
  const tour = (pick.tour || '').toUpperCase()
  const tier = evTier(ev)
  const evStyle = evPctStyles(ev)
  const isPremium = ev >= 15 && (proba ?? 0) >= 60

  return (
    <Card
      as="article"
      variant={featured ? 'glass' : 'default'}
      interactive
      className={cn(
        'overflow-hidden p-3 md:p-4',
        evStyle.card,
        tier === 'strong' && evStyle.glow,
        isPremium && tier !== 'strong' && 'glow-success',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className={cn('text-xs font-semibold uppercase tracking-wide', rank === 1 ? 'text-accent' : 'text-muted')}>
            Pick #{rank}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug">
            {pick.bet_on} <span className="font-normal text-muted">vs</span> {pick.opponent}
          </h3>
          <p className="mt-1 text-sm text-muted">{pick.tournament}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {tour.includes('ATP') && <Badge tone="atp">ATP</Badge>}
          {tour.includes('WTA') && <Badge tone="wta">WTA</Badge>}
          {isPremium && <Badge tone="success">Value</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3 rounded-xl border border-border bg-bg p-3">
        <ProbaDisplay pct={proba} label="Proba modèle" />
        <div>
          <p className="text-xs text-muted">Cote</p>
          <p className="quant text-base font-semibold text-white">@{pick.odd_fav?.toFixed(2) ?? '—'}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{pick.match_time || pick.surface || '—'}</p>
        {onBet && (
          <Button variant="success" size="sm" onClick={() => onBet(pick)}>
            <Target className="h-3.5 w-3.5" /> Parier
          </Button>
        )}
      </div>
    </Card>
  )
}
