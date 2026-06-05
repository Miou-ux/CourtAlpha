# Démarrage — CourtAlpha (PREPROD)

## Prérequis

| Outil | Version | Notes |
|-------|---------|-------|
| Python | 3.11 | Réutiliser `BettingHUD/venv` |
| Node.js | 20+ | Pour `frontend/` |
| BettingHUD | dossier frère | `../BettingHUD` avec `data/`, `models/`, `scripts/` |

## Arborescence attendue

```
Documents/
├── BettingHUD/           ← moteur existant (non modifié)
└── CourtAlpha/           ← ce projet
```

## Configuration

```powershell
cd O:\Miouppy\Documents\CourtAlpha
copy .env.example .env
```

Variables principales (`.env`) :

| Variable | Défaut | Rôle |
|----------|--------|------|
| `BETTINGHUD_ROOT` | `../BettingHUD` | Chemin vers le moteur |
| `BETTINGHUD_ENV` | `preprod` | Jamais `prod` en dev local Web |
| `BETTINGHUD_HEADLESS` | `1` | Pas de Streamlit |
| `API_PORT` | `8000` | Port FastAPI |
| `CORS_ORIGINS` | `http://localhost:5173` | Origine React dev |

## Lancement — **2 terminaux obligatoires**

`http://localhost:5173` ne répond **que si** `npm run dev` tourne dans `frontend/`.  
L’API seule (`:8000`) ne suffit pas pour afficher l’UI React.

Raccourci Windows (les deux en une commande) :

```powershell
cd O:\Miouppy\Documents\CourtAlpha
powershell -File scripts/start-dev.ps1
```

### 1. API FastAPI — port 8000

```powershell
cd O:\Miouppy\Documents\CourtAlpha
O:\Miouppy\Documents\BettingHUD\venv\Scripts\python.exe -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

Vérification : http://127.0.0.1:8000/api/health

### 2. Frontend React — port 5173

```powershell
cd O:\Miouppy\Documents\CourtAlpha\frontend
npm install   # première fois
npm run dev
```

Ouvrir : http://localhost:5173

Le proxy Vite redirige `/api/*` vers `http://127.0.0.1:8000`.

### 3. Streamlit (optionnel, comparaison)

```powershell
cd O:\Miouppy\Documents\BettingHUD
py -3 -m streamlit run app/dashboard.py
```

Les deux UIs peuvent tourner **en parallèle** sans conflit (ports différents).

## Données PREPROD vides ou anciennes

Si l’UI Web affiche **0 match** :

1. Vérifier l’âge du snapshot : `GET /api/live/meta` → `snapshot_age_min`
2. Rebuild dans BettingHUD :

```powershell
cd O:\Miouppy\Documents\BettingHUD
py -3 scripts/rebuild_live_projection.py
```

3. Recharger la page React

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| **`localhost:5173` inaccessible** | React non démarré | `cd frontend && npm run dev` (laisser le terminal ouvert) |
| Page blanche + erreur fetch | API non démarrée | Lancer uvicorn sur `:8000` |
| **UI OK mais 0 match / 0 pick** | Snapshot PREPROD **périmé** (dates ≠ aujourd’hui) | `cd BettingHUD` puis `py -3 scripts/rebuild_live_projection.py` (~4 min), recharger la page |
| `BETTINGHUD_ROOT introuvable` | Mauvais chemin `.env` | Corriger `BETTINGHUD_ROOT` |
| CORS / fetch failed | API non lancée | Démarrer uvicorn |
| 0 matchs, snapshot vieux | Pas de rebuild récent | `rebuild_live_projection.py` |
| ImportError scripts | Mauvais venv | Utiliser `BettingHUD/venv` |

## Importer les données PROD en PREPROD

Pour tester React avec les **vrais paris et le snapshot du jour** (sans toucher PROD) :

```powershell
cd O:\Miouppy\Documents\BettingHUD
powershell -File scripts\restore_prod_to_preprod.ps1
```

Le script :

1. Sauvegarde la DB locale dans `backups/preprod/`
2. Restaure le dernier export `backups/prod/bettinghud_prod_*.db` → `data/bettinghud.db`
3. Télécharge via SSH le snapshot live PROD + dernier CSV prematch
4. Copie `web_users.json` PROD (login React) si présent

Variante DB live serveur : `-FetchRemoteDb` (au lieu du backup local).

Puis **rafraîchir** http://localhost:5173 (API déjà lancée : requête suivante lit les nouveaux fichiers).

## Sauvegardes avant gros changements

Les sauvegardes PROD restent gérées depuis **BettingHUD** :

- `scripts/backup_prod_db_to_local.ps1`
- `scripts/restore_prod_to_preprod.ps1` (PROD → PREPROD)
- `backups/prod/` (DB + archive full)

Le projet Web **ne remplace pas** ces procédures.
