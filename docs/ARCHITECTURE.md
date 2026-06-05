# Architecture — CourtAlpha

## Principe

```
┌─────────────────────┐     HTTP      ┌─────────────────────┐
│  frontend/ (React)  │ ────────────► │  api/ (FastAPI)      │
│  :5173              │   /api/*      │  :8000               │
└─────────────────────┘               └──────────┬──────────┘
                                               │ import
                                               ▼
                                    ┌─────────────────────┐
                                    │  ../BettingHUD/      │
                                    │  scripts/ data/      │
                                    │  models/             │
                                    └─────────────────────┘
```

- **CourtAlpha** = couche présentation + API HTTP fine
- **BettingHUD** = moteur (inchangé en phase 1)
- **Streamlit** (`app/dashboard.py`) = UI legacy, **non modifiée**

## Dossiers

| Chemin | Rôle |
|--------|------|
| `api/main.py` | Point d’entrée FastAPI, CORS |
| `api/bridge.py` | `PYTHONPATH` + `chdir` vers `BETTINGHUD_ROOT` |
| `api/config.py` | Chemins, CORS |
| `api/routes/` | Routers REST |
| `api/serialize.py` | JSON-safe pour dicts match/pick |
| `frontend/` | Vite + React + TypeScript |
| `frontend/src/api/client.ts` | Client fetch typé |
| `docs/` | Documentation durable |

## Flux données (phase 1)

1. React appelle `/api/live/matches` (proxy Vite → 8000)
2. FastAPI `bootstrap_bettinghud()` → ajoute `BettingHUD` au path
3. Appel `scripts.daily_top_proba_store.load_today_matches_for_daily_top_proba()`
4. Filtre `filter_live_tracker_day_matches()` si `today_only`
5. Réponse JSON → cartes React

**Aucun rebuild ML** dans la requête HTTP — lecture du snapshot joblib existant.

## Phases prévues

| Phase | API | React | Risque existant |
|-------|-----|-------|-----------------|
| **1** (actuel) | GET lecture seule | Live, Picks, Top 5 | Aucun |
| **2** | POST bets, portfolio | Paris, bankroll | Écriture SQLite partagée |
| **3** | Auth JWT/session | Login | `web_auth.py` |
| **4** | Jobs async | Diagnostics | subprocess |
| **5** | Déploiement nginx | Prod `/` | Bascule Streamlit → `/legacy` |

## Environnements

| Env | BettingHUD | CourtAlpha |
|-----|------------|----------------|
| PREPROD local | `data/` PC | `.env` → chemin local |
| PROD (futur) | `/opt/bettinghud` | `BETTINGHUD_ROOT=/opt/bettinghud` |

En dev : **ne pas** pointer `BETTINGHUD_ROOT` vers la prod pour l’écriture (phase 2+).

## Ce qui ne bouge pas

- Cron matin, daemons, Telegram
- `app/dashboard.py`
- nginx prod (jusqu’à phase 5)
