import { useQuery } from '@tanstack/react-query'

import { Link } from 'react-router-dom'

import { useTranslation } from 'react-i18next'

import { api } from '../api/client'

import { PremiumCheckout } from '../components/PremiumCheckout'

import { Badge } from '../components/Badge'

import { PageHero } from '../components/PageHero'

import { isPremium } from '../lib/auth'

import { SeoFaq } from '../components/SeoFaq'
import { getPricingFaq } from '../lib/seo'
import { useAuth } from '../context/AuthContext'

const FREE_FEATURE_KEYS = ['pricing.freeFeatures.replay', 'pricing.freeFeatures.portfolio', 'pricing.freeFeatures.profile'] as const

const PREMIUM_FEATURE_KEYS = [
  'pricing.premiumFeatures.live',
  'pricing.premiumFeatures.paris',
  'pricing.premiumFeatures.top5',
  'pricing.premiumFeatures.topProbas',
  'pricing.premiumFeatures.betFromLive',
] as const

export function PricingPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()

  const plansQ = useQuery({ queryKey: ['billing-plans'], queryFn: api.billingPlans })
  const plan = plansQ.data?.plans?.[0]
  const premium = isPremium(user)

  const durationLabel = plan ? `${plan.duration_days} ${i18n.language === 'en' ? 'days' : 'jours'}` : i18n.language === 'en' ? '30 days' : '30 jours'

  return (
    <div>
      <PageHero
        kicker={t('pricing.kicker')}
        title={t('pricing.title')}
        subtitle={t('pricing.subtitle')}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold">{t('pricing.free')}</h2>
            <Badge tone="success">{t('pricing.accountRequired')}</Badge>
          </div>
          <p className="mb-4 text-sm text-muted">{t('pricing.freeDesc')}</p>
          <ul className="space-y-2 text-sm">
            {FREE_FEATURE_KEYS.map((key) => (
              <li key={key} className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
          {!user && (
            <Link
              to="/login"
              className="mt-5 inline-block rounded-lg border border-border px-4 py-2 text-sm hover:border-accent/40"
            >
              {t('pricing.createAccount')}
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-accent/30 bg-panel p-5 glow-success">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold">{t('pricing.premium')}</h2>
            <Badge tone="accent">ETH · Base</Badge>
          </div>
          <p className="mb-4 text-sm text-muted">{t('pricing.premiumDesc', { days: durationLabel })}</p>
          <ul className="space-y-2 text-sm">
            {PREMIUM_FEATURE_KEYS.map((key) => (
              <li key={key} className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
          {premium ? (
            <p className="mt-5 text-sm text-accent">
              {t('pricing.premiumActive')}
              {user?.premium_until
                ? t('pricing.premiumUntil', {
                    date: new Date(user.premium_until).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : 'fr-FR'),
                  })
                : ''}
              .
            </p>
          ) : user ? (
            <PremiumCheckout />
          ) : (
            <Link
              to="/login"
              className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
            >
              {t('pricing.loginToBuy')}
            </Link>
          )}
        </div>
      </div>

      <SeoFaq items={getPricingFaq(i18n.language)} />

      {user && (
        <p className="mt-6 text-center text-xs text-muted">
          {t('pricing.connectedAs', { name: user.display_name, tier: user.tier ?? 'free' })}
        </p>
      )}
    </div>
  )
}
