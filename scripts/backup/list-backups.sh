#!/usr/bin/env bash
# List all DB backups in B2 with size + date, newest first.
set -Eeuo pipefail

CONFIG="${CONFIG:-/etc/wood-backup.env}"
[[ -f "$CONFIG" ]] || { echo "FATAL: config not found at $CONFIG" >&2; exit 1; }
# shellcheck disable=SC1090
source "$CONFIG"

AWS_ACCESS_KEY_ID="$B2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$B2_SECRET_ACCESS_KEY" \
AWS_DEFAULT_REGION="$B2_REGION" \
aws s3 ls "s3://${B2_BUCKET}/${B2_PREFIX}/" --recursive --human-readable --summarize \
  --endpoint-url "$B2_ENDPOINT" \
  | grep -E '\.dump\.gz$|^Total' \
  | sort -r
