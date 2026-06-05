import type { PickRow } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { PickCard } from '../components/PickCard'
import { RankedTable } from '../components/RankedTable'
import { CardGridSkeleton } from '../components/ui/card-skeleton'

type Top5PageProps = {
  picks: PickRow[]
  pool: number
  loading?: boolean
}

export function Top5Page({ picks, pool, loading }: Top5PageProps) {
  return (
    <div>
      <PageHero
        kicker="Best pick"
        title="Top 5 proba"
        subtitle="Bande EV 15–100 % · tri proba modèle décroissante."
        stats={[
          { label: 'Top 5', value: String(picks.length) },
          { label: 'Pool', value: String(pool) },
        ]}
      />
      {loading ? (
        <CardGridSkeleton count={2} />
      ) : picks.length === 0 ? (
        <EmptyState title="Aucun pick dans la bande EV 15–100 %" hint="Les meilleurs picks du jour peuvent avoir une EV > 100 % (hors bande Top 5)." />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {picks.slice(0, 2).map((p, i) => (
              <PickCard key={`top-${i}`} pick={p} index={i} featured={i === 0} />
            ))}
          </div>
          <RankedTable picks={picks} />
        </div>
      )}
    </div>
  )
}
