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
| **https://admin.courtalpha.tech/** | BettingHUD Streamlit (legacy) |

## Première installation

```bash
# 1. Sync code (depuis PC, Git Bash ou WSL)
bash deploy/deploy_prod.sh bettinghud

# 2. Build frontend (sur PC PREPROD avec Node)
# PowerShell :
#   cd O:\Miouppy\Documents\CourtAlpha
#   .\deploy\deploy_frontend.ps1
# Git Bash :
#   bash deploy/deploy_frontend.sh bettinghud

# 3. Nginx PROD (BettingHUD repo) — voir deploy/nginx/setup_admin_subdomain.sh
#    DNS requis : admin.courtalpha.tech → IP serveur

# 4. Vérifications
curl -s https://courtalpha.tech/api/health
curl -s -o /dev/null -w '%{http_code}\n' https://courtalpha.tech/
curl -s -o /dev/null -w '%{http_code}\n' https://admin.courtalpha.tech/
```

## Mise à jour (PROD — git pull)

Le serveur clone le repo dans `/opt/courtalpha` :

```bash
ssh bettinghud
cd /opt/courtalpha
git pull --ff-only
sudo systemctl restart courtalpha-api
```

Si l’UI React a changé, rebuild **sur PC PREPROD** puis déploiement automatisé (build + scp + **permissions nginx**) :

```powershell
cd O:\Miouppy\Documents\CourtAlpha
.\deploy\deploy_frontend.ps1
# dist déjà buildé :
.\deploy\deploy_frontend.ps1 -SkipBuild
```

```bash
bash deploy/deploy_frontend.sh bettinghud
bash deploy/deploy_frontend.sh bettinghud --skip-build
```

> **Ne pas** utiliser `scp -r dist ...` seul : sous Windows, `scp` crée `dist/` en `700` et nginx renvoie **403**. Le script appelle `deploy/fix_frontend_permissions.sh` sur le serveur après chaque upload.

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
