import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import type { BetCreatePayload, PickRow } from '../api/client'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { computeEvPct, computeKellyStake } from '../lib/liveMetrics'
import { formatProbaPct, pickModelProbaPct } from '../lib/modelProba'
import { pickBetOn, pickOpponent } from '../lib/pickDisplay'
import { PickMatchupDisplay } from './PickMatchupDisplay'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { FieldLabel, Input } from './ui/input'

type BetModalProps = {
  pick: PickRow | null
  onClose: () => void
  onSuccess: () => void
  customOdd?: number
  defaultStake?: number
  trackerSource?: string
}

export function BetModal({ pick, onClose, onSuccess, customOdd, defaultStake, trackerSource = 'live_tracker_web' }: BetModalProps) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [stake, setStake] = useState('10')
  const [observedOddInput, setObservedOddInput] = useState('1.01')
  const [stakeTouched, setStakeTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bookOdd = pick ? (pick.odd_fav ?? pick.odd_book ?? 1.01) : 1.01

  const portfolioQ = useQuery({
    queryKey: ['portfolio-summary-bet-modal', token],
    queryFn: () => api.portfolioSummary(token),
    enabled: !!pick && !!token,
  })

  const bankrollAvail = portfolioQ.data?.bankroll?.available_eur ?? 0

  const oddsEditable = customOdd == null
  const parsedObservedOdd = parseFloat(observedOddInput.replace(',', '.'))
  const observedOdd =
    Number.isFinite(parsedObservedOdd) && parsedObservedOdd >= 1.01 ? parsedObservedOdd : bookOdd
  const odds = customOdd ?? observedOdd
  const trueOdd = pick?.true_odd ?? 1.01
  const pModelPct = pick ? pickModelProbaPct(pick) : null
  const pModel = pModelPct != null ? pModelPct / 100 : trueOdd > 1 ? 1 / trueOdd : undefined
  const segBrier = pick?.segment_brier ?? 0.174
  const kelly = useMemo(
    () => computeKellyStake(pModel ?? 0, odds, segBrier, bankrollAvail),
    [pModel, odds, segBrier, bankrollAvail],
  )
  const evPct =
    pick && trueOdd > 1
      ? computeEvPct(odds, trueOdd)
      : pick?.ev_fav_pct ?? pick?.ev_pct ?? 0

  useEffect(() => {
    if (!pick) return
    setStakeTouched(false)
    setObservedOddInput(bookOdd.toFixed(2))
    setError(null)
    if (customOdd != null && defaultStake != null && defaultStake > 0) {
      setStake(defaultStake.toFixed(2))
    }
  }, [pick, defaultStake, bookOdd, customOdd])

  useEffect(() => {
    if (!pick || !oddsEditable || stakeTouched || customOdd != null) return
    if (!Number.isFinite(parsedObservedOdd) || parsedObservedOdd < 1.01) return
    setStake(kelly.eur > 0 ? kelly.eur.toFixed(2) : '0.50')
  }, [pick, oddsEditable, stakeTouched, customOdd, parsedObservedOdd, kelly.eur])

  if (!pick) return null

  const activePick = pick

  async function submit() {
    if (!token) {
      navigate('/login')
      return
    }
    if (oddsEditable && (!Number.isFinite(parsedObservedOdd) || parsedObservedOdd < 1.01)) {
      setError('Cote invalide (minimum 1.01)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const betOn = pickBetOn(activePick)
      const payload: BetCreatePayload = {
        match_name: activePick.match_name || `${betOn} vs ${pickOpponent(activePick)}`,
        bet_on: betOn,
        odds,
        stake: parseFloat(stake),
        match_date: activePick.match_date || activePick.calendar_date,
        tournament: activePick.tournament,
        tour: activePick.tour,
        surface: activePick.surface,
        p_model: pModel,
        ev_at_bet: evPct / 100,
        tracker_source: trackerSource,
      }
      await api.createBet(payload, token)
      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card variant="elevated" className="w-full max-w-md p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Confirmer le pari</p>
            <div className="mt-2">
              <PickMatchupDisplay pick={activePick} variant="stacked" showLabel={false} />
            </div>
            <p className="text-sm text-muted">
              @{odds.toFixed(2)} · Proba modèle {formatProbaPct(pModelPct)} · EV {evPct >= 0 ? '+' : ''}
              {evPct.toFixed(1)}%
            </p>
            {(activePick.existing_stake_eur ?? 0) > 0 && (
              <p className="mt-1 text-xs text-accent">
                Déjà parié : {(activePick.existing_stake_eur ?? 0).toFixed(2)} € sur ce pick
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="!p-1.5">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {oddsEditable && (
          <label className="mb-3 block">
            <FieldLabel>Cote observée</FieldLabel>
            <Input
              type="text"
              inputMode="decimal"
              quant
              value={observedOddInput}
              onChange={(e) => setObservedOddInput(e.target.value)}
              placeholder={bookOdd.toFixed(2)}
            />
            {Number.isFinite(parsedObservedOdd) && Math.abs(parsedObservedOdd - bookOdd) > 0.001 && (
              <p className="mt-1 text-xs text-muted">Réf. book @{bookOdd.toFixed(2)}</p>
            )}
          </label>
        )}
        <label className="block">
          <FieldLabel>Mise (€)</FieldLabel>
          <Input
            type="number"
            quant
            min="0.5"
            step="0.5"
            value={stake}
            onChange={(e) => {
              setStakeTouched(true)
              setStake(e.target.value)
            }}
          />
          {oddsEditable && bankrollAvail > 0 && (
            <p className="mt-1 text-xs text-muted">
              Kelly ½ × Brier {segBrier.toFixed(3)} · reco {kelly.eur.toFixed(2)} € · BR dispo{' '}
              {bankrollAvail.toFixed(2)} €
            </p>
          )}
        </label>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="success" disabled={loading} onClick={() => void submit()}>
            {loading ? 'Envoi…' : 'Confirmer'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
