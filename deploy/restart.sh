#!/usr/bin/env bash
# Restart whichever supervisor is in use. Detection order:
#   docker compose (deploy stack) → pm2 → systemd
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f docker-compose.deploy.yml ] && command -v docker >/dev/null 2>&1; then
  if docker compose -f docker-compose.deploy.yml ps api 2>/dev/null | grep -q wood-api; then
    echo "[restart] docker compose restart api worker"
    docker compose -f docker-compose.deploy.yml restart api worker
    exit 0
  fi
fi

if command -v pm2 >/dev/null 2>&1 && pm2 describe wood-api >/dev/null 2>&1; then
  echo "[restart] pm2 reload wood-api"
  pm2 reload wood-api
  exit 0
fi

if systemctl is-active --quiet wood-api 2>/dev/null; then
  echo "[restart] systemctl restart wood-api"
  sudo systemctl restart wood-api
  exit 0
fi

echo "[restart] FATAL: no known supervisor for wood-api"
exit 1
