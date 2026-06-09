import { useQuery } from '@tanstack/react-query'

import { Link } from 'react-router-dom'

import { api } from '../api/client'

import { PremiumCheckout } from '../components/PremiumCheckout'

import { Badge } from '../components/Badge'

import { PageHero } from '../components/PageHero'

import { isPremium } from '../lib/auth'

import { SeoFaq } from '../components/SeoFaq'
import { PRICING_FAQ } from '../lib/seo'
import { useAuth } from '../context/AuthContext'



const FREE_FEATURES = [

  '1 Day 1 Pick — replay public et historique',

  'Portefeuille — suivi de votre performance',

  'Profil et compte',

]



const PREMIUM_FEATURES = [

  'Live Tracker — value bets temps réel',

  'Paris du jour — picks actionnables',

  'Top 5 — meilleures opportunités du jour',

  'Top probas — classement modèle complet',

  'Parier depuis le Live Tracker',

]



export function PricingPage() {

  const { user } = useAuth()

  const plansQ = useQuery({ queryKey: ['billing-plans'], queryFn: api.billingPlans })

  const plan = plansQ.data?.plans?.[0]

  const premium = isPremium(user)



  return (

    <div>

      <PageHero

        kicker="Accès"

        title="Gratuit vs Premium"

        subtitle="Le replay 1 Day 1 Pick reste public. Le portefeuille est inclus avec un compte gratuit. Le reste nécessite Premium."

      />



      <div className="grid gap-4 md:grid-cols-2">

        <div className="rounded-2xl border border-border bg-panel p-5">

          <div className="mb-3 flex items-center gap-2">

            <h2 className="text-lg font-semibold">Gratuit</h2>

            <Badge tone="success">Compte requis</Badge>

          </div>

          <p className="mb-4 text-sm text-muted">Inscription gratuite — idéal pour suivre le pick quotidien.</p>

          <ul className="space-y-2 text-sm">

            {FREE_FEATURES.map((f) => (

              <li key={f} className="flex gap-2">

                <span className="text-accent">✓</span>

                <span>{f}</span>

              </li>

            ))}

          </ul>

          {!user && (

            <Link

              to="/login"

              className="mt-5 inline-block rounded-lg border border-border px-4 py-2 text-sm hover:border-accent/40"

            >

              Créer un compte

            </Link>

          )}

        </div>



        <div className="rounded-2xl border border-accent/30 bg-panel p-5 glow-success">

          <div className="mb-3 flex items-center gap-2">

            <h2 className="text-lg font-semibold">Premium</h2>

            <Badge tone="accent">ETH · Base</Badge>

          </div>

          <p className="mb-4 text-sm text-muted">

            Achat unique — accès {plan ? `${plan.duration_days} jours` : '30 jours'} aux outils avancés.

          </p>

          <ul className="space-y-2 text-sm">

            {PREMIUM_FEATURES.map((f) => (

              <li key={f} className="flex gap-2">

                <span className="text-accent">✓</span>

                <span>{f}</span>

              </li>

            ))}

          </ul>

          {premium ? (

            <p className="mt-5 text-sm text-accent">

              Premium actif

              {user?.premium_until

                ? ` jusqu'au ${new Date(user.premium_until).toLocaleDateString('fr-FR')}`

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

              Se connecter pour acheter

            </Link>

          )}

        </div>

      </div>



      <SeoFaq items={PRICING_FAQ} />

      {user && (
        <p className="mt-6 text-center text-xs text-muted">
          Connecté : {user.display_name} · tier {user.tier ?? 'free'}
        </p>
      )}
    </div>

  )

}


