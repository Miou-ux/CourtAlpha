# Déploiement PROD — CourtAlpha

CourtAlpha vit **à côté** de BettingHUD :

```text
/opt/bettinghud/     moteur (data, models, venv, cron, Telegram…)
/opt/courtalpha/     UI React + API FastAPI
```

## URLs

| Port | Service |
|------|---------|
| **https://courtalpha.tech/** | CourtAlpha (React + `/api`) |
| **https://courtalpha.tech:8502/** | BettingHUD Streamlit (legacy) |

## Première installation

```bash
# 1. Sync code (depuis PC, Git Bash ou WSL)
bash deploy/deploy_prod.sh bettinghud

# 2. Build frontend (sur PC PREPROD avec Node)
cd frontend && npm ci && npm run build
scp -r frontend/dist bettinghud:/opt/courtalpha/frontend/

# 3. Nginx unifié (depuis repo BettingHUD)
ssh bettinghud
sudo cp /opt/bettinghud/deploy/nginx/bettinghud.conf /etc/nginx/sites-available/bettinghud
sudo nginx -t && sudo systemctl reload nginx
sudo ufw allow 8502/tcp

# 4. Vérifications
curl -s http://127.0.0.1:8000/api/health
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8502/
```

## Mise à jour (PROD — git pull)

Le serveur clone le repo dans `/opt/courtalpha` :

```bash
ssh bettinghud
cd /opt/courtalpha
git pull --ff-only
sudo systemctl restart courtalpha-api
```

Si l’UI React a changé, rebuild **sur PC PREPROD** puis copie du `dist/` (non versionné) :

```powershell
cd O:\Miouppy\Documents\CourtAlpha\frontend
npm run build
scp -r dist bettinghud:/opt/courtalpha/frontend/
```

> `.env` et `frontend/dist/` ne sont **pas** dans git — ils restent sur le SD entre les pulls.

## Mise à jour (fallback tarball)

```bash
bash deploy/deploy_prod.sh bettinghud
sudo systemctl restart courtalpha-api
```

## `.env` PROD

`/opt/courtalpha/.env` (modèle : `.env.prod.example`) :

- `BETTINGHUD_ROOT=/opt/bettinghud`
- `BETTINGHUD_ENV=prod`
- `BETTINGHUD_WEB_AUTH_REQUIRED=1`

Comptes web : `/opt/bettinghud/data/web_users.json` (partagés avec Streamlit).

## GitHub

Repo : `https://github.com/Miou-ux/CourtAlpha`
