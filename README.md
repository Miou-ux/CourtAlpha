# CourtAlpha — UI React + API FastAPI pour BettingHUD

Interface produit **CourtAlpha** (live, portfolio, top probas, backtest) branchée sur le moteur **BettingHUD** (`BETTINGHUD_ROOT`).

## PROD (serveur dédié)

| URL | App |
|-----|-----|
| `http://IP/` | CourtAlpha (React + `/api`) |
| `http://IP:8502/` | BettingHUD Streamlit (legacy) |

Voir `docs/DEPLOY.md` et `deploy/deploy_prod.sh`.

## PREPROD (local)

```powershell
cd frontend && npm install && npm run dev
# autre terminal, racine CourtAlpha :
py -3 -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Copier `.env.example` → `.env` et ajuster `BETTINGHUD_ROOT`.
