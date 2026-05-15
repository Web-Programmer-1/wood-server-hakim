#!/usr/bin/env bash
# External healthcheck — call from a cron / uptime monitor. Returns 0 if the
# API is live, non-zero otherwise, so it composes cleanly with `cron` or any
# alerting that triggers on exit code.
#
# Example cron (every minute):
#   * * * * * /home/wood-server-hakim/deploy/healthcheck.sh || \
#       /home/wood-server-hakim/deploy/restart.sh
set -euo pipefail

URL="${HEALTH_URL:-http://127.0.0.1:4000/health/live}"
TIMEOUT="${HEALTH_TIMEOUT:-5}"

if curl -fsS --max-time "$TIMEOUT" "$URL" >/dev/null; then
  exit 0
else
  echo "[healthcheck] FAILED $URL"
  exit 1
fi
