#!/usr/bin/env bash
# =============================================================================
# One-shot installer — run this ONCE on the VPS as root.
#
#   sudo ./install.sh
#
# It will:
#   1. Install dependencies: aws-cli, curl, cron, gzip
#   2. Copy the scripts into /usr/local/bin
#   3. Copy backup.env.example to /etc/wood-backup.env (only if not present)
#      and lock it down (chmod 600)
#   4. Create /var/backups/wood and /var/log/wood-backup.log
#   5. Install a daily cron job at 02:00 UTC
#   6. Run a dry verification (pg_dump --version inside the container)
# =============================================================================

set -Eeuo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Please run as root: sudo ./install.sh" >&2
  exit 1
fi

SRC_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
echo "Source dir: $SRC_DIR"

# 1. Dependencies (Debian/Ubuntu — adjust if you run a different distro)
echo "==> Installing dependencies (apt)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends awscli curl cron gzip coreutils

# 2. Copy scripts
echo "==> Installing scripts to /usr/local/bin…"
install -m 0755 "$SRC_DIR/backup-db.sh"   /usr/local/bin/wood-backup-db
install -m 0755 "$SRC_DIR/restore-db.sh"  /usr/local/bin/wood-restore-db
install -m 0755 "$SRC_DIR/list-backups.sh" /usr/local/bin/wood-list-backups

# 3. Config file (don't overwrite an existing one)
if [[ ! -f /etc/wood-backup.env ]]; then
  echo "==> Installing /etc/wood-backup.env (edit it before the first run!)"
  install -m 0600 "$SRC_DIR/backup.env.example" /etc/wood-backup.env
else
  echo "==> /etc/wood-backup.env already exists — leaving untouched"
fi

# 4. Filesystem layout
mkdir -p /var/backups/wood
chmod 700 /var/backups/wood
touch /var/log/wood-backup.log
chmod 640 /var/log/wood-backup.log

# 5. Cron job — daily 02:00 UTC, log to file (script also logs internally)
CRON_FILE=/etc/cron.d/wood-backup
echo "==> Installing cron job at $CRON_FILE"
cat > "$CRON_FILE" <<'CRON'
# Wood DB → Backblaze B2 daily backup
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=""

0 2 * * * root /usr/local/bin/wood-backup-db >> /var/log/wood-backup.log 2>&1
CRON
chmod 0644 "$CRON_FILE"

systemctl enable --now cron 2>/dev/null || service cron start || true

# 6. Verification
echo
echo "==> Verifying Postgres container is reachable…"
PG_CONTAINER="$(grep -E '^PG_CONTAINER=' /etc/wood-backup.env | cut -d= -f2 | tr -d '\"')"
PG_USER="$(grep -E '^PG_USER=' /etc/wood-backup.env | cut -d= -f2 | tr -d '\"')"
if docker exec "$PG_CONTAINER" pg_dump --version >/dev/null 2>&1; then
  echo "    OK — pg_dump available in container '$PG_CONTAINER'"
else
  echo "    WARN — could not exec pg_dump in container '$PG_CONTAINER'"
  echo "           Check that the container name in /etc/wood-backup.env is correct."
fi

cat <<EOF

=============================================================================
 Install complete.

 NEXT STEPS
 ----------
 1. Review and edit  /etc/wood-backup.env   (especially HEALTHCHECK_URL)
 2. Run a manual test backup:

      sudo /usr/local/bin/wood-backup-db

 3. Confirm it landed in B2:

      sudo /usr/local/bin/wood-list-backups

 4. Tail the log to see scheduled runs:

      tail -f /var/log/wood-backup.log

 5. (Recommended) Configure a Lifecycle Rule in the B2 web UI to delete
    objects under "${B2_PREFIX:-backups/wood_database}/" after 30 days.
    See README.md for the exact steps.
=============================================================================
EOF
