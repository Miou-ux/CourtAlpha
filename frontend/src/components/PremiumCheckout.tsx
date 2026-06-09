import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Address, Hex } from 'viem'
import { api } from '../api/client'
import { formatEthFromWei, payPremiumDeposit, payPremiumOrder } from '../lib/billingPay'
import { useAuth } from '../context/AuthContext'

type Props = {
  planId?: string
}

export function PremiumCheckout({ planId = 'premium_30d' }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en-GB' : 'fr-FR'
  const { token, refreshSession } = useAuth()
  const [txHash, setTxHash] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const plansQ = useQuery({ queryKey: ['billing-plans'], queryFn: api.billingPlans })
  const plan = plansQ.data?.plans?.find((p) => p.id === planId)
  const cfg = plansQ.data

  const orderQ = useQuery({
    queryKey: ['billing-order', orderId, token],
    queryFn: () => api.billingGetOrder(token!, orderId!),
    enabled: !!token && !!orderId,
    refetchInterval: (q) => (q.state.data?.order.status === 'pending' ? 3000 : false),
  })

  const order = orderQ.data?.order
  const paid = order?.status === 'paid'
  const depositMode = !!(order?.deposit_address || cfg?.deposit_enabled)

  useEffect(() => {
    if (paid) void refreshSession()
  }, [paid, refreshSession])

  const createMut = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error(t('premiumCheckout.signInToPay'))
      if (!cfg?.payments_enabled) {
        throw new Error(t('premiumCheckout.paymentsDisabled'))
      }
      const created = await api.billingCreateOrder(token, planId)
      setOrderId(created.order.id)
      return created.order
    },
    onError: (e: Error) => setError(e.message),
    onSuccess: () => setError(null),
  })

  const payMut = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error(t('premiumCheckout.signInToPay'))
      if (!cfg?.payments_enabled) {
        throw new Error(t('premiumCheckout.paymentsDisabled'))
      }

      let o = order
      if (!o) {
        const created = await api.billingCreateOrder(token, planId)
        o = created.order
        setOrderId(o.id)
      }

      if (o.deposit_address) {
        const hash = await payPremiumDeposit({
          depositAddress: o.deposit_address as Address,
          chainId: o.chain_id,
          priceWei: BigInt(o.price_wei),
        })
        setTxHash(hash)
        return hash
      }

      const contract = (o.contract_address ?? cfg?.contract_address) as Address | null
      if (!contract) {
        throw new Error(t('premiumCheckout.paymentNotConfigured'))
      }

      const hash = await payPremiumOrder({
        contractAddress: contract,
        chainId: o.chain_id,
        paymentRef: o.payment_ref as Hex,
        priceWei: BigInt(o.price_wei),
      })
      setTxHash(hash)
      return hash
    },
    onError: (e: Error) => setError(e.message),
    onSuccess: () => setError(null),
  })

  const copyDeposit = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('premiumCheckout.copyFailed'))
    }
  }

  if (paid) {
    return (
      <div className="mt-5 space-y-2">
        <p className="text-sm text-accent">{t('premiumCheckout.paymentConfirmed')}</p>
        <Link to="/live" className="text-sm text-accent hover:underline">
          {t('premiumCheckout.openLive')}
        </Link>
      </div>
    )
  }

  if (!cfg?.payments_enabled) {
    return <p className="mt-5 text-sm text-muted">{t('premiumCheckout.configPending')}</p>
  }

  const activeOrder = order ?? (createMut.data ?? null)
  const showDeposit = !!(activeOrder?.deposit_address || (depositMode && !activeOrder))

  return (
    <div className="mt-5 space-y-3">
      {plan && (
        <p className="text-sm">
          {t('premiumCheckout.price')} : <span className="font-semibold text-accent">{formatEthFromWei(plan.price_wei)}</span>
          {' · '}
          {cfg.chain_id === 84532 ? 'Base Sepolia' : 'Base'}
        </p>
      )}

      {!activeOrder && (
        <button
          type="button"
          disabled={createMut.isPending}
          onClick={() => void createMut.mutate()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
        >
          {createMut.isPending ? t('premiumCheckout.creating') : t('premiumCheckout.createOrder')}
        </button>
      )}

      {activeOrder?.deposit_address && (
        <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
          <p>
            {t('premiumCheckout.sendExactly')}{' '}
            <span className="font-semibold text-accent">{formatEthFromWei(activeOrder.price_wei)}</span>{' '}
            {t('premiumCheckout.toAddress')}
          </p>
          <p className="break-all font-mono text-xs text-fg">{activeOrder.deposit_address}</p>
          <button
            type="button"
            onClick={() => void copyDeposit(activeOrder.deposit_address!)}
            className="text-xs text-accent hover:underline"
          >
            {copied ? t('premiumCheckout.copied') : t('premiumCheckout.copyAddress')}
          </button>
          <p className="text-xs text-muted">
            {t('premiumCheckout.orderValidUntil', {
              date: new Date(activeOrder.expires_at).toLocaleString(locale),
            })}
          </p>
        </div>
      )}

      {activeOrder && (
        <button
          type="button"
          disabled={payMut.isPending}
          onClick={() => void payMut.mutate()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
        >
          {payMut.isPending
            ? t('premiumCheckout.walletPending')
            : activeOrder.deposit_address
              ? t('premiumCheckout.payEthMetamask')
              : t('premiumCheckout.payContractMetamask')}
        </button>
      )}

      {txHash && (
        <p className="text-xs text-muted">
          Tx : <span className="break-all font-mono text-fg">{txHash}</span>
          {order?.status === 'pending' && t('premiumCheckout.txConfirming')}
        </p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {showDeposit && !activeOrder && <p className="text-xs text-muted">{t('premiumCheckout.createOrderHint')}</p>}
    </div>
  )
}
