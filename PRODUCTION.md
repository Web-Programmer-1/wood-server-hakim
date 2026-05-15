# Production deployment guide

> Repo: **Web-Programmer-1/wood-server-hakim**
> Image: **`ghcr.io/web-programmer-1/wood-server-hakim`**

## How it works

```
git push origin main
        │
        ▼
GitHub Actions (.github/workflows/deploy.yml)
  1. Build Docker image            (Dockerfile)
  2. Push to GHCR                  (ghcr.io/web-programmer-1/wood-server-hakim:sha-XXX + :latest)
  3. SSH into the VPS
  4. docker compose pull           (docker-compose.deploy.yml)
  5. docker compose up -d
        │
        ▼
VPS — Docker stack
  postgres  →  redis  →  migrate (one-shot)  →  api  →  worker
```

The VPS only needs Docker. No node, no pnpm, no git, no build.

---

## ONE-TIME VPS SETUP (private repo)

> Because the repo is **private**, GHCR will also publish the image as
> private. Two PATs are involved:
> - **VPS PAT** — `read:packages` only — used by Docker on the VPS to pull
>   the image. Stored in `~/.ghcr_token` on the VPS.
> - **Bootstrap PAT** (one-time use, optional) — `repo` (read) scope —
>   only needed if you want the bootstrap script to fetch the compose
>   file from your private repo via `curl`. You can skip this PAT
>   entirely by `scp`-ing the file from your laptop (see method B).

### Method A — scp the compose file from your laptop (simplest)

From your **mac** (this repo's checkout):

```bash
# Replace <vps> with your VPS IP / hostname
ssh root@<vps> 'mkdir -p ~/wood-server-hakim'
scp docker-compose.deploy.yml deploy/vps-bootstrap.sh \
    root@<vps>:~/wood-server-hakim/
```

Then SSH in and run the bootstrap script — it'll skip the curl step
because the compose file is already present:

```bash
ssh root@<vps>
cd ~/wood-server-hakim
bash vps-bootstrap.sh
```

### Method B — run the bootstrap one-liner with a temporary PAT

If you don't want to scp, create a short-lived classic PAT with **`repo`**
(read) scope, then on the VPS:

```bash
export GH_TOKEN=ghp_xxxxxxxxxxxxxxx
curl -fsSL -H "Authorization: token $GH_TOKEN" \
  https://raw.githubusercontent.com/Web-Programmer-1/wood-server-hakim/main/deploy/vps-bootstrap.sh \
  | GH_TOKEN=$GH_TOKEN bash
unset GH_TOKEN
```

Delete that PAT afterwards — the bootstrap only needs it for the first run.

### Then (either method): do the 3 things the script prints

It ends by printing the exact secrets to paste into GitHub. Specifically:

1. **Fill in real secrets:** `nano ~/wood-server-hakim/.env.production`

2. **Authenticate Docker to GHCR.** Create a *second* PAT (or reuse one)
   with **`read:packages`** scope only. On the VPS:

   ```bash
   echo 'PASTE_YOUR_PAT' > ~/.ghcr_token
   chmod 600 ~/.ghcr_token
   cat ~/.ghcr_token | docker login ghcr.io -u Web-Programmer-1 --password-stdin
   ```

3. **Add 6 repository secrets** in [your repo's Actions settings](https://github.com/Web-Programmer-1/wood-server-hakim/settings/secrets/actions):

   | Secret | Value |
   |---|---|
   | `HOST` | VPS IP or hostname |
   | `USERNAME` | SSH user (`root` based on your setup) |
   | `SSH_KEY` | Private key printed by the bootstrap script |
   | `SSH_PORT` | `22` |
   | `DEPLOY_DIR` | `/root/wood-server-hakim` |
   | `GHCR_USERNAME` | `Web-Programmer-1` |

After that, every `git push origin main` triggers a build + deploy.

---

## What gets deployed

`docker-compose.deploy.yml` brings up five services:

| Service | Image | Purpose |
| --- | --- | --- |
| `postgres` | `postgres:16-alpine` | Database, persistent volume `wood_pgdata` |
| `redis` | `redis:7-alpine` | OTP / cache / BullMQ, persistent volume, AOF on |
| `migrate` | `ghcr.io/web-programmer-1/wood-server-hakim` | One-shot: runs `prisma migrate deploy`, exits |
| `api` | same | Express API, port 4000 bound to 127.0.0.1 |
| `worker` | same | BullMQ worker process |

API + worker have:
- `restart: unless-stopped` — auto-restart on crash and host reboot
- Memory caps (`deploy.resources.limits.memory`)
- Built-in healthcheck pinging `/health/live`
- Log rotation (10 MB × 5 files per container)

`api` waits for postgres+redis healthy AND `migrate` exited 0 before
starting. `worker` waits for `api` healthy. So API never serves traffic
against an un-migrated DB.

---

## Operating

```bash
ssh root@<vps>
cd ~/wood-server-hakim

# Status + health
docker compose -f docker-compose.deploy.yml ps
curl -s http://127.0.0.1:4000/health/live
curl -s http://127.0.0.1:4000/health/ready

# Tail logs
docker compose -f docker-compose.deploy.yml logs -f api
docker compose -f docker-compose.deploy.yml logs -f worker

# Manual restart (rare — auto-restart handles crashes)
docker compose -f docker-compose.deploy.yml restart api worker

# Open a shell inside the API container
docker compose -f docker-compose.deploy.yml exec api sh
```

---

## Rollback

Every push tags the image with both `:latest` and `:sha-<short-sha>`. To
roll back:

```bash
ssh root@<vps>
cd ~/wood-server-hakim
IMAGE=ghcr.io/web-programmer-1/wood-server-hakim:sha-<previous-sha> \
  docker compose -f docker-compose.deploy.yml up -d
```

Previous SHAs are visible in any past
[Actions run](https://github.com/Web-Programmer-1/wood-server-hakim/actions).

---

## Memory budget on a 1.9 GB VPS

The defaults assume the API stack owns most of the box:

| Container | Cap | Typical usage |
|---|---|---|
| postgres  | (no cap)  | ~120 MB |
| redis     | 256 MB    | ~50 MB |
| api       | 512 MB    | ~250 MB |
| worker    | 384 MB    | ~150 MB |
| **total** | **~1.2 GB** | leaves ~700 MB for OS + nginx |

If you also run nginx + something else on the same host and start seeing
OOMs (`dmesg | grep -i oom`), lower the caps in
`docker-compose.deploy.yml`:

```yaml
api:
  deploy: { resources: { limits: { memory: 400M } } }
worker:
  deploy: { resources: { limits: { memory: 256M } } }
```

…and lower `NODE_OPTIONS` correspondingly in `.env.production`:

```env
NODE_OPTIONS=--max-old-space-size=300
```

(Node heap should stay ~20% below the container cap so PM2/Docker can
react before the kernel OOM killer fires.)

---

## Why the app used to "auto stop"

Old setup: `pm2 start dist/server.js` with no reconnect handling on Redis,
no error listeners, no memory cap, `unhandledRejection` exiting on every
transient error. All fixed in this branch:

- [src/utils/redis.ts](src/utils/redis.ts) — reconnect strategy + error listener
- [src/queue/bullmqConnection.ts](src/queue/bullmqConnection.ts) — same for ioredis
- [src/server.ts](src/server.ts) — non-fatal `unhandledRejection`, transient-error tolerance
- [src/app/shared/prisma.ts](src/app/shared/prisma.ts) — retried DB warm-up
- Memory cap via `--max-old-space-size=400` + container `memory: 512M`
- Docker `restart: unless-stopped` survives crashes AND host reboots

---

## Sanity checklist

- [ ] On VPS: `docker compose -f docker-compose.deploy.yml ps` shows api + worker `Up (healthy)`
- [ ] `curl -fsS http://127.0.0.1:4000/health/live` returns 200
- [ ] `curl -fsS http://127.0.0.1:4000/health/ready` returns 200 (DB + Redis OK)
- [ ] `docker logs wood-api --tail 50` is clean (no spammy reconnect errors)
- [ ] `sudo systemctl is-enabled docker` says `enabled`
- [ ] After `sudo reboot`, the stack comes back automatically without you logging in
- [ ] All 6 GitHub Actions secrets are set
- [ ] PAT is loaded in `~/.ghcr_token` and `docker login ghcr.io` worked

---

## Alternative (no-Docker) supervisors — still in the repo

If you ever want to drop Docker, the project also ships:
- [ecosystem.config.js](ecosystem.config.js) for PM2
- [deploy/wood-api.service](deploy/wood-api.service) for systemd

…but the GitHub Actions auto-deploy flow only targets the Docker setup.
