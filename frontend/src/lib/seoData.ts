/** Source unique SEO — importée par seo.ts et les scripts de build. */

export const SITE_URL = 'https://courtalpha.tech' as const
export const SITE_HOST = 'courtalpha.tech' as const
export const SITE_NAME = 'CourtAlpha' as const
/** IndexNow — fichier public /{key}.txt (Bing, Yandex, etc.) */
export const INDEXNOW_KEY = 'ca8f3e2b1d4c49a7b6e5f0d9c8b7a6' as const
export const INDEXNOW_KEY_URL = `${SITE_URL}/${INDEXNOW_KEY}.txt` as const
export const DEFAULT_DESCRIPTION =
  'CourtAlpha — intelligence tennis, probabilités modèle et value bets transparents.'

export const DEFAULT_DESCRIPTION_EN =
  'CourtAlpha — tennis intelligence, model probabilities, and transparent value bets.'

export type SeoLang = 'fr' | 'en'

export function normalizeSeoLang(lang?: string): SeoLang {
  return lang?.startsWith('en') ? 'en' : 'fr'
}

/** Bloc factuel pour LLM / SEO / page Methodo. */
export const COURTALPHA_ABOUT = {
  title: "Qu'est-ce que CourtAlpha ?",
  summary:
    'CourtAlpha (courtalpha.tech) est une application web française de value bets tennis ATP/WTA : probabilités modèle, expected value (EV), pick quotidien public auditable (1 Day 1 Pick), Live Tracker et Top 5 en Premium.',
  bullets: [
    'Site : https://courtalpha.tech',
    'Produit phare gratuit : 1 Day 1 Pick — un pick/jour, historique public vérifiable (hit rate, bankroll 100 €)',
    'Stratégie : favori modèle sur tournois majeurs 250+, bande EV +15 % à +100 %',
    'Premium : Live Tracker, Paris du jour, Top 5, Top probas',
    'Langue : français · Sport : tennis uniquement',
  ],
  disclaimer:
    'Outil statistique — pas un conseil financier. Paris sportifs : risque de perte, 18+, jouez responsablement.',
} as const

export const COURTALPHA_ABOUT_EN = {
  title: 'What is CourtAlpha?',
  summary:
    'CourtAlpha (courtalpha.tech) is a French web app for ATP/WTA tennis value bets: model probabilities, expected value (EV), auditable daily public pick (1 Day 1 Pick), Live Tracker and Top 5 in Premium.',
  bullets: [
    'Site: https://courtalpha.tech',
    'Flagship free product: 1 Day 1 Pick — one pick/day, verifiable public history (hit rate, 100 € bankroll)',
    'Strategy: model favorite on major 250+ tournaments, EV band +15% to +100%',
    'Premium: Live Tracker, Today\'s picks, Top 5, Top probas',
    'Language: French · Sport: tennis only',
  ],
  disclaimer:
    'Statistical tool — not financial advice. Sports betting involves risk of loss, 18+, gamble responsibly.',
} as const

export function getCourtAlphaAbout(lang?: string) {
  return normalizeSeoLang(lang) === 'en' ? COURTALPHA_ABOUT_EN : COURTALPHA_ABOUT
}

export const OG_IMAGE = `${SITE_URL}/courtalpha-logo.png`
export const OG_IMAGE_PICK = `${SITE_URL}/og-1-day-1-pick.png`

/** Canal Telegram public — VITE_TELEGRAM_CHANNEL_URL au build Vite (ex. https://t.me/courtalpha_1day1pick). */
function _viteEnv(key: string): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    return (env?.[key] ?? '').trim()
  } catch {
    return ''
  }
}

export const TELEGRAM_CHANNEL_URL = _viteEnv('VITE_TELEGRAM_CHANNEL_URL')

export function trackRecordUrl(campaign: string): string {
  const q = new URLSearchParams({
    utm_source: campaign.includes('telegram') ? 'telegram' : campaign,
    utm_medium: campaign === 'share' ? 'share' : 'web',
    utm_campaign: campaign,
  })
  return `${SITE_URL}/1-day-1-pick?${q.toString()}`
}

export const SHARE_TRACK_RECORD_URL = trackRecordUrl('share')

export type RobotsDirective = 'index,follow' | 'noindex,nofollow'

export type PageSeo = {
  title: string
  description: string
  robots: RobotsDirective
  ogImage?: string
}

export const ONE_DAY_ONE_PICK_EDITORIAL = {
  title: 'Comment fonctionne 1 Day 1 Pick ?',
  paragraphs: [
    'Chaque jour calendaire (fuseau Europe/Paris), CourtAlpha sélectionne un seul match sur les tournois majeurs ATP et WTA (rank=1). Le pick est le favori modèle avec la probabilité la plus élevée, dans une bande d’expected value (EV) de 15 % à 100 %.',
    'La bankroll simulée part de 100 €. Les mises suivent un pourcentage théorique du modèle ; la courbe, le P/L net, le hit rate et le ROI sont recalculés automatiquement à chaque nouveau résultat. Le pick du jour se met à jour depuis le snapshot live ; l’historique s’allonge au fil des captures.',
    'Cette page est publique et vérifiable : vous pouvez auditer chaque pari passé (cote, proba, EV, score) sans compte. Pour le Live Tracker, le Top 5 et les paris actionnables du jour, voir les offres Premium.',
  ],
  links: [
    { href: '/methodo', label: 'Stratégie & backtests' },
    { href: '/1-day-1-pick/archive', label: 'Archives mensuelles' },
    { href: '/pricing', label: 'Tarifs Gratuit vs Premium' },
  ],
} as const

export const ONE_DAY_ONE_PICK_EDITORIAL_EN = {
  title: 'How does 1 Day 1 Pick work?',
  paragraphs: [
    'Each calendar day (Europe/Paris timezone), CourtAlpha selects a single match from major ATP and WTA tournaments (rank=1). The pick is the model favorite with the highest probability, within an expected value (EV) band of 15% to 100%.',
    'The simulated bankroll starts at 100 €. Stakes follow a theoretical model percentage; the curve, net P/L, hit rate, and ROI are recalculated automatically with each new result. Today\'s pick updates from the live snapshot; history grows as picks are captured.',
    'This page is public and verifiable: you can audit every past bet (odds, proba, EV, score) without an account. For the Live Tracker, Top 5, and actionable daily picks, see Premium plans.',
  ],
  links: [
    { href: '/methodo', label: 'Strategy & backtests' },
    { href: '/1-day-1-pick/archive', label: 'Monthly archives' },
    { href: '/pricing', label: 'Free vs Premium pricing' },
  ],
} as const

export function getOneDayOnePickEditorial(lang?: string) {
  return normalizeSeoLang(lang) === 'en' ? ONE_DAY_ONE_PICK_EDITORIAL_EN : ONE_DAY_ONE_PICK_EDITORIAL
}

export const PRICING_FAQ = [
  {
    q: 'Qu’est-ce qui reste gratuit ?',
    a: 'Le replay 1 Day 1 Pick (historique public), la création de compte, le portefeuille et le profil. Aucune carte bancaire requise pour ces fonctionnalités.',
  },
  {
    q: 'Que débloque Premium ?',
    a: 'Live Tracker (value bets temps réel), Paris du jour, Top 5, Top probas et la possibilité de parier depuis le Live Tracker.',
  },
  {
    q: 'Comment payer Premium ?',
    a: 'Paiement en ETH sur Base (mainnet ou testnet selon configuration). Chaque commande reçoit une adresse de dépôt unique ; l’accès est activé dès confirmation on-chain.',
  },
  {
    q: 'Puis-je annuler ou être remboursé ?',
    a: 'L’accès Premium est un achat numérique à durée limitée (ex. 30 jours). Les paiements blockchain sont irréversibles ; contactez le support en cas de problème technique avéré.',
  },
  {
    q: 'Les probabilités garantissent-elles des gains ?',
    a: 'Non. CourtAlpha fournit des estimations statistiques et des outils de suivi. Les paris sportifs comportent un risque de perte ; jouez de manière responsable.',
  },
] as const

export const PRICING_FAQ_EN = [
  {
    q: 'What stays free?',
    a: 'The 1 Day 1 Pick replay (public history), account creation, portfolio, and profile. No credit card required for these features.',
  },
  {
    q: 'What does Premium unlock?',
    a: 'Live Tracker (real-time value bets), Today\'s picks, Top 5, Top probas, and the ability to bet from the Live Tracker.',
  },
  {
    q: 'How do I pay for Premium?',
    a: 'Payment in ETH on Base (mainnet or testnet depending on configuration). Each order receives a unique deposit address; access is activated upon on-chain confirmation.',
  },
  {
    q: 'Can I cancel or get a refund?',
    a: 'Premium access is a limited-duration digital purchase (e.g. 30 days). Blockchain payments are irreversible; contact support in case of a proven technical issue.',
  },
  {
    q: 'Do probabilities guarantee profits?',
    a: 'No. CourtAlpha provides statistical estimates and tracking tools. Sports betting involves risk of loss; gamble responsibly.',
  },
] as const

export function getPricingFaq(lang?: string) {
  return normalizeSeoLang(lang) === 'en' ? PRICING_FAQ_EN : PRICING_FAQ
}

export const METHODOLOGY_SECTIONS = [
  {
    id: 'modele',
    title: 'Modèle de probabilité',
    body: 'CourtAlpha estime la probabilité de victoire de chaque joueur à partir de données historiques (forme, surface, niveau du tournoi, classements). Les probabilités sont recalibrées régulièrement sur des milliers de matchs passés.',
  },
  {
    id: 'ev',
    title: 'Expected value (EV)',
    body: 'L’EV compare la probabilité modèle à la cote du marché. Un EV positif signifie que la cote semble supérieure à la probabilité implicite du bookmaker selon notre modèle — c’est la base des value bets.',
  },
  {
    id: 'selection',
    title: 'Sélection 1 Day 1 Pick',
    body: 'Parmi les matchs majeurs du jour, on retient le favori modèle le plus confiant (proba max) dont l’EV est dans la bande 15–100 %. Un seul pick par jour calendaire, publié en replay transparent.',
  },
  {
    id: 'transparence',
    title: 'Transparence & limites',
    body: 'Tous les picks passés restent consultables avec cote, mise théorique et résultat. Le modèle peut se tromper ; la variance tennis est élevée. CourtAlpha ne constitue pas un conseil en investissement.',
  },
] as const

/** Routes indexables (sitemap + prerender). */
export const SITEMAP_STATIC_PATHS = [
  '/1-day-1-pick',
  '/pricing',
  '/methodo',
  '/1-day-1-pick/archive',
] as const

export function archiveMonthPaths(count = 6): string[] {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    out.push(`/1-day-1-pick/archive/${y}-${m}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}

export function allSitemapPaths(): string[] {
  return [...SITEMAP_STATIC_PATHS, ...archiveMonthPaths()]
}

export const PAGE_SEO: Record<string, PageSeo> = {
  '/1-day-1-pick': {
    title: '1 Day 1 Pick — pronostic tennis quotidien | CourtAlpha',
    description:
      'Track record public du pick tennis n°1 chaque jour : hit rate, bankroll 100 €, ROI, courbe et historique vérifiable sur tournois majeurs ATP/WTA.',
    robots: 'index,follow',
    ogImage: OG_IMAGE_PICK,
  },
  '/pricing': {
    title: 'Tarifs — CourtAlpha Premium tennis',
    description:
      'Gratuit : 1 Day 1 Pick et portefeuille. Premium : Live Tracker, Top 5, Top probas et Paris du jour. Paiement ETH sur Base.',
    robots: 'index,follow',
  },
  '/methodo': {
    title: 'Methodo — stratégie tennis & backtests | CourtAlpha',
    description:
      'Stratégie value bets tennis : probas modèle, EV, Kelly calibré. Extraits backtest no-leak, transparence vs tipsters classiques. Data & paris.',
    robots: 'index,follow',
  },
  '/methodologie': {
    title: 'Methodo — CourtAlpha',
    description: DEFAULT_DESCRIPTION,
    robots: 'noindex,nofollow',
  },
  '/1-day-1-pick/archive': {
    title: 'Archives 1 Day 1 Pick — CourtAlpha',
    description:
      'Index des archives mensuelles du pick quotidien CourtAlpha : performance et historique par mois.',
    robots: 'index,follow',
  },
  '/live': {
    title: 'Live Tracker — CourtAlpha',
    description: 'Value bets tennis du jour (Premium).',
    robots: 'noindex,nofollow',
  },
  '/paris': {
    title: 'Paris du jour — CourtAlpha',
    description: 'Top picks actionnables du jour (Premium).',
    robots: 'noindex,nofollow',
  },
  '/top5': {
    title: 'Top 5 — CourtAlpha',
    description: 'Les cinq meilleures opportunités du jour (Premium).',
    robots: 'noindex,nofollow',
  },
  '/login': {
    title: 'Connexion — CourtAlpha',
    description: 'Connexion à votre compte CourtAlpha.',
    robots: 'noindex,nofollow',
  },
  '/top-probas': {
    title: 'Top probas — CourtAlpha',
    description: 'Classement des probabilités modèle du jour (Premium).',
    robots: 'noindex,nofollow',
  },
  '/portfolio': {
    title: 'Portefeuille — CourtAlpha',
    description: 'Suivi bankroll et paris en cours (compte gratuit).',
    robots: 'noindex,nofollow',
  },
  '/profile': {
    title: 'Profil — CourtAlpha',
    description: 'Paramètres de profil et compte utilisateur.',
    robots: 'noindex,nofollow',
  },
  '/backtest': {
    title: 'Backtest — CourtAlpha',
    description: 'Simulation Kelly multi-années (admin).',
    robots: 'noindex,nofollow',
  },
  '/tracking': {
    title: 'Tracking modèle — CourtAlpha',
    description: 'Performance réelle vs modèle (admin).',
    robots: 'noindex,nofollow',
  },
  '/frequentation': {
    title: 'Fréquentation — CourtAlpha',
    description: 'Statistiques de trafic web (admin).',
    robots: 'noindex,nofollow',
  },
  '/settings': {
    title: 'Paramètres — CourtAlpha',
    description: 'Statut système et administration (admin).',
    robots: 'noindex,nofollow',
  },
  '/': {
    title: 'CourtAlpha',
    description: DEFAULT_DESCRIPTION,
    robots: 'noindex,nofollow',
  },
  '/track-record': {
    title: '1 Day 1 Pick — CourtAlpha',
    description: DEFAULT_DESCRIPTION,
    robots: 'noindex,nofollow',
  },
  '/top1-historique': {
    title: '1 Day 1 Pick — CourtAlpha',
    description: DEFAULT_DESCRIPTION,
    robots: 'noindex,nofollow',
  },
}

export const PAGE_SEO_EN: Record<string, PageSeo> = {
  '/1-day-1-pick': {
    title: '1 Day 1 Pick — daily tennis pick | CourtAlpha',
    description:
      'Public track record of the #1 tennis pick each day: hit rate, 100 € bankroll, ROI, curve, and verifiable history on major ATP/WTA tournaments.',
    robots: 'index,follow',
    ogImage: OG_IMAGE_PICK,
  },
  '/pricing': {
    title: 'Pricing — CourtAlpha Premium tennis',
    description:
      'Free: 1 Day 1 Pick and portfolio. Premium: Live Tracker, Top 5, Top probas, and Today\'s picks. ETH payment on Base.',
    robots: 'index,follow',
  },
  '/methodo': {
    title: 'Methodo — tennis strategy & backtests | CourtAlpha',
    description:
      'Tennis value bet strategy: model probas, EV, calibrated Kelly. No-leak backtest excerpts, transparency vs classic tipsters.',
    robots: 'index,follow',
  },
  '/methodologie': {
    title: 'Methodo — CourtAlpha',
    description: DEFAULT_DESCRIPTION_EN,
    robots: 'noindex,nofollow',
  },
  '/1-day-1-pick/archive': {
    title: '1 Day 1 Pick archives — CourtAlpha',
    description: 'Index of monthly archives for the CourtAlpha daily pick: performance and history by month.',
    robots: 'index,follow',
  },
  '/live': {
    title: 'Live Tracker — CourtAlpha',
    description: 'Today\'s tennis value bets (Premium).',
    robots: 'noindex,nofollow',
  },
  '/paris': {
    title: 'Today\'s picks — CourtAlpha',
    description: 'Top actionable picks of the day (Premium).',
    robots: 'noindex,nofollow',
  },
  '/top5': {
    title: 'Top 5 — CourtAlpha',
    description: 'The five best opportunities of the day (Premium).',
    robots: 'noindex,nofollow',
  },
  '/login': {
    title: 'Log in — CourtAlpha',
    description: 'Sign in to your CourtAlpha account.',
    robots: 'noindex,nofollow',
  },
  '/top-probas': {
    title: 'Top probas — CourtAlpha',
    description: 'Daily model probability ranking (Premium).',
    robots: 'noindex,nofollow',
  },
  '/portfolio': {
    title: 'Portfolio — CourtAlpha',
    description: 'Bankroll tracking and open bets (free account).',
    robots: 'noindex,nofollow',
  },
  '/profile': {
    title: 'Profile — CourtAlpha',
    description: 'Profile settings and user account.',
    robots: 'noindex,nofollow',
  },
  '/backtest': {
    title: 'Backtest — CourtAlpha',
    description: 'Multi-year Kelly simulation (admin).',
    robots: 'noindex,nofollow',
  },
  '/tracking': {
    title: 'Model tracking — CourtAlpha',
    description: 'Real performance vs model (admin).',
    robots: 'noindex,nofollow',
  },
  '/frequentation': {
    title: 'Traffic — CourtAlpha',
    description: 'Web traffic statistics (admin).',
    robots: 'noindex,nofollow',
  },
  '/settings': {
    title: 'Settings — CourtAlpha',
    description: 'System status and administration (admin).',
    robots: 'noindex,nofollow',
  },
  '/': {
    title: 'CourtAlpha',
    description: DEFAULT_DESCRIPTION_EN,
    robots: 'noindex,nofollow',
  },
  '/track-record': {
    title: '1 Day 1 Pick — CourtAlpha',
    description: DEFAULT_DESCRIPTION_EN,
    robots: 'noindex,nofollow',
  },
  '/top1-historique': {
    title: '1 Day 1 Pick — CourtAlpha',
    description: DEFAULT_DESCRIPTION_EN,
    robots: 'noindex,nofollow',
  },
}

const FALLBACK_SEO: PageSeo = {
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  robots: 'noindex,nofollow',
}

const FALLBACK_SEO_EN: PageSeo = {
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION_EN,
  robots: 'noindex,nofollow',
}

function monthLabelForLang(yearMonth: string, lang: SeoLang): string {
  const [y, m] = yearMonth.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

export function archiveSeo(yearMonth: string, lang?: string): PageSeo {
  const seoLang = normalizeSeoLang(lang)
  const monthLabel = monthLabelForLang(yearMonth, seoLang)
  if (seoLang === 'en') {
    return {
      title: `Archive ${monthLabel} — 1 Day 1 Pick | CourtAlpha`,
      description: `History and performance of the CourtAlpha daily tennis pick for ${monthLabel}: matches, results, and monthly stats.`,
      robots: 'index,follow',
    }
  }
  return {
    title: `Archive ${monthLabel} — 1 Day 1 Pick | CourtAlpha`,
    description: `Historique et performance du pick tennis quotidien CourtAlpha pour ${monthLabel} : matchs, résultats et stats du mois.`,
    robots: 'index,follow',
  }
}

export function seoForPath(pathname: string, lang?: string): PageSeo {
  const seoLang = normalizeSeoLang(lang)
  const table = seoLang === 'en' ? PAGE_SEO_EN : PAGE_SEO
  const fallback = seoLang === 'en' ? FALLBACK_SEO_EN : FALLBACK_SEO
  if (pathname.startsWith('/1-day-1-pick/archive/') && pathname !== '/1-day-1-pick/archive') {
    const ym = pathname.split('/').pop() || ''
    if (/^\d{4}-\d{2}$/.test(ym)) return { ...archiveSeo(ym, seoLang), ogImage: OG_IMAGE_PICK }
  }
  return table[pathname] ?? fallback
}

export function canonicalUrl(pathname: string): string {
  const path = pathname === '/' ? '' : pathname
  return `${SITE_URL}${path}`
}

export function jsonLdForPath(pathname: string, lang?: string): object[] {
  const seoLang = normalizeSeoLang(lang)
  const seo = seoForPath(pathname, seoLang)
  const about = getCourtAlphaAbout(seoLang)
  const description = seoLang === 'en' ? DEFAULT_DESCRIPTION_EN : DEFAULT_DESCRIPTION
  const url = canonicalUrl(pathname)
  const base = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: OG_IMAGE,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web browser',
      description: about.summary,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: seoLang === 'en' ? 'Public 1 Day 1 Pick + free account' : '1 Day 1 Pick public + compte gratuit',
      },
    },
  ]
  if (seo.robots !== 'index,follow') return []

  const page = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.title,
    description: seo.description,
    url,
    isPartOf: { '@type': 'WebSite', url: SITE_URL },
  }

  if (pathname === '/pricing') {
    const faq = getPricingFaq(seoLang)
    return [
      ...base,
      page,
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ]
  }

  if (pathname === '/methodo') {
    return [
      ...base,
      {
        ...page,
        '@type': 'Article',
        headline: seo.title,
        articleSection: 'Methodo',
      },
    ]
  }

  return [...base, page]
}

export function noscriptHtmlForPath(pathname: string): string {
  const seo = seoForPath(pathname)
  if (seo.robots !== 'index,follow') return ''

  if (pathname === '/1-day-1-pick') {
    return `<article>
<h1>1 Day 1 Pick — pronostic tennis quotidien</h1>
<p>${seo.description}</p>
<h2>${ONE_DAY_ONE_PICK_EDITORIAL.title}</h2>
${ONE_DAY_ONE_PICK_EDITORIAL.paragraphs.map((p) => `<p>${p}</p>`).join('\n')}
<p><a href="${SITE_URL}/methodo">Methodo</a> · <a href="${SITE_URL}/pricing">Tarifs</a></p>
</article>`
  }

  if (pathname === '/pricing') {
    const faq = PRICING_FAQ.map((f) => `<h3>${f.q}</h3><p>${f.a}</p>`).join('\n')
    return `<article><h1>Tarifs CourtAlpha</h1><p>${seo.description}</p>${faq}</article>`
  }

  if (pathname === '/methodo') {
    return `<article><h1>Methodo — CourtAlpha</h1><p>${seo.description}</p><p>${COURTALPHA_ABOUT.summary}</p></article>`
  }

  if (pathname === '/1-day-1-pick/archive') {
    return `<article><h1>Archives 1 Day 1 Pick</h1><p>${seo.description}</p></article>`
  }

  if (pathname.startsWith('/1-day-1-pick/archive/')) {
    const ym = pathname.split('/').pop() || ''
    const a = archiveSeo(ym)
    return `<article><h1>${a.title}</h1><p>${a.description}</p></article>`
  }

  return `<article><h1>${seo.title}</h1><p>${seo.description}</p></article>`
}
