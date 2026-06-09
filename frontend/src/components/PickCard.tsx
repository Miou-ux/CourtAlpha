import { Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PickRow } from '../api/client'
import { cn } from '../lib/utils'
import { translateBetStatus } from '../lib/betStatus'
import { evTier } from '../lib/liveMetrics'
import { evPctStyles } from '../lib/evDisplay'
import { pickModelProbaPct } from '../lib/modelProba'
import { PickMatchupDisplay } from './PickMatchupDisplay'
import { Badge } from './Badge'
import { ProbaDisplay } from './ProbaDisplay'
import { Button } from './ui/button'
import { Card } from './ui/card'

type PickCardProps = {
  pick: PickRow
  index: number
  onBet?: (pick: PickRow) => void
  featured?: boolean
  /** Affiche Gagné / Perdu / En cours (1 Day 1 Pick). */
  showResult?: boolean
}

export function PickCard({ pick, index, onBet, featured, showResult }: PickCardProps) {
  const { t } = useTranslation()
  const rank = pick.rank ?? index + 1
  const ev = pick.ev_fav_pct ?? pick.ev_pct ?? 0
  const proba = pickModelProbaPct(pick)
  const tour = (pick.tour || '').toUpperCase()
  const tier = evTier(ev)
  const evStyle = evPctStyles(ev)
  const isPremium = ev >= 15 && (proba ?? 0) >= 60
  const existingStake = pick.existing_stake_eur ?? 0
  const resultPick = pick as PickRow & { won?: boolean; lost?: boolean; open?: boolean; status?: string | null }
  const resultWon = resultPick.won || resultPick.status === 'Gagné'
  const resultLost = resultPick.lost || resultPick.status === 'Perdu'
  const resultOpen = resultPick.open || resultPick.status === 'En cours'

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
            {t('common.pickRank', { rank })}
          </p>
          <div className="mt-1">
            <PickMatchupDisplay pick={pick} variant="stacked" />
          </div>
          <p className="mt-1 text-sm text-muted">{pick.tournament}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {showResult && resultWon && (
            <Badge tone="success">{translateBetStatus('Gagné', t)}</Badge>
          )}
          {showResult && resultLost && (
            <Badge tone="danger">{translateBetStatus('Perdu', t)}</Badge>
          )}
          {showResult && resultOpen && !resultWon && !resultLost && (
            <Badge tone="accent">{translateBetStatus('En cours', t)}</Badge>
          )}
          {tour.includes('ATP') && <Badge tone="atp">ATP</Badge>}
          {tour.includes('WTA') && <Badge tone="wta">WTA</Badge>}
          {isPremium && <Badge tone="success">{t('common.value')}</Badge>}
          {existingStake > 0 && <Badge tone="atp">{t('common.alreadyBet', { amount: existingStake.toFixed(2) })}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3 rounded-xl border border-border bg-bg p-3">
        <ProbaDisplay pct={proba} label={t('common.modelProba')} />
        <div>
          <p className="text-xs text-muted">{t('common.odds')}</p>
          <p className="quant text-base font-semibold text-white">@{pick.odd_fav?.toFixed(2) ?? '—'}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {existingStake > 0 ? (
            <span className="text-accent">{t('common.betRecorded', { amount: existingStake.toFixed(2) })}</span>
          ) : (
            pick.match_time || pick.surface || '—'
          )}
        </p>
        {onBet && (
          <Button variant="success" size="sm" onClick={() => onBet(pick)}>
            <Target className="h-3.5 w-3.5" /> {existingStake > 0 ? t('common.add') : t('common.bet')}
          </Button>
        )}
      </div>
    </Card>
  )
}
