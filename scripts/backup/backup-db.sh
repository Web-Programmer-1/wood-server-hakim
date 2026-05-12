#!/usr/bin/env bash
# =============================================================================
# Wood DB → Backblaze B2 backup
#
# - Runs pg_dump inside the Docker container (no need to install pg client on host)
# - Streams through gzip and uploads to B2 via the AWS CLI (S3-compatible API)
# - Keeps the last LOCAL_RETENTION_DAYS dumps on the VPS for instant restore
# - Pings HEALTHCHECK_URL on success (optional)
#
# Usage:
#   sudo ./backup-db.sh                 # uses /etc/wood-backup.env
#   CONFIG=/path/to/env ./backup-db.sh  # custom config path
# =============================================================================

set -Eeuo pipefail

CONFIG="${CONFIG:-/etc/wood-backup.env}"
if [[ ! -f "$CONFIG" ]]; then
  echo "FATAL: config file not found at $CONFIG" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$CONFIG"

: "${PG_CONTAINER:?missing}"
: "${PG_USER:?missing}"
: "${PG_DB:?missing}"
: "${B2_ENDPOINT:?missing}"
: "${B2_REGION:?missing}"
: "${B2_ACCESS_KEY_ID:?missing}"
: "${B2_SECRET_ACCESS_KEY:?missing}"
: "${B2_BUCKET:?missing}"
: "${B2_PREFIX:=backups/wood_database}"
: "${LOCAL_BACKUP_DIR:=/var/backups/wood}"
: "${LOCAL_RETENTION_DAYS:=7}"
: "${LOG_FILE:=/var/log/wood-backup.log}"

mkdir -p "$LOCAL_BACKUP_DIR" "$(dirname "$LOG_FILE")"

TS="$(date -u +%Y-%m-%d_%H-%M-%S)"
YEAR="$(date -u +%Y)"
MONTH="$(date -u +%m)"
FILENAME="${PG_DB}_${TS}.dump.gz"
LOCAL_PATH="${LOCAL_BACKUP_DIR}/${FILENAME}"
S3_KEY="${B2_PREFIX}/${YEAR}/${MONTH}/${FILENAME}"
S3_URI="s3://${B2_BUCKET}/${S3_KEY}"

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" | tee -a "$LOG_FILE"; }

on_err() {
  log "ERROR on line $1 — backup FAILED"
  exit 1
}
trap 'on_err $LINENO' ERR

log "=== Backup start: ${PG_DB} → ${S3_URI} ==="

# 1. Sanity check: container is up and healthy
if ! docker inspect -f '{{.State.Running}}' "$PG_CONTAINER" 2>/dev/null | grep -q true; then
  log "FATAL: container '$PG_CONTAINER' is not running"
  exit 1
fi

# 2. pg_dump (custom format = -Fc) → gzip → local file
#    Custom format is already compressed, but gzip on top adds ~5-10% with negligible CPU
#    and gives us a single portable .dump.gz artifact.
log "Running pg_dump…"
docker exec -i "$PG_CONTAINER" \
  pg_dump -U "$PG_USER" -d "$PG_DB" -Fc --no-owner --no-privileges \
  | gzip -9 > "$LOCAL_PATH"

SIZE_BYTES="$(stat -c %s "$LOCAL_PATH" 2>/dev/null || stat -f %z "$LOCAL_PATH")"
SIZE_HUMAN="$(numfmt --to=iec --suffix=B "$SIZE_BYTES" 2>/dev/null || echo "${SIZE_BYTES} bytes")"
log "Dump complete: ${LOCAL_PATH} (${SIZE_HUMAN})"

if [[ "$SIZE_BYTES" -lt 50 ]]; then
  log "FATAL: dump is empty or corrupt (<50 bytes) — aborting upload"
  exit 1
fi

# 3. Upload to Backblaze B2 (S3-compatible)
log "Uploading to ${S3_URI}…"
AWS_ACCESS_KEY_ID="$B2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$B2_SECRET_ACCESS_KEY" \
AWS_DEFAULT_REGION="$B2_REGION" \
aws s3 cp "$LOCAL_PATH" "$S3_URI" \
  --endpoint-url "$B2_ENDPOINT" \
  --only-show-errors

log "Upload OK"

# 4. Local rotation — drop dumps older than LOCAL_RETENTION_DAYS
log "Pruning local dumps older than ${LOCAL_RETENTION_DAYS} days…"
find "$LOCAL_BACKUP_DIR" -maxdepth 1 -type f -name "${PG_DB}_*.dump.gz" \
  -mtime "+${LOCAL_RETENTION_DAYS}" -print -delete | sed 's/^/  pruned: /' | tee -a "$LOG_FILE"

# 5. Optional healthcheck ping (success signal)
if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
  curl -fsS --retry 3 --max-time 10 "$HEALTHCHECK_URL" >/dev/null \
    && log "Healthcheck pinged" \
    || log "WARN: healthcheck ping failed (backup itself succeeded)"
fi

log "=== Backup OK: ${FILENAME} (${SIZE_HUMAN}) ==="
