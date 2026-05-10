# Wood DB → Backblaze B2 backups

Automated, daily backups of the Postgres database running on the VPS,
streamed to a Backblaze B2 bucket using the S3-compatible API.

## What you get

- **Daily** `pg_dump` (custom format, gzip-compressed) at **02:00 UTC**
- Uploaded to **`s3://<bucket>/backups/wood_database/YYYY/MM/...`**
- **Local cache** of the last **7 days** on the VPS for instant restore
- A **restore script** that can either:
  - restore into a *new* DB so you can verify the data, or
  - swap it in place (with confirmation prompt)
- A **listing script** to see what's in B2
- Optional **healthcheck ping** so you're alerted when a backup is missed

---

## Files

| File | Purpose |
| --- | --- |
| `backup-db.sh` | Run by cron daily — dumps Postgres, gzips, uploads to B2 |
| `restore-db.sh` | Restore from B2 (or a local cache file) into Postgres |
| `list-backups.sh` | List backups currently in the B2 bucket |
| `install.sh` | One-shot installer (run as root on the VPS) |
| `backup.env.example` | Configuration template — copied to `/etc/wood-backup.env` |

---

## One-time setup on the VPS

### 1. Push the scripts to the VPS

From your laptop:

```bash
# adjust user@host
scp -r wood-server-hakim/scripts/backup user@your-vps:/tmp/wood-backup
```

### 2. Run the installer

SSH into the VPS and run:

```bash
ssh user@your-vps
sudo /tmp/wood-backup/install.sh
```

This installs `awscli`, copies the scripts to `/usr/local/bin/`, sets up the
cron job, creates `/var/backups/wood`, and seeds `/etc/wood-backup.env`.

### 3. Fill in real credentials

Edit the config file directly on the VPS:

```bash
sudo nano /etc/wood-backup.env
```

Set these from your existing `.env.production`:

```ini
B2_ENDPOINT="https://s3.eu-central-003.backblazeb2.com"
B2_REGION="eu-central-003"
B2_ACCESS_KEY_ID="003892e86b6afce0000000001"
B2_SECRET_ACCESS_KEY="K003VD0D8USv4A4dg8I7RKuGtSxg88A"
B2_BUCKET="WoodTechSolutionBD"
```

> **Security:** the file is already `chmod 600` and owned by root — only root
> can read it. Do **not** commit it to git.

### 4. (Recommended) Use a dedicated B2 application key

Don't reuse the application's B2 key for backups — create a separate one
that's restricted to a `backups/` prefix and has the minimum permissions:

1. Backblaze web UI → **App Keys** → **Add a New Application Key**
2. Name: `wood-db-backup`
3. Allow access to bucket: `WoodTechSolutionBD`
4. Type of access: **Read and Write**
5. File name prefix: `backups/`
6. Save the `keyID` and `applicationKey` into `/etc/wood-backup.env`.

That way, if the VPS is ever compromised, the attacker can only touch
`backups/*` — not the application's media files.

### 5. Configure server-side retention (Lifecycle Rules)

The backup script keeps **7 days locally**. For B2 itself, configure a
Lifecycle Rule so old backups are deleted automatically:

1. B2 web UI → **Buckets** → `WoodTechSolutionBD` → **Lifecycle Settings**
2. **Custom** → set:
   - File Name Prefix: `backups/wood_database/`
   - **Hide files** after: `30` days
   - **Delete files** after: `35` days
3. Save.

That gives you 30 days of recovery in B2 + 7 days local. Adjust to taste.

### 6. Run the first backup manually to verify

```bash
sudo wood-backup-db
```

You should see lines like:

```
[2026-05-10T02:00:00Z] === Backup start: wood_database → s3://WoodTechSolutionBD/... ===
[2026-05-10T02:00:01Z] Dump complete: /var/backups/wood/wood_database_2026-05-10_02-00-00.dump.gz (4.2MB)
[2026-05-10T02:00:03Z] Upload OK
[2026-05-10T02:00:03Z] === Backup OK ===
```

Confirm in B2:

```bash
sudo wood-list-backups
```

Tail the log to watch the next scheduled run:

```bash
tail -f /var/log/wood-backup.log
```

---

## Restore

### List available backups

```bash
sudo wood-list-backups
```

### Restore the latest backup into a new DB (safe — recommended)

```bash
sudo wood-restore-db
```

This downloads the newest dump and restores it into a database called
`wood_database_restore_<timestamp>` so the live DB is untouched. Inspect it:

```bash
docker exec -it wood-postgres psql -U wood_dev -d wood_database_restore_20260510_030000
```

When you're happy, swap it in (the script prints the exact `ALTER DATABASE`
commands for you).

### Restore a specific backup

```bash
sudo wood-restore-db backups/wood_database/2026/05/wood_database_2026-05-10_02-00-00.dump.gz
```

### Restore in place (DANGER — drops the current DB)

```bash
sudo wood-restore-db --in-place
```

Stop your app first, then run this. You'll be asked to type `yes` to confirm.

### Restore from a local cached file (fastest — no download)

```bash
sudo wood-restore-db --local /var/backups/wood/wood_database_2026-05-10_02-00-00.dump.gz
```

---

## Operational tips

- **Test restores quarterly.** A backup you've never restored is a backup you
  don't have. The non-`--in-place` restore is safe to run any time.
- **Healthcheck.** Sign up at https://healthchecks.io (free), create a check
  with the cron schedule `0 2 * * *`, and put its URL in `HEALTHCHECK_URL`.
  You'll get an email/Slack alert if a backup is ever skipped.
- **Logs.** All output goes to `/var/log/wood-backup.log`. Add it to your
  `logrotate` config if you don't want it growing forever.
- **Disk pressure.** With `LOCAL_RETENTION_DAYS=7` and a small DB, the local
  cache is tiny. If your DB grows large, lower the retention or set it to `0`
  to keep zero local copies (B2 is still the system of record).
- **Don't change the dump format** without also updating the restore script —
  custom format (`-Fc`) is what `pg_restore` consumes here.

---

## Troubleshooting

**`container wood-postgres is not running`**
The script aborts because the DB container is down. Check `docker ps` and
restart with `docker compose up -d` from the project root.

**`Could not connect to the endpoint URL`**
B2 endpoint or region is wrong in `/etc/wood-backup.env`. The endpoint must
match the region your bucket lives in (e.g. `s3.eu-central-003.backblazeb2.com`
for `eu-central-003`).

**`AccessDenied` on upload**
The B2 application key doesn't have write access to the bucket, or you
restricted it to a prefix that doesn't match `B2_PREFIX`.

**Cron didn't run**
Check `/var/log/wood-backup.log` and `journalctl -u cron`. Make sure
`/etc/cron.d/wood-backup` has mode `0644` (not executable) and ends with a
newline (the installer handles this).
