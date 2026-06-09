# API REST — CourtAlpha

Base URL locale : `http://127.0.0.1:8000`  
Docs interactives : `http://127.0.0.1:8000/docs`

## Lecture

### `GET /api/health`
Santé + chemin `BETTINGHUD_ROOT`.

### `GET /api/live/meta`
Meta snapshot du jour.

### `GET /api/live/matches`
Matchs du jour (`today_only=true` par défaut).

**Filtres qualité** (même logique que Streamlit PROD, `scripts/match_rank_quality.py`) :
- cotes > 1.0 ;
- rang/points sur les deux joueurs (hors `tennisexplorer_estimate` seul) ;
- `stats_reference_date` TML/WTA ≤ 12 mois (365 j, `BETTINGHUD_STALE_RANK_STATS_MAX_DAYS`).

### `GET /api/live/value-bets`
Tuiles Live Tracker enrichies (proba, EV, Kelly, Brier).

Query : `ev_min_pct` (déf. 15), `mode=value|all` (`value` = EV+ uniquement, `all` = un côté par match scanné).

Retour : `picks[]` (champ `existing_stake_eur` si pari déjà posé sur le compte), `bankroll.available_eur`, `n_scanned`.

### `GET /api/picks/jour`
Picks `/jour` / `/picks` (proba > 60 %, EV > 15 %). **Premium.** Chaque pick inclut `existing_stake_eur` (cumul mises sur ce match/joueur).

### `GET /api/picks/top5`
Top 5 proba, bande EV 15–100 %. **Premium.** Chaque pick inclut `existing_stake_eur`.

### `GET /api/picks/one-day-one-pick`
Replay public **1 Day 1 Pick** : un pick par jour calendaire (meilleur rank=1 entre ATP et WTA, proba favori modèle max), tournois main draw 250+, bande EV favori 15–100 %.

Query : `bankroll_start` (déf. 100), `ev_min_pct` (déf. 15), `ev_max_pct` (déf. 100), `exclude_today` (déf. **false** — jour courant inclus).

Retour : `selection`, `today_date`, `pick_today` (source `db` ou `live`), `period`, `summary`, `picks[]`, `curve[]`.

**Sans Bearer** — page publique `/1-day-1-pick`.

### `GET /api/picks/top-probas`
Top 15 probas favori modèle (graphique + tableau).

Query : `limit` (déf. 15), `include_challengers` (déf. false), `ev_band` (déf. true → EV +15 % à +100 %).

### `GET /api/portfolio/summary`
Bankroll Kelly + analytics portefeuille (P/L, ROI, winrate, courbes, CLV).  
**Bearer requis** si `BETTINGHUD_WEB_AUTH_REQUIRED=1` (PROD). Scope `telegram_user_id` du compte connecté.

### `GET /api/portfolio/bets`
Paris SQLite avec filtres. **Bearer requis** en PROD.

Query : `limit` (déf. 500), `status`, `min_stake`, `sort` (`recent|oldest|profit_desc|profit_asc`).

### `POST /api/portfolio/bankroll/adjust`
Ajustement manuel cumulé de la bankroll Telegram (dépôt / retrait). **Bearer requis.**

```json
{ "amount_eur": 25.0 }
```

Montant positif = ajout, négatif = retrait. Retour : bankroll recalculée + `manual_adjust_eur`.

### `PATCH /api/portfolio/bets/{bet_id}`
Règlement manuel d'un pari en cours (`Gagné` / `Perdu`).

### `POST /api/portfolio/actions/clv-sync`
Met à jour `closing_odd` / `clv_score` depuis le snapshot prematch.

### `POST /api/portfolio/actions/update-results`
Lance le scraper résultats sur les paris en attente.

### `POST /api/portfolio/actions/reconcile`
Réconciliation 3 sources (TE + Sackmann + tennis-data, 7 j).

### `GET /api/portfolio/reconcile-status`
Dernière réconciliation + indicateur « due ».

## Écriture (PREPROD)

### `POST /api/bets`
Enregistre un pari via `save_bet_enriched`.

```json
{
  "match_name": "Moeller M. vs Mikrut L.",
  "bet_on": "Moeller M.",
  "odds": 2.66,
  "stake": 10,
  "tournament": "Heilbronn challenger",
  "tour": "ATP",
  "p_model": 0.845,
  "ev_at_bet": 1.248,
  "tracker_source": "live_tracker_web"
}
```

`ev_at_bet` = fraction (ex. 1.248 pour +124,8 %), aligné Streamlit.

## Billing premium (ETH HD)

Endpoints sous `/api/billing/*` — activation si `COURTALPHA_BILLING_ENABLED=1` et mnemonic/RPC configurés.

### `GET /api/billing/plans`
Liste des offres premium (ex. Premium 30 jours).

### `GET /api/billing/config`
Chaîne, adresse de dépôt HD, contrat fallback (lecture seule).

### `POST /api/billing/orders`
Crée une commande de paiement (Bearer requis). Retour : `order_id`, `deposit_address`, `price_wei`, `expires_at`.

### `GET /api/billing/orders/{order_id}`
Statut commande (`pending` / `paid` / `expired`).

Indexer : `scripts/billing_indexer.py` + cron `deploy/cron/billing-indexer`. Doc : `BettingHUD/docs/BILLING_ETH.md`.

## Analytics

### `POST /api/analytics/pageview`
Enregistre une vue de page SPA (sans auth obligatoire ; username si Bearer présent).

```json
{
  "path": "/live",
  "referrer": "https://www.google.com/",
  "utm_source": "twitter",
  "utm_medium": "social",
  "utm_campaign": "roland_garros"
}
```

Déduplication 30 s. Pays = code ISO (headers CDN ou GeoIP à l’enregistrement). Source dérivée du referrer + UTM.

### `GET /api/analytics/traffic`
Rapport fréquentation — **admin uniquement**.

Query : `days` (déf. 30, max 90).

Retour : `summary`, `daily[]`, `top_pages[]`, `top_sources[]`, `top_countries[]`, `top_referrers[]`, `hourly_today[]`.

---

## Analyse & ops (admin)

Bearer requis + rôle **`owner`** ou **`admin`** (ou username `miouppy`). Sinon **403**.

### `GET /api/backtest/years`
Années avec CSV backtest valide dans `BettingHUD/data/`.

### `POST /api/backtest/simulate`
Simulation Kelly intra-jour (`simulate_sequential_intraday`).

```json
{
  "year": 2026,
  "bankroll_start": 1000,
  "kelly_multiplier": 0.5,
  "max_stake_pct": 5
}
```

Retour : `summary`, `history` (courbe bankroll), `daily_pnls`.

### `GET /api/tracking`
Drift modèle sur paris réels clos (`model_tracking.compute_tracking`).

### `GET /api/system/status`
Diagnostic ops (admin) : snapshot, CSV prematch, daemon portfolio, fraîcheur données, **pipelines** (ML, Sackmann, TML, snapshot, scraper TE) avec dernière MAJ, prochaine MAJ prévue et état `running`.

### `POST /api/system/jobs/{job_id}/run`
Lance un job en arrière-plan (admin). `job_id` : `ml_train`, `sync_sackmann`, `sync_tml`, `rebuild_snapshot`, `scrape_te`. Retour **409** si déjà en cours.

### `GET /api/system/jobs/{job_id}`
État d'un job (`idle`, `running`, `done`, `failed`, `log_path`).

## Auth (PREPROD)

### `POST /api/auth/login`
```json
{ "username": "...", "password": "..." }
```
Retour : `{ "token", "user" }` — stocker côté client (Bearer).

### `GET /api/auth/me`
Session courante. **200** avec `user: null` si anonyme (pages publiques). En PROD, portfolio et endpoints sensibles exigent Bearer.

### Pages publiques (PROD, `BETTINGHUD_WEB_AUTH_REQUIRED=1`)

Sans token : `/live`, `/paris`, `/top5`, `/1-day-1-pick` + `GET /api/live/*`, `GET /api/picks/jour`, `GET /api/picks/top5`, `GET /api/picks/one-day-one-pick`.  
Pas de bankroll affichée (`bankroll: null` sur value-bets). Paris interactifs → login.

### `POST /api/auth/logout`
Révoque le token Bearer.

### `PATCH /api/auth/profile`
Bearer requis. Corps optionnel :
```json
{
  "display_name": "Mon nom",
  "telegram_user_id": "7113749284",
  "telegram_username": "mon_handle",
  "clear_telegram": false
}
```
Retour : `{ "ok": true, "user": { …, "avatar_url?", "telegram_username?" } }`.

### `POST /api/auth/avatar`
Bearer requis. `multipart/form-data`, champ `file` (PNG/JPEG/WebP, max 2,5 Mo).
Stockage : `BettingHUD/data/web_avatars/{username}.{ext}`.

### `GET /api/auth/avatar/{username}`
Image publique (pas de Bearer). 404 si aucun avatar.

## CORS

`CORS_ORIGINS` — défaut `http://localhost:5173`. Méthodes : GET, POST, PATCH.

## Checklist doc

1. Route dans `api/routes/`
2. Mise à jour **ce fichier**
3. Type dans `frontend/src/api/client.ts`
4. `docs/CHANGELOG.md`
