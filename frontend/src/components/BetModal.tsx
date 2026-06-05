import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { BetCreatePayload, PickRow } from '../api/client'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatProbaPct, pickModelProbaPct } from '../lib/modelProba'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { FieldLabel, Input } from './ui/input'

type BetModalProps = {
  pick: PickRow | null
  onClose: () => void
  onSuccess: () => void
  customOdd?: number
  defaultStake?: number
}

export function BetModal({ pick, onClose, onSuccess, customOdd, defaultStake }: BetModalProps) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [stake, setStake] = useState('10')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pick) return
    setStake(defaultStake != null && defaultStake > 0 ? defaultStake.toFixed(2) : '10')
    setError(null)
  }, [pick, defaultStake])

  if (!pick) return null

  const activePick = pick
  const odds = customOdd ?? activePick.odd_fav ?? activePick.odd_book ?? 0
  const trueOdd = activePick.true_odd
  const pModelPct = pickModelProbaPct(activePick)
  const pModel = pModelPct != null ? pModelPct / 100 : trueOdd && trueOdd > 1 ? 1 / trueOdd : undefined
  const evPct =
    trueOdd && trueOdd > 1 && customOdd
      ? ((1 / trueOdd) * (customOdd - 1) - (1 - 1 / trueOdd)) * 100
      : activePick.ev_fav_pct ?? activePick.ev_pct ?? 0

  async function submit() {
    if (!token) {
      navigate('/login')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload: BetCreatePayload = {
        match_name: activePick.match_name || `${activePick.bet_on} vs ${activePick.opponent}`,
        bet_on: activePick.bet_on || '',
        odds,
        stake: parseFloat(stake),
        tournament: activePick.tournament,
        tour: activePick.tour,
        surface: activePick.surface,
        p_model: pModel,
        ev_at_bet: evPct / 100,
        tracker_source: 'live_tracker_web',
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
            <h3 className="mt-1 text-base font-semibold">{activePick.bet_on}</h3>
            <p className="text-sm text-muted">
              @{odds.toFixed(2)} · Proba modèle {formatProbaPct(pModelPct)} · EV {evPct >= 0 ? '+' : ''}
              {evPct.toFixed(1)}%
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="!p-1.5">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <label className="block">
          <FieldLabel>Mise (€)</FieldLabel>
          <Input type="number" quant min="0.5" step="0.5" value={stake} onChange={(e) => setStake(e.target.value)} />
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
