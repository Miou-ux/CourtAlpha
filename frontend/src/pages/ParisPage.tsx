import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
        kicker={t('paris.kicker')}
        title={t('paris.title')}
        subtitle={t('paris.subtitle')}
        stats={[
          { label: t('paris.picks'), value: String(picks.length), highlight: picks.length > 0 },
          { label: t('paris.pool'), value: String(scanned) },
        ]}
      />
      {loading ? (
        <CardGridSkeleton count={2} />
      ) : picks.length === 0 ? (
        <EmptyState title={t('paris.emptyTitle')} hint={t('paris.emptyHint')} />
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
