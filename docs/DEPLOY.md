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

## Mise à jour (PROD — sans commit git)

Méthode utilisée quand le code local n’est pas encore poussé sur GitHub :

```powershell
# CourtAlpha — API + docs
cd O:\Miouppy\Documents\CourtAlpha
tar czf $env:TEMP/courtalpha-deploy.tgz --exclude=node_modules --exclude=.env --exclude=.git api deploy docs frontend .env.example .env.prod.example README.md
scp $env:TEMP/courtalpha-deploy.tgz bettinghud:/tmp/
ssh bettinghud "cd /opt/courtalpha && tar xzf /tmp/courtalpha-deploy.tgz && sudo systemctl restart courtalpha-api"

# Frontend (build + dist)
.\deploy\deploy_frontend.ps1

# BettingHUD — scripts + docs + crons
cd O:\Miouppy\Documents\BettingHUD
tar czf $env:TEMP/bettinghud-deploy.tgz --exclude=venv --exclude=data --exclude=models --exclude=.git scripts deploy docs app requirements.txt
scp $env:TEMP/bettinghud-deploy.tgz bettinghud:/tmp/
ssh bettinghud "cd /opt/bettinghud && tar xzf /tmp/bettinghud-deploy.tgz && sudo cp deploy/cron/morning-pipeline /etc/cron.d/bettinghud-morning && sudo systemctl restart bettinghud-telegram-bot"
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

## SEO (sitemap / robots)

`sitemap.xml` et `robots.txt` sont dans `frontend/public/` et déployés avec `dist/` (Vite les copie à la racine). Après un build + `deploy_frontend`, vérifier :

```bash
curl -sI https://courtalpha.tech/sitemap.xml | head -1
curl -sI https://courtalpha.tech/robots.txt | head -1
```

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
