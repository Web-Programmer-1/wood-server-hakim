#!/usr/bin/env bash
# =============================================================================
# Wood DB ← Backblaze B2 restore
#
# Downloads a backup from B2 (or uses a local one) and restores it into the
# Postgres container. By default restores into a NEW database so you can
# inspect the data before swapping it in.
#
# Usage:
#   ./restore-db.sh                          # interactive: list & pick latest
#   ./restore-db.sh <s3-key>                 # restore a specific B2 object
#   ./restore-db.sh --local <path>           # restore a local .dump.gz file
#   ./restore-db.sh --target <dbname>        # restore into a specific DB name
#                                              (default: <PG_DB>_restore_<ts>)
#   ./restore-db.sh --in-place               # DANGER: drop & replace PG_DB
# =============================================================================

set -Eeuo pipefail

CONFIG="${CONFIG:-/etc/wood-backup.env}"
[[ -f "$CONFIG" ]] || { echo "FATAL: config not found at $CONFIG" >&2; exit 1; }
# shellcheck disable=SC1090
source "$CONFIG"

S3_KEY=""
LOCAL_FILE=""
TARGET_DB=""
IN_PLACE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --local)    LOCAL_FILE="$2"; shift 2 ;;
    --target)   TARGET_DB="$2"; shift 2 ;;
    --in-place) IN_PLACE=1; shift ;;
    -h|--help)
      sed -n '2,/^# ===/p' "$0" | sed 's/^# \{0,1\}//' ; exit 0 ;;
    *)          S3_KEY="$1"; shift ;;
  esac
done

aws_b2() {
  AWS_ACCESS_KEY_ID="$B2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$B2_SECRET_ACCESS_KEY" \
  AWS_DEFAULT_REGION="$B2_REGION" \
  aws --endpoint-url "$B2_ENDPOINT" "$@"
}

# 1. Resolve the source dump file
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

if [[ -n "$LOCAL_FILE" ]]; then
  [[ -f "$LOCAL_FILE" ]] || { echo "FATAL: $LOCAL_FILE not found"; exit 1; }
  DUMP_FILE="$LOCAL_FILE"
  echo "Using local dump: $DUMP_FILE"
else
  if [[ -z "$S3_KEY" ]]; then
    echo "No key given — fetching latest from s3://${B2_BUCKET}/${B2_PREFIX}/ …"
    S3_KEY="$(aws_b2 s3 ls "s3://${B2_BUCKET}/${B2_PREFIX}/" --recursive \
      | awk '{print $4}' | grep '\.dump\.gz$' | sort | tail -1)"
    [[ -n "$S3_KEY" ]] || { echo "FATAL: no backups found in bucket"; exit 1; }
    echo "Latest backup: $S3_KEY"
  fi
  DUMP_FILE="${WORKDIR}/$(basename "$S3_KEY")"
  echo "Downloading s3://${B2_BUCKET}/${S3_KEY} …"
  aws_b2 s3 cp "s3://${B2_BUCKET}/${S3_KEY}" "$DUMP_FILE"
fi

# 2. Decide target DB name
if [[ "$IN_PLACE" -eq 1 ]]; then
  TARGET_DB="$PG_DB"
  read -rp "About to DROP and REPLACE database '$TARGET_DB'. Type 'yes' to continue: " ans
  [[ "$ans" == "yes" ]] || { echo "Aborted."; exit 1; }
elif [[ -z "$TARGET_DB" ]]; then
  TARGET_DB="${PG_DB}_restore_$(date -u +%Y%m%d_%H%M%S)"
fi
echo "Target database: $TARGET_DB"

# 3. Decompress to a file the container can read
DUMP_PLAIN="${WORKDIR}/dump.bin"
gunzip -c "$DUMP_FILE" > "$DUMP_PLAIN"

# 4. Drop/create the target DB and restore
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "DROP DATABASE IF EXISTS \"$TARGET_DB\" WITH (FORCE);"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "CREATE DATABASE \"$TARGET_DB\";"

echo "Restoring into '$TARGET_DB' …"
docker exec -i "$PG_CONTAINER" \
  pg_restore -U "$PG_USER" -d "$TARGET_DB" --no-owner --no-privileges --clean --if-exists \
  < "$DUMP_PLAIN"

echo
echo "Restore complete."
echo "  Database : $TARGET_DB"
echo "  Source   : ${LOCAL_FILE:-s3://${B2_BUCKET}/${S3_KEY}}"
if [[ "$IN_PLACE" -eq 0 ]]; then
  echo
  echo "Inspect with:"
  echo "  docker exec -it $PG_CONTAINER psql -U $PG_USER -d $TARGET_DB"
  echo
  echo "When ready to swap in, stop the app and run:"
  echo "  docker exec $PG_CONTAINER psql -U $PG_USER -d postgres -c \\"
  echo "    \"ALTER DATABASE \\\"$PG_DB\\\" RENAME TO \\\"${PG_DB}_old_$(date -u +%Y%m%d)\\\"; \\"
  echo "     ALTER DATABASE \\\"$TARGET_DB\\\" RENAME TO \\\"$PG_DB\\\";\""
fi
