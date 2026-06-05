import { Card } from './ui/card'
import { StatTile } from './ui/stat-tile'

type PageHeroProps = {
  kicker?: string
  title: string
  subtitle: string
  stats?: { label: string; value: string; highlight?: boolean }[]
}

export function PageHero({ kicker, title, subtitle, stats }: PageHeroProps) {
  return (
    <Card variant="elevated" className="brand-ring mb-5 p-4 md:p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          {kicker && (
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-accent">{kicker}</p>
          )}
          <h1 className="font-display text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>
        </div>
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stats.map((s) => (
              <StatTile key={s.label} label={s.label} value={s.value} highlight={s.highlight} />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
