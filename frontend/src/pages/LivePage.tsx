import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LiveValueBet } from '../api/client'
import { api } from '../api/client'
import { BetModal } from '../components/BetModal'
import { EmptyState } from '../components/EmptyState'
import { FilterPills, type CircuitFilter, type LiveRangeFilters } from '../components/FilterPills'
import { pickModelProbaPct } from '../lib/modelProba'
import { PageHero } from '../components/PageHero'
import { ValueBetCard } from '../components/ValueBetCard'
import { CardGridSkeleton } from '../components/ui/card-skeleton'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'

type LivePageProps = {
  scanned: number
  bootstrapLoading?: boolean
}

type BetDraft = {
  pick: LiveValueBet
  customOdd: number
  stakeEur: number
}

function matchCircuit(p: LiveValueBet): string {
  return (p.tour || '').toUpperCase()
}

function pickBookOdd(p: LiveValueBet): number | null {
  const o = p.odd_book ?? p.odd_fav
  return o != null && o > 1 ? o : null
}

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function LivePage({ scanned, bootstrapLoading }: LivePageProps) {
  const { t } = useTranslation()
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [circuit, setCircuit] = useState<CircuitFilter>('all')
  const [search, setSearch] = useState('')
  const [ranges, setRanges] = useState<LiveRangeFilters>({ probaMin: '', oddMin: '', oddMax: '' })
  const [mode, setMode] = useState<'value' | 'all'>('value')
  const [betDraft, setBetDraft] = useState<BetDraft | null>(null)

  const q = useQuery({
    queryKey: ['live-value-bets', mode, token],
    queryFn: () => api.liveValueBets({ mode, ev_min_pct: 15 }, token),
  })

  const picks = q.data?.picks ?? []
  const bankrollAvail = user ? (q.data?.bankroll?.available_eur ?? 0) : 0
  const loading = q.isLoading || bootstrapLoading

  const filtered = useMemo(() => {
    const ql = search.trim().toLowerCase()
    const probaMin = parseOptionalNumber(ranges.probaMin)
    const oddMin = parseOptionalNumber(ranges.oddMin)
    const oddMax = parseOptionalNumber(ranges.oddMax)
    return picks.filter((p) => {
      if (circuit === 'atp' && !matchCircuit(p).includes('ATP')) return false
      if (circuit === 'wta' && !matchCircuit(p).includes('WTA')) return false
      if (probaMin != null) {
        const proba = pickModelProbaPct(p)
        if (proba == null || proba < probaMin) return false
      }
      const odd = pickBookOdd(p)
      if (oddMin != null && (odd == null || odd < oddMin)) return false
      if (oddMax != null && (odd == null || odd > oddMax)) return false
      if (!ql) return true
      const blob = `${p.bet_on || ''} ${p.opponent || ''} ${p.tournament || ''}`.toLowerCase()
      return blob.includes(ql)
    })
  }, [picks, circuit, search, ranges])

  return (
    <div>
      <PageHero
        kicker={t('live.kicker')}
        title={t('live.title')}
        subtitle={t('live.subtitle')}
        stats={[
          { label: t('header.scanned'), value: String(q.data?.n_scanned ?? scanned) },
          { label: t('live.tiles'), value: String(filtered.length), highlight: filtered.length > 0 },
          ...(user
            ? [{ label: t('header.available'), value: `${bankrollAvail.toFixed(0)} €` }]
            : []),
        ]}
      />

      <div className="mb-4 flex flex-wrap items-stretch gap-3">
        <FilterPills
          circuit={circuit}
          search={search}
          onCircuit={setCircuit}
          onSearch={setSearch}
          ranges={ranges}
          onRanges={(patch) => setRanges((prev) => ({ ...prev, ...patch }))}
        />
        <div className="flex shrink-0 rounded-xl border border-border bg-bg-elevated p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('value')}
            className={cn(
              'rounded-lg px-3 py-2 transition',
              mode === 'value' ? 'bg-accent/20 font-medium text-white' : 'text-muted hover:text-white',
            )}
          >
            {t('live.modeValue')}
          </button>
          <button
            type="button"
            onClick={() => setMode('all')}
            className={cn(
              'rounded-lg px-3 py-2 transition',
              mode === 'all' ? 'bg-accent/20 font-medium text-white' : 'text-muted hover:text-white',
            )}
          >
            {t('live.modeAll')}
          </button>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : q.error ? (
        <p className="text-sm text-danger">{String(q.error)}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('live.emptyTitle')}
          hint={mode === 'value' ? t('live.emptyHintValue') : t('live.emptyHintAll')}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((p, i) => (
            <ValueBetCard
              key={`${p.match_name}-${p.side}-${i}`}
              pick={p}
              bankrollAvail={bankrollAvail}
              onBet={(pick, customOdd, stakeEur) => {
                if (!user) {
                  navigate('/login')
                  return
                }
                setBetDraft({ pick, customOdd, stakeEur })
              }}
            />
          ))}
        </div>
      )}

      <BetModal
        pick={betDraft?.pick ?? null}
        customOdd={betDraft?.customOdd}
        defaultStake={betDraft?.stakeEur}
        onClose={() => setBetDraft(null)}
        onSuccess={() => {
          void q.refetch()
        }}
      />
    </div>
  )
}
