# Changelog — CourtAlpha

## 2026-06-05 (session UI) — Logo, charte, EV lisible, typo, survol tuiles

Synthèse des évolutions UI/UX après le rebrand initial (même journée).

### Logo & identité

| Élément | Détail |
|---------|--------|
| Asset | `frontend/public/courtalpha-logo.png` (PNG fond transparent) |
| Traitement | Suppression damier factice (flood-fill gris) puis suppression du **blanc** (lignes court, coutures balle) |
| Composant | `CourtAlphaLogo.tsx` — tailles `sm` / `md` / `lg` / `xl` ; sidebar = `xl` (~280 px hauteur) |
| Favicon | `index.html` → `/courtalpha-logo.png` |
| Ancien | `courtalpha-logo.svg` retiré |

### Charte graphique (logo CourtAlpha)

| Token CSS | Hex | Usage |
|-----------|-----|--------|
| `accent` / `brand` | `#C8F135` | Marque, EV **≥ 15 %**, CTA primaires |
| `teal` / `success` | `#00D4C8` | EV **8–15 %**, badges value, charts ATP |
| `cyan` / `proba` | `#00D4FF` | Proba modèle |
| `stake` / `warning` | `#FFD93D` | Mise Kelly reco |
| `danger` | `#FF4757` | EV &lt; 0 |
| `bg` | `#121212` | Fond app |

Fichiers : `frontend/src/index.css`, `frontend/src/lib/brand.ts` (constantes Recharts).

Polices : **Inter** (UI), **Montserrat** (titres `font-display`), **JetBrains Mono** (`.quant`).

### Proba modèle (inchangé fonctionnel, rappel)

- Helper `lib/modelProba.ts`
- Champs API : `p_model_pct`, `p_model_fav`, `feature_snapshot.capped_p1_prob`
- Cartes : `ValueBetCard`, `PickCard`, `MatchCard` ; cote observée **toujours éditable**

### Lisibilité EV / cotes (correctif « tout en lime »)

Problème : après rebrand, `accent` et `success` étaient tous deux `#C8F135` — proba, EV et cotes indistinguables.

| Livrable | Détail |
|----------|--------|
| `lib/evDisplay.ts` | Paliers EV, classes pill/texte/carte, `formatEvPct`, `oddsHighlightClass`, `impliedEvPct` |
| `lib/liveMetrics.ts` | Type exporté `EvTier` : `strong` (≥15 %), `ok` (8–15), `weak` (0–8), `neg` (&lt;0) |
| `EvPill.tsx` | Pastille EV colorée sur tuiles Live / Paris |
| `EvLegend.tsx` | Légende sous le hero Live Tracker |
| Cartes | Bordure gauche `border-l-4` selon palier ; glow lime si EV ≥ 15 % |
| `MatchCard` | EV implicite par joueur (cote vs proba modèle) + fond teinté |
| Champ cote | Contour lime/teal/rouge si EV élevé (`ValueBetCard`) |

### Typographie compacte

- Échelle Tailwind réduite dans `@theme` (`text-base` = 14 px au lieu de 16)
- Titres page, métriques tuiles, boutons, sidebar, padding cartes (`p-3` / `p-4`)

### Interaction tuiles (`Card` `interactive`)

- Classe CSS `.tile-lift` sur `ValueBetCard`, `PickCard`, `MatchCard`
- Survol : `translateY(-4px)` + bordure teal discrète + ombre légère
- **Sans** `scale`, `filter: brightness`, `will-change` (évite flou texte après survol)
- Contour hover adouci (teal ~22 %, pas de double ring)
- Désactivé si `prefers-reduced-motion`

### Layout

- Sidebar élargie (`md:grid-cols-[280px_1fr]`)
- Logo header retiré (branding sidebar uniquement)

### Fichiers touchés (principaux)

```
frontend/src/index.css
frontend/src/lib/brand.ts
frontend/src/lib/evDisplay.ts
frontend/src/lib/liveMetrics.ts
frontend/src/lib/modelProba.ts
frontend/src/components/CourtAlphaLogo.tsx
frontend/src/components/EvPill.tsx
frontend/src/components/EvLegend.tsx
frontend/src/components/ValueBetCard.tsx
frontend/src/components/PickCard.tsx
frontend/src/components/MatchCard.tsx
frontend/src/components/ui/card.tsx
frontend/src/components/ui/button.tsx
frontend/src/components/ui/stat-tile.tsx
frontend/src/components/PageHero.tsx
frontend/src/components/layout/Sidebar.tsx
frontend/src/components/layout/Header.tsx
frontend/src/pages/LivePage.tsx
frontend/public/courtalpha-logo.png
docs/UI_DESIGN.md
```

### BettingHUD (moteur, même période)

Garde-fou données périmées (partagé Streamlit PROD + API CourtAlpha) :

- `BettingHUD/scripts/match_rank_quality.py`
- Variable `BETTINGHUD_STALE_RANK_STATS_MAX_DAYS` (défaut 365)
- Doc : `BettingHUD/docs/CHANGELOG_RECENT.md`, `ARCHITECTURE_ACTUELLE_ET_MISES.md`

---

## 2026-06-05 — Rebrand CourtAlpha + proba modèle + polish UI

### Frontend

- Rebrand complet **CourtAlpha** (titre, header, sidebar, login, meta, package `courtalpha`)
- Logo SVG `frontend/public/courtalpha-logo.svg` + composant `CourtAlphaLogo`
- **Proba modèle** visible sur `ValueBetCard`, `PickCard`, `MatchCard` (`p_model_pct`, `p_model_fav`, `feature_snapshot.capped_p1_prob`)
- Cote observée éditable conservée (`ValueBetCard` + `BetModal`)
- Polish : gradients fond, `brand-ring`, hiérarchie typo, sidebar accent, `PageHero` / `StatTile`
- Helper `lib/modelProba.ts`

### Projet

- Dossier renommé `BettingHUD-Web` → `CourtAlpha`
- `BETTINGHUD_ROOT` inchangé (pointe toujours vers le moteur)

## 2026-06-05 — UI étape 1 (design system + shell)

### Frontend

- Primitives `components/ui/` : `Button`, `Input`, `Select`, `StatTile`, `Card`, `CardGridSkeleton`
- Hiérarchie : Header = KPIs seulement · Sidebar = logo + nav · `PageHero` = titre unique par page
- `ValueBetCard` : ligne principale EV / Kelly / Parier + détails repliables
- Login plein écran (sans sidebar) · routes toujours rendues (plus de blocage global au chargement)
- `PickCard` : sans emojis, pick #1 en `featured` (Paris / Top5)
- `index.html` : titre « CourtAlpha », `lang="fr"`

## 2026-06-05 — Scaffold initial (Option B PREPROD)

### Création projet

- Dossier frère `CourtAlpha/` à côté de `BettingHUD/`
- **Aucune modification** du dépôt `BettingHUD` pour l’UI Streamlit

### API (`api/`)

- FastAPI + uvicorn, lecture seule
- `api/bridge.py` : branchement sur `BETTINGHUD_ROOT`
- Endpoints : `/api/health`, `/api/live/meta`, `/api/live/matches`, `/api/picks/jour`, `/api/picks/top5`
- CORS pour React dev (`localhost:5173`)

### Frontend (`frontend/`)

- Vite + React + TypeScript
- Proxy `/api` → port 8000
- Page unique : onglets Live / Picks / Top 5
- Client typé `src/api/client.ts`

### Configuration

- `.env` / `.env.example` avec `BETTINGHUD_ROOT`
- Réutilisation du venv `BettingHUD/venv`

### Documentation

- `docs/README.md`, `GETTING_STARTED.md`, `ARCHITECTURE.md`, `API.md`
- Lien croisé `BettingHUD/docs/WEB_REACT.md`
- `AGENTS.md` : règle documentation systématique

### Dépannage / outillage

- `scripts/start-dev.ps1` — lance API + React (2 fenêtres)
- `GETTING_STARTED.md` : précision « 2 terminaux obligatoires » pour `:5173`

### Dépannage PREPROD (5 juin, après coup)

- Cause **0 pick** : snapshot local daté **2026-06-02** alors que jour courant **2026-06-05**
- Fix : `rebuild_live_projection.py` → 83 matchs, picks `/jour` de nouveau disponibles
- Doc `GETTING_STARTED.md` : ligne dépannage snapshot périmé

### Design & parité fonctionnelle (5 juin)

- `docs/UI_DESIGN.md` — inspiration [SoDeglingo](https://sodeglingo.io/), stack Tailwind + shadcn
- `docs/PAGE_MAP.md` — mapping 8 onglets Streamlit → routes React + API à créer

### Sprint S1 UI (5 juin)

- Front React migré vers **routing** (`react-router-dom`)
- Shell app type SoDeglingo: **sidebar + header + contenu**
- Routes actives: `/live`, `/paris`, `/top5`, `/` redirigé vers `/live`
- Thème sombre quant renforcé (`App.css`, chiffres en police mono)
- Validation technique: `npm run build` OK

### Sprint S1.5 — Design Scout Tennis (option A)

- **Tailwind CSS v4** + tokens quant (`index.css`)
- Composants : `PageHero`, `PickCard`, `MatchCard`, `RankedTable`, `FilterPills`, `EmptyState`, `Badge`
- Layout : `Sidebar` (icônes Lucide), `Header` (KPI snapshot + bankroll)
- Pages séparées : `LivePage`, `ParisPage`, `Top5Page`, `PortfolioPage`
- **TanStack Query** pour le cache API

### Sprint S2 — Filtres Live

- `FilterPills` : circuit ATP/WTA/Tous + recherche joueur (client-side)
- `MatchCard` enrichie (badges, cotes)

### Sprint S3 — Portfolio lecture

- API `GET /api/portfolio/summary`, `GET /api/portfolio/bets`
- Page `/portfolio` : KPI bankroll + tableau paris

### Sprint S4 — Paris interactifs

- API `POST /api/bets` → `save_bet_enriched`
- `BetModal` sur Paris du jour
- `ev_at_bet` en fraction (aligné Streamlit)

### Sprint S5 — Top probas (5 juin)

- API `GET /api/picks/top-probas` + service `api/services/top_probas.py`
- Page `/top-probas` : graphique Recharts horizontal + tableau (toggle challengers)
- Dépendance `recharts`

### Sprint S6 — Backtest + Tracking (5 juin)

- API `GET /api/backtest/years`, `POST /api/backtest/simulate`
- API `GET /api/tracking`
- Pages `/backtest` (formulaire Kelly + courbe bankroll) et `/tracking` (drift + calibration)

### Sprint S7 — Auth + Settings (5 juin)

- API `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` (tokens mémoire)
- API `GET /api/system/status`
- `AuthContext` React, page `/login`, page `/settings`
- Sidebar étendue (Top probas, Backtest, Tracking, Paramètres)
- Auth optionnelle PREPROD (`BETTINGHUD_WEB_AUTH_REQUIRED=0` par défaut)

### Profil utilisateur — CourtAlpha (5 juin)

- API `PATCH /api/auth/profile`, `POST /api/auth/avatar`, `GET /api/auth/avatar/{username}`
- `web_auth.py` : avatars `data/web_avatars/`, champs `telegram_username`, `avatar_url` dans la session
- Page `/profile` : photo, nom affiché, ID + @ Telegram
- `UserAvatar` + bloc profil en bas de sidebar ; routes protégées si `BETTINGHUD_WEB_AUTH_REQUIRED=1`
- `POST /api/bets` : lie `telegram_user_id` du compte connecté (401 si auth requise)

### Live Tracker — tuiles value bets (5 juin, suite)

- API `GET /api/live/value-bets` (logique `live_tracker_picks`)
- Composant `ValueBetCard` : cote ajustable, panneau EV book/fair/custom, mise Kelly reco
- `BetModal` : cote custom + mise pré-remplie Kelly
- Toggle « Value EV 15%+ » / « Tous les matchs »
- Panneau **« Pourquoi cette value ? »** : human factors, comparatif Elo/forme, dynamique H2H, signaux avancés (`scripts/live_value_explain.py`)

### Portefeuille — parité Streamlit (5 juin, suite)

- Page `/portfolio` : bankroll Kelly, stats globales, courbes P/L + drawdown, CLV, filtres/tri tableau
- Paris en attente : boutons Gagné / Perdu (règlement manuel)
- Actions ops : MAJ CLV, scraper résultats, réconciliation 3 sources
- API étendue : `GET /portfolio/summary`, filtres `GET /portfolio/bets`, `PATCH /portfolio/bets/{id}`, endpoints `/portfolio/actions/*`
- Scope Telegram : bankroll et paris filtrés par `telegram_user_id` du profil connecté

### Prochaines étapes

- Diagnostics modèle `/diagnostics` (jobs async)
- Déploiement PREPROD (nginx, systemd)
