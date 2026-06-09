# Cartographie pages — Streamlit → React

Source Streamlit : `BettingHUD/app/dashboard.py` (8 onglets actifs).

Légende statut : ⬜ à faire · 🟡 en cours · ✅ fait

## Vue d’ensemble

| # | Streamlit | Route React | Priorité | Statut |
|---|-----------|-------------|----------|--------|
| 1 | 🎯 Live Tracker | `/live` | P0 | ✅ filtres + MatchCard |
| 2 | 🗓️ Paris du jour | `/paris` | P0 | ✅ PickCard + parier |
| 3 | 📈 Top probas jour | `/top-probas` | P1 | ✅ Recharts + toggle challengers |
| 4 | 💼 Mon Portefeuille | `/portfolio` | P1 | ✅ lecture |
| 5 | 📊 Backtest Kelly (CSV) | `/backtest` | P2 | ✅ simulate + courbe BR |
| 6 | 📡 Tracking modèle (réel) | `/tracking` | P2 | ✅ KPI + calibration |
| 7 | 🧪 Diagnostics Modèle | `/diagnostics` | P3 | ⬜ |
| 8 | 👁 Fréquentation | `/frequentation` | P2 | ✅ admin — stats trafic web |
| 9 | ⚙️ Paramètres | `/settings` | P2 | ✅ statut système + compte |
| — | **1 Day 1 Pick** | `/1-day-1-pick` | P1 | ✅ public |
| — | **Pricing** | `/pricing` | P1 | ✅ checkout ETH |
| — | **Méthodo** | `/methodo` | P1 | ✅ SEO public |
| — | Auth web | `/login` | P1 | ✅ |
| — | (accueil) | `/` | P2 | ✅ → `/1-day-1-pick` |

**Gating premium (PROD)** : `/live`, `/paris`, `/top5`, `/top-probas` → compte premium. Public : `/1-day-1-pick`, `/pricing`, `/methodo`.

Sprints livrés : S1.5 design · S2 filtres Live · S3 Portfolio · S4 POST paris · **S5 Top probas** · **S6 Backtest + Tracking** · **S7 Auth + Settings**.

---

## 1. Live Tracker (`/live`)

**Streamlit** : `_render` section `tab_live` — filtres, cartes value bet, paris, bankroll LT.

**React SoDeglingo-like** :
- `FilterBar` sticky (circuit, recherche joueur, **proba min**, **cote min/max**)
- Grille `MatchCard` avec badges ATP/WTA, segment Brier, panneau EV 3 colonnes
- Actions : ajuster cote, Kelly, **Parier** (modal)
- Bandeau statut snapshot (âge, rebuild en cours)

**API à ajouter** :
- `GET /api/live/matches` ✅ (filtres query à enrichir)
- `GET /api/live/value-bets`
- `GET /api/bankroll/live-tracker`
- `POST /api/bets`
- `GET /api/live/build-status`

**Complexité** : très haute (cœur produit)

---

## 2. Paris du jour (`/paris`)

**Streamlit** : `_render_top5_proba_action_tab` — Top 5 actionnables, édition cotes.

**React** :
- Hero « Mission du jour » (comme SoDeglingo Mission / Best Pick)
- Rang 1–5 en cartes larges
- Lien « Voir dans Live Tracker » (deep link `/live?match=…`)

**API** :
- `GET /api/picks/top5` ✅
- `POST /api/bets`

---

## 1 Day 1 Pick (`/1-day-1-pick`) — public

**React** (pas d’équivalent Streamlit dédié) :
- Hero « 1 Day 1 Pick » — replay historique depuis `daily_top_proba_picks`
- KPI : hit rate, P/L net, croissance, ROI misé, max drawdown
- Courbe bankroll cumulative (Recharts)
- Tableau picks avec `PickMatchupDisplay`, statut match, score final

**API** :
- `GET /api/picks/one-day-one-pick` ✅ (public, sans auth)

**Accès** : visiteur anonyme (sidebar + mobile bottom nav).

---

## 3. Top probas jour (`/top-probas`)

**Streamlit** : `_render_top_model_probs_tab` — Top 15, graphique Altair, toggle challengers.

**React** :
- Table classée + sparkline / bar chart (Recharts)
- Toggle « Inclure challengers » (défaut majors 250+)

**API** :
- `GET /api/picks/top-probas?limit=15&majors_only=true`

---

## 4. Mon Portefeuille (`/portfolio`)

**Streamlit** : onglet portfolio — bets SQLite, CLV, graphiques P/L, sync résultats.

**React** :
- KPI tiles (bankroll, P/L, drawdown)
- Table paris ouverts / clos
- Graphiques courbes bankroll
- Actions : sync CLV, sync résultats, maj résultat manuel

**API** :
- `GET /api/portfolio/summary`
- `GET /api/portfolio/bets`
- `PATCH /api/bets/{id}`
- `POST /api/portfolio/sync-clv`
- `POST /api/portfolio/sync-results`

---

## 5. Backtest Kelly (`/backtest`)

**Streamlit** : CSV backtest, simulation Kelly multi-années.

**React** :
- Formulaire paramètres (années, EV band, top N)
- Courbes bankroll comparatives
- Export CSV

**API** :
- `GET /api/backtest/years`
- `POST /api/backtest/simulate` (job async si long)

---

## 6. Tracking modèle réel (`/tracking`)

**Streamlit** : `model_tracking.py` — perf réelle vs modèle.

**API** : `GET /api/tracking`

---

## 7. Diagnostics modèle (`/diagnostics`)

**Streamlit** : retrain, drift, qualité données (2–8 min).

**React** :
- Bouton lancer → job async + barre progression
- Résultats onglets (qualité, drift, walk-forward)

**API** :
- `POST /api/diagnostics/model` → `job_id`
- `GET /api/jobs/{id}`

---

## 8. Profil (`/profile`)

**React** :
- Avatar (upload PNG/JPEG/WebP)
- Nom affiché (`display_name`)
- Lien Telegram : ID numérique + @username

**API** :
- `PATCH /api/auth/profile`
- `POST /api/auth/avatar`
- `GET /api/auth/avatar/{username}`

Bloc utilisateur en bas de la **Sidebar** (avatar + lien profil).

---

## 9. Paramètres (`/settings`)

**Streamlit** : env, auth, triggers scrape/retrain, mobile compact.

**React** :
- Compte / reset mot de passe
- État système (daemon, cron, Telegram)
- Actions admin (rebuild snapshot, scrape) avec confirmation

**API** :
- `GET /api/system/status`
- `POST /api/jobs/rebuild-snapshot`

---

## Fonctionnalités hors onglets à porter

| Feature | Où en React |
|---------|-------------|
| Login `web_auth.py` | `/login` |
| Profil (avatar, nom, Telegram) | `/profile` |
| Bandeau PREPROD/PROD | `Header` |
| Lien Paris → Live Tracker | router + query state |
| Paris interactifs Telegram | déjà bot — optionnel web |
| Live in-play (désactivé ST) | phase ultérieure `/live/inplay` |

---

## Roadmap suggérée (sans casser l’existant)

| Sprint | Livrable |
|--------|----------|
| **S1** | Shell SoDeglingo (sidebar, theme, router) + Live liste enrichie |
| **S2** | MatchCard + filtres + Paris du jour |
| **S3** | Auth + Portfolio lecture |
| **S4** | Paris (POST bets) + bankroll |
| **S5** | Top probas + graphiques |
| **S6** | Backtest + Tracking |
| **S7** | Diagnostics + Settings + déploiement |

---

## SEO (pack 1)

Fichiers statiques : `frontend/public/sitemap.xml`, `frontend/public/robots.txt` (copiés dans `dist/` au build Vite).

Config React : `frontend/src/lib/seo.ts` + hook `usePageSeo` (title, description, robots, Open Graph par route).

| Route | Sitemap | robots | Accès |
|-------|---------|--------|-------|
| `/live` | ✅ | index,follow | public |
| `/paris` | ✅ | index,follow | public |
| `/top5` | ✅ | index,follow | public |
| `/1-day-1-pick` | ✅ | index,follow | public |
| `/login` | — | noindex,nofollow | auth |
| `/top-probas` | — | noindex,nofollow | membre |
| `/portfolio` | — | noindex,nofollow | membre |
| `/profile` | — | noindex,nofollow | membre |
| `/backtest` | — | noindex,nofollow | admin |
| `/tracking` | — | noindex,nofollow | admin |
| `/frequentation` | — | noindex,nofollow | admin |
| `/settings` | — | noindex,nofollow | admin |
| `/`, `/track-record`, `/top1-historique` | — | noindex,nofollow | redirections |

Streamlit reste la référence fonctionnelle jusqu’à fin S4 minimum.
