import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
        kicker={t('top5.kicker')}
        title={t('top5.title')}
        subtitle={t('top5.subtitle')}
        stats={[
          { label: t('top5.top5'), value: String(picks.length) },
          { label: t('paris.pool'), value: String(pool) },
        ]}
      />
      {loading ? (
        <CardGridSkeleton count={2} />
      ) : picks.length === 0 ? (
        <EmptyState title={t('top5.emptyTitle')} hint={t('top5.emptyHint')} />
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
