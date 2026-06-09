import { useMutation, useQuery } from '@tanstack/react-query'

import { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import type { Address, Hex } from 'viem'

import { api } from '../api/client'

import { formatEthFromWei, payPremiumDeposit, payPremiumOrder } from '../lib/billingPay'

import { useAuth } from '../context/AuthContext'

type Props = {
  planId?: string
}

export function PremiumCheckout({ planId = 'premium_30d' }: Props) {
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
      if (!token) throw new Error('Connectez-vous pour payer')
      if (!cfg?.payments_enabled) {
        throw new Error('Paiements ETH non activés sur le serveur')
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
      if (!token) throw new Error('Connectez-vous pour payer')
      if (!cfg?.payments_enabled) {
        throw new Error('Paiements ETH non activés sur le serveur')
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
        throw new Error('Paiement non configuré (adresse de dépôt ou contrat manquant)')
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
      setError('Copie impossible')
    }
  }

  if (paid) {
    return (
      <div className="mt-5 space-y-2">
        <p className="text-sm text-accent">Paiement confirmé — premium actif.</p>
        <Link to="/live" className="text-sm text-accent hover:underline">
          Ouvrir le Live Tracker →
        </Link>
      </div>
    )
  }

  if (!cfg?.payments_enabled) {
    return (
      <p className="mt-5 text-sm text-muted">
        Paiement ETH en cours de configuration sur le serveur (mnemonic HD + RPC). Contactez l&apos;admin.
      </p>
    )
  }

  const activeOrder = order ?? (createMut.data ?? null)
  const showDeposit = !!(activeOrder?.deposit_address || (depositMode && !activeOrder))

  return (
    <div className="mt-5 space-y-3">
      {plan && (
        <p className="text-sm">
          Tarif : <span className="font-semibold text-accent">{formatEthFromWei(plan.price_wei)}</span>
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
          {createMut.isPending ? 'Création…' : 'Créer une commande'}
        </button>
      )}

      {activeOrder?.deposit_address && (
        <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
          <p>
            Envoyez exactement{' '}
            <span className="font-semibold text-accent">{formatEthFromWei(activeOrder.price_wei)}</span>{' '}
            à cette adresse (Base) :
          </p>
          <p className="break-all font-mono text-xs text-fg">{activeOrder.deposit_address}</p>
          <button
            type="button"
            onClick={() => void copyDeposit(activeOrder.deposit_address!)}
            className="text-xs text-accent hover:underline"
          >
            {copied ? 'Copié ✓' : 'Copier l&apos;adresse'}
          </button>
          <p className="text-xs text-muted">
            Commande valide jusqu&apos;à {new Date(activeOrder.expires_at).toLocaleString('fr-FR')}.
            Confirmation automatique sous 1–2 min.
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
            ? 'Wallet…'
            : activeOrder.deposit_address
              ? 'Payer en ETH (MetaMask)'
              : 'Payer via contrat (MetaMask)'}
        </button>
      )}

      {txHash && (
        <p className="text-xs text-muted">
          Tx : <span className="break-all font-mono text-fg">{txHash}</span>
          {order?.status === 'pending' && ' — confirmation 1–2 min…'}
        </p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {showDeposit && !activeOrder && (
        <p className="text-xs text-muted">Créez une commande pour obtenir votre adresse de dépôt unique.</p>
      )}
    </div>
  )
}
