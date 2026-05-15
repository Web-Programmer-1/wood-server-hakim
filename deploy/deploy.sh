#!/usr/bin/env bash
# Deploy the API on the VPS. Idempotent — safe to run on every push.
#
# Usage (from the project root on the VPS):
#   ./deploy/deploy.sh           # PM2 mode (default)
#   ./deploy/deploy.sh systemd   # systemd mode
#   ./deploy/deploy.sh docker    # docker compose mode
#
# Assumes the repo is already cloned and you are inside it.
set -euo pipefail

MODE="${1:-pm2}"

cd "$(dirname "$0")/.."

echo "[deploy] mode=$MODE  cwd=$(pwd)"

if [[ ! -f .env.production ]]; then
  echo "[deploy] FATAL: .env.production missing"
  exit 1
fi

echo "[deploy] pulling latest..."
git pull --ff-only

echo "[deploy] installing deps..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm install --frozen-lockfile
else
  npm ci
fi

echo "[deploy] running prisma generate + migrate deploy..."
npx prisma generate
npx prisma migrate deploy

echo "[deploy] building..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm build
else
  npm run build
fi

case "$MODE" in
  pm2)
    echo "[deploy] reloading pm2..."
    if pm2 describe wood-api >/dev/null 2>&1; then
      pm2 reload ecosystem.config.js --env production
    else
      pm2 start ecosystem.config.js --env production --only wood-api
    fi
    pm2 save
    pm2 status
    ;;
  systemd)
    echo "[deploy] restarting systemd unit..."
    sudo systemctl restart wood-api
    sudo systemctl status wood-api --no-pager
    ;;
  docker)
    echo "[deploy] rebuilding docker images..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    docker compose ps
    ;;
  *)
    echo "[deploy] unknown mode: $MODE (expected: pm2 | systemd | docker)"
    exit 1
    ;;
esac

echo "[deploy] done."
