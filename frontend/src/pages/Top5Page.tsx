import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PickRow } from '../api/client'
import { BetModal } from '../components/BetModal'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { PickCard } from '../components/PickCard'
import { RankedTable } from '../components/RankedTable'
import { CardGridSkeleton } from '../components/ui/card-skeleton'
import { useAuth } from '../context/AuthContext'
import { pickBetOn, pickOpponent } from '../lib/pickDisplay'

type Top5PageProps = {
  picks: PickRow[]
  pool: number
  loading?: boolean
  onBetSuccess: () => void
}

export function Top5Page({ picks, pool, loading, onBetSuccess }: Top5PageProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<PickRow | null>(null)

  function handleBet(pick: PickRow) {
    if (!user) {
      navigate('/login')
      return
    }
    setSelected(pick)
  }

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
            {picks.map((p, i) => (
              <PickCard
                key={`${pickBetOn(p)}-${pickOpponent(p)}-${i}`}
                pick={p}
                index={i}
                featured={i === 0}
                onBet={handleBet}
              />
            ))}
          </div>
          <RankedTable picks={picks} />
        </div>
      )}
      <BetModal
        pick={selected}
        trackerSource="top5_proba_action"
        onClose={() => setSelected(null)}
        onSuccess={onBetSuccess}
      />
    </div>
  )
}
