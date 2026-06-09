import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { FieldLabel, Input } from './ui/input'

type BankrollAdjustModalProps = {
  open: boolean
  mode: 'add' | 'withdraw'
  availableEur: number
  onClose: () => void
  onSuccess: () => void
}

export function BankrollAdjustModal({
  open,
  mode,
  availableEur,
  onClose,
  onSuccess,
}: BankrollAdjustModalProps) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [amount, setAmount] = useState('10')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setAmount('10')
    setError(null)
  }, [open, mode])

  if (!open) return null

  const parsed = parseFloat(amount)
  const isWithdraw = mode === 'withdraw'
  const signedAmount = isWithdraw ? -Math.abs(parsed) : Math.abs(parsed)
  const preview = Number.isFinite(parsed) && parsed > 0 ? Math.max(0, availableEur + signedAmount) : null

  async function submit() {
    if (!token) return
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(t('bankrollModal.invalidAmount'))
      return
    }
    if (isWithdraw && parsed > availableEur + 1e-6) {
      setError(t('bankrollModal.maxWithdraw', { amount: availableEur.toFixed(2) }))
      return
    }

    setLoading(true)
    setError(null)
    try {
      await api.portfolioBankrollAdjust(signedAmount, token)
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
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {isWithdraw ? t('bankrollModal.withdrawTitle') : t('bankrollModal.addTitle')}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t('bankrollModal.currentBr')} :{' '}
              <span className="quant text-white">{availableEur.toFixed(2)} €</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="!p-1.5">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <label className="block">
          <FieldLabel>{t('bankrollModal.amount')}</FieldLabel>
          <Input
            type="number"
            quant
            min="0.5"
            step="0.5"
            max={isWithdraw ? availableEur : undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        {preview != null && (
          <p className="mt-2 text-xs text-muted">
            {t('bankrollModal.estimatedBr')} :{' '}
            <span className="quant font-medium text-white">{preview.toFixed(2)} €</span>
          </p>
        )}

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant={isWithdraw ? 'outline' : 'success'} disabled={loading} onClick={() => void submit()}>
            {loading ? t('bankrollModal.saving') : isWithdraw ? t('bankrollModal.withdraw') : t('bankrollModal.add')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
