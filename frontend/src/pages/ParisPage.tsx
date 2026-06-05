import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PickRow } from '../api/client'
import { BetModal } from '../components/BetModal'
import { EmptyState } from '../components/EmptyState'
import { PageHero } from '../components/PageHero'
import { PickCard } from '../components/PickCard'
import { CardGridSkeleton } from '../components/ui/card-skeleton'
import { useAuth } from '../context/AuthContext'

type ParisPageProps = {
  picks: PickRow[]
  scanned: number
  loading?: boolean
  onBetSuccess: () => void
}

export function ParisPage({ picks, scanned, loading, onBetSuccess }: ParisPageProps) {
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
        kicker="Mission du jour"
        title="Paris du jour"
        subtitle="Value bets avec proba modèle > 60 % et EV > 15 % — même logique que Telegram /picks."
        stats={[
          { label: 'Picks', value: String(picks.length), highlight: picks.length > 0 },
          { label: 'Pool', value: String(scanned) },
        ]}
      />
      {loading ? (
        <CardGridSkeleton count={2} />
      ) : picks.length === 0 ? (
        <EmptyState title="Aucun pick aujourd'hui" hint="Les filtres sont stricts. Consulte le Live Tracker ou attends le prochain snapshot." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {picks.map((p, i) => (
            <PickCard key={`${p.bet_on}-${i}`} pick={p} index={i} featured={i === 0} onBet={handleBet} />
          ))}
        </div>
      )}
      <BetModal pick={selected} onClose={() => setSelected(null)} onSuccess={onBetSuccess} />
    </div>
  )
}
