#!/usr/bin/env bash
# Corrige les droits nginx (www-data) sur le build React.
# Appelé localement via ssh après scp, ou directement sur le serveur.
set -euo pipefail

DIST="${1:-/opt/courtalpha/frontend/dist}"

if [[ ! -d "$DIST" ]]; then
  echo "skip: $DIST absent"
  exit 0
fi

# scp Windows crée souvent dist/ en 700 — nginx ne peut pas lire.
find "$DIST" -type d -exec chmod 755 {} +
find "$DIST" -type f -exec chmod 644 {} +

echo "ok: permissions nginx sur $DIST"
