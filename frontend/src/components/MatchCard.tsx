import type { MatchRow } from '../api/client'
import { matchPlayerProbas } from '../lib/modelProba'
import { Badge } from './Badge'
import { ProbaDisplay } from './ProbaDisplay'
import { Card } from './ui/card'

type MatchCardProps = {
  match: MatchRow
}

export function MatchCard({ match }: MatchCardProps) {
  const tour = (match.tour || match.category || '').toUpperCase()
  const { p1Pct, p2Pct } = matchPlayerProbas(match)

  return (
    <Card as="article" variant="glass" interactive className="p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug tracking-tight">
          {match.player1} <span className="text-muted">vs</span> {match.player2}
        </h3>
        <div className="flex gap-1">
          {tour.includes('ATP') && <Badge tone="atp">ATP</Badge>}
          {tour.includes('WTA') && <Badge tone="wta">WTA</Badge>}
        </div>
      </div>
      <p className="text-xs text-muted">{match.tournament}</p>
      <p className="mt-1 text-xs text-muted">
        {match.date} {match.time} · {match.surface || '—'}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <PlayerOddsCell label="P1" odd={match.odd_p1} probaPct={p1Pct} player={match.player1} />
        <PlayerOddsCell label="P2" odd={match.odd_p2} probaPct={p2Pct} player={match.player2} />
      </div>
    </Card>
  )
}

function PlayerOddsCell({
  label,
  odd,
  probaPct,
  player,
}: {
  label: string
  odd?: number
  probaPct: number | null
  player?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-bg px-2.5 py-2">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-muted">{label}</span>
        <span className="quant font-semibold text-white">{odd?.toFixed(2) ?? '—'}</span>
      </div>
      <p className="mt-1 truncate text-[10px] text-muted" title={player}>
        {player || '—'}
      </p>
      <div className="mt-1.5">
        <ProbaDisplay pct={probaPct} size="sm" />
      </div>
    </div>
  )
}
