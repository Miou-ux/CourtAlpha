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

Retour : `picks[]`, `bankroll.available_eur`, `n_scanned`.

### `GET /api/picks/jour`
Picks `/jour` / `/picks` (proba > 60 %, EV > 15 %).

### `GET /api/picks/top5`
Top 5 proba, bande EV 15–100 %.

### `GET /api/picks/top-probas`
Top 15 probas favori modèle (graphique + tableau).

Query : `limit` (déf. 15), `include_challengers` (déf. false), `ev_band` (déf. true → EV +15 % à +100 %).

### `GET /api/portfolio/summary`
Bankroll Kelly + analytics portefeuille (P/L, ROI, winrate, courbes, CLV).  
Bearer optionnel : si `telegram_user_id` en profil, scope utilisateur ; sinon portefeuille global.

### `GET /api/portfolio/bets`
Paris SQLite avec filtres.

Query : `limit` (déf. 500), `status`, `min_stake`, `sort` (`recent|oldest|profit_desc|profit_asc`).

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
Diagnostic ops : snapshot, CSV prematch, daemon portfolio, fraîcheur données.

## Auth (PREPROD)

### `POST /api/auth/login`
```json
{ "username": "...", "password": "..." }
```
Retour : `{ "token", "user" }` — stocker côté client (Bearer).

### `GET /api/auth/me`
Session courante. Si `BETTINGHUD_WEB_AUTH_REQUIRED=1`, 401 sans token.

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
