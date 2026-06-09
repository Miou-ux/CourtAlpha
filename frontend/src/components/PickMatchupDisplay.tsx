import type { PickRow } from '../api/client'
import { cn } from '../lib/utils'
import { pickBetOn, pickOpponent } from '../lib/pickDisplay'

type PickMatchupDisplayProps = {
  pick: PickRow
  /** Carte : empilé · inline : une ligne · table : ligne compacte */
  variant?: 'stacked' | 'inline' | 'compact'
  showLabel?: boolean
  className?: string
}

export function PickMatchupDisplay({
  pick,
  variant = 'stacked',
  showLabel = true,
  className,
}: PickMatchupDisplayProps) {
  const betOn = pickBetOn(pick)
  const opponent = pickOpponent(pick)

  if (variant === 'inline') {
    return (
      <p className={cn('leading-snug', className)}>
        {showLabel && (
          <span className="mr-1.5 inline-flex rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
            Pari
          </span>
        )}
        <span className="font-bold text-white">{betOn}</span>
        <span className="mx-1.5 font-normal text-muted/80">vs</span>
        <span className="font-normal text-muted">{opponent}</span>
      </p>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('min-w-0', className)}>
        <p className="truncate font-semibold text-white">{betOn}</p>
        <p className="truncate text-xs text-muted">
          <span className="text-muted/70">vs</span> {opponent}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('min-w-0', className)}>
      {showLabel && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Pari sur</p>
      )}
      <p className="mt-0.5 text-lg font-bold leading-tight text-white md:text-xl">{betOn}</p>
      <p className="mt-1 text-sm leading-snug text-muted">
        <span className="text-muted/70">vs</span>{' '}
        <span className="text-muted-foreground">{opponent}</span>
      </p>
    </div>
  )
}
