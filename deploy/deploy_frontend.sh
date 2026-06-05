#!/usr/bin/env bash
# Build React + déploie dist/ sur PROD + fixe les permissions nginx.
# Usage (Git Bash / WSL, depuis la racine CourtAlpha) :
#   bash deploy/deploy_frontend.sh
#   bash deploy/deploy_frontend.sh bettinghud --skip-build
set -euo pipefail

HOST="${1:-bettinghud}"
SKIP_BUILD=false
if [[ "${2:-}" == "--skip-build" ]]; then
  SKIP_BUILD=true
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="/opt/courtalpha/frontend/dist"
FIX="$ROOT/deploy/fix_frontend_permissions.sh"

cd "$ROOT/frontend"

if [[ "$SKIP_BUILD" != true ]]; then
  echo "==> npm run build"
  npm run build
fi

if [[ ! -f dist/index.html ]]; then
  echo "erreur: frontend/dist/index.html introuvable (npm run build ?)" >&2
  exit 1
fi

echo "==> scp dist -> ${HOST}:${REMOTE}/"
ssh "$HOST" "mkdir -p ${REMOTE}"
scp -r dist/. "${HOST}:${REMOTE}/"

echo "==> permissions nginx"
ssh "$HOST" "bash -s" < "$FIX"

echo "==> Done — https://courtalpha.tech/"
