import { cn } from '../../lib/utils'

type StatTileProps = {
  label: string
  value: string
  className?: string
  highlight?: boolean
}

export function StatTile({ label, value, className, highlight }: StatTileProps) {
  return (
    <div
      className={cn(
        'min-w-[5.5rem] rounded-xl border border-border bg-bg-elevated px-3 py-2.5',
        highlight && 'border-accent/35 bg-accent/5',
        className,
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className={cn('quant mt-0.5 text-xs font-semibold', highlight ? 'text-accent' : 'text-white')}>{value}</p>
    </div>
  )
}
