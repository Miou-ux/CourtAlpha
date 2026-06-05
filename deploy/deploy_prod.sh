#!/usr/bin/env bash
# Déploie CourtAlpha sur PROD (/opt/courtalpha) — à lancer depuis la racine CourtAlpha.
set -euo pipefail

HOST="${1:-bettinghud}"
REMOTE="/opt/courtalpha"

echo "==> Sync vers ${HOST}:${REMOTE}"
ssh "$HOST" "sudo mkdir -p ${REMOTE} && sudo chown -R ubuntu:ubuntu ${REMOTE}"

tar czf /tmp/courtalpha-deploy.tgz \
  --exclude=node_modules \
  --exclude=__pycache__ \
  --exclude=.env \
  --exclude=frontend/node_modules \
  --exclude=.git \
  api deploy docs frontend .env.example .env.prod.example .gitignore README.md

scp /tmp/courtalpha-deploy.tgz "${HOST}:/tmp/courtalpha-deploy.tgz"
ssh "$HOST" "cd ${REMOTE} && tar xzf /tmp/courtalpha-deploy.tgz && rm /tmp/courtalpha-deploy.tgz"

echo "==> .env prod"
ssh "$HOST" "test -f ${REMOTE}/.env || cp ${REMOTE}/.env.prod.example ${REMOTE}/.env"

echo "==> systemd courtalpha-api"
ssh "$HOST" "sudo cp ${REMOTE}/deploy/systemd/courtalpha-api.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable courtalpha-api && sudo systemctl restart courtalpha-api"

if ssh "$HOST" "test -d ${REMOTE}/frontend/dist"; then
  echo "==> permissions frontend/dist (nginx)"
  ssh "$HOST" "find ${REMOTE}/frontend/dist -type d -exec chmod 755 {} +; find ${REMOTE}/frontend/dist -type f -exec chmod 644 {} +"
fi

echo "==> Done. Vérif: curl -s http://127.0.0.1:8000/api/health"
