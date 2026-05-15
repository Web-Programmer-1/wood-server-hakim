#!/usr/bin/env bash
# One-time VPS setup for Web-Programmer-1/wood-server-hakim.
#
# Run this ONCE on a fresh Ubuntu/Debian VPS. After this, every `git push
# origin main` will auto-deploy via GitHub Actions — nothing else to do on
# the VPS.
#
# PRIVATE REPO: this repo is private, so fetching files from
# raw.githubusercontent.com needs a PAT. Run with GH_TOKEN exported:
#
#   export GH_TOKEN=ghp_xxx     # PAT with `repo` (read) scope
#   curl -fsSL -H "Authorization: token $GH_TOKEN" \
#     https://raw.githubusercontent.com/Web-Programmer-1/wood-server-hakim/main/deploy/vps-bootstrap.sh \
#     | GH_TOKEN=$GH_TOKEN bash
#
# Or just scp the script + compose file from your laptop (see PRODUCTION.md).
set -euo pipefail

REPO_OWNER="Web-Programmer-1"
REPO_NAME="wood-server-hakim"
REPO_SLUG="$REPO_OWNER/$REPO_NAME"
GHCR_IMAGE="ghcr.io/web-programmer-1/wood-server-hakim"
RAW_BASE="https://raw.githubusercontent.com/$REPO_SLUG/main"
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/wood-server-hakim}"

echo "[bootstrap] repo:       $REPO_SLUG"
echo "[bootstrap] image:      $GHCR_IMAGE"
echo "[bootstrap] deploy dir: $DEPLOY_DIR"

# ---- 1. Install Docker if missing (idempotent) ----
if ! command -v docker >/dev/null 2>&1; then
  echo "[bootstrap] installing docker..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  if [ "$(id -u)" != "0" ]; then
    sudo usermod -aG docker "$USER"
    echo "[bootstrap] added $USER to docker group — log out & back in for it to take effect"
  fi
else
  echo "[bootstrap] docker already installed: $(docker --version)"
fi

sudo systemctl enable --now docker

# ---- 2. Lay down the deploy directory + compose file ----
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo "[bootstrap] fetching docker-compose.deploy.yml..."
if [ -n "${GH_TOKEN:-}" ]; then
  # Private-repo fetch — uses PAT with `repo` (read) scope.
  curl -fsSL -H "Authorization: token $GH_TOKEN" \
    "$RAW_BASE/docker-compose.deploy.yml" -o docker-compose.deploy.yml
elif [ -f docker-compose.deploy.yml ]; then
  echo "[bootstrap] docker-compose.deploy.yml already present — keeping it"
else
  cat <<EOF
[bootstrap] FATAL: cannot fetch docker-compose.deploy.yml.

The repo $REPO_SLUG is private, so raw.githubusercontent.com needs a PAT.
Options:
  1. Re-run with GH_TOKEN set:
       export GH_TOKEN=ghp_xxx     # PAT with 'repo' read scope
       GH_TOKEN=\$GH_TOKEN bash $0
  2. Or scp the file from your laptop:
       scp docker-compose.deploy.yml $(whoami)@<vps>:$DEPLOY_DIR/
     ...then re-run this script.
EOF
  exit 1
fi

# ---- 3. Create .env.production stub if missing ----
if [ ! -f .env.production ]; then
  cat > .env.production <<'EOF'
# === FILL IN BEFORE FIRST DEPLOY ===
NODE_ENV=production
PORT=4000

# Postgres (matches the compose service)
POSTGRES_USER=wood_dev
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=wood_database

# Redis (in-stack service name)
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=CHANGE_ME
JWT_ACCESS_SECRET=CHANGE_ME
JWT_REFRESH_SECRET=CHANGE_ME
JWT_EXPIRE_IN=1h
EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=CHANGE_ME
REFRESH_TOKEN_EXPIRES_IN=30d
RESET_PASS_TOKEN=CHANGE_ME
RESET_PASS_TOKEN_EXPIRES_IN=1h

COOKIE_SECURE=true
COOKIE_SAMESITE=lax
SALT_ROUND=12

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

# Email
EMAIL=
APP_PASS=
EMAIL_USER=
EMAIL_PASS=
BUSINESS_EMAIL=

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SYSTEM_SENDER_EMAIL=

# OpenRouter / Stripe
OPENROUTER_API_KEY=
STRIPE_SECRET_KEY=

# bKash
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_BASE_URL=
BKASH_CALLBACK_URL=

# SSLCommerz
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_SESSION_URL=
SSLCOMMERZ_VALIDATION_URL=
SSLCOMMERZ_SUCCESS_URL=
SSLCOMMERZ_FAIL_URL=
SSLCOMMERZ_CANCEL_URL=
SSLCOMMERZ_IPN_URL=
SSLCOMMERZ_FRONTEND_SUCCESS=
SSLCOMMERZ_FRONTEND_FAIL=
SSLCOMMERZ_FRONTEND_CANCEL=

# Reset password link (frontend URL)
RESET_PASS_LINK=

# SMS / Paperfly
SMS_SENDER=
SMS_API_KEY=
SMS_CLIENT_ID=
PAPERFLY_USERNAME=
PAPERFLY_PASSWORD=
PAPERFLY_KEY=
EOF
  chmod 600 .env.production
  echo "[bootstrap] created .env.production stub at $DEPLOY_DIR/.env.production"
else
  echo "[bootstrap] .env.production already exists — leaving it alone"
fi

# ---- 4. Docker daemon log rotation (idempotent) ----
if [ ! -f /etc/docker/daemon.json ]; then
  echo "[bootstrap] configuring docker log rotation..."
  sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
EOF
  sudo systemctl restart docker
fi

# ---- 5. Generate SSH key for GitHub Actions if missing ----
if [ ! -f "$HOME/.ssh/github_deploy" ]; then
  echo "[bootstrap] generating dedicated SSH key for GitHub Actions..."
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  ssh-keygen -t ed25519 -f "$HOME/.ssh/github_deploy" -N "" -C "github-actions-$REPO_NAME" >/dev/null
  cat "$HOME/.ssh/github_deploy.pub" >> "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"
fi

VPS_IP="$(curl -fsS --max-time 3 ifconfig.me 2>/dev/null || echo '<your VPS IP>')"

cat <<MSG

============================================================
[bootstrap] VPS setup complete.
============================================================

NOW DO THESE 3 THINGS:

(1) Fill in real secrets:
      nano $DEPLOY_DIR/.env.production

(2) Authenticate Docker to GHCR:
      - On GitHub: Settings → Developer settings → Personal access tokens
        → Tokens (classic) → Generate new token (classic)
        - Note:  wood-vps-ghcr
        - Scope: read:packages
        - Copy the token.
      - Then on this VPS:
          echo 'PASTE_YOUR_PAT' > ~/.ghcr_token
          chmod 600 ~/.ghcr_token
          cat ~/.ghcr_token | docker login ghcr.io -u Web-Programmer-1 --password-stdin

(3) Add these repository secrets in GitHub
    (https://github.com/$REPO_SLUG/settings/secrets/actions):

      HOST           = $VPS_IP
      USERNAME       = $(whoami)
      SSH_PORT       = 22
      DEPLOY_DIR     = $DEPLOY_DIR
      GHCR_USERNAME  = Web-Programmer-1
      SSH_KEY        = (paste the private key shown below — the entire block)

    Private key to paste into the SSH_KEY secret:

$(cat "$HOME/.ssh/github_deploy")

============================================================

Then just \`git push origin main\` — GitHub Actions does the rest.

To deploy manually right now for a sanity check:
    cd $DEPLOY_DIR
    IMAGE=$GHCR_IMAGE:latest docker compose -f docker-compose.deploy.yml pull
    IMAGE=$GHCR_IMAGE:latest docker compose -f docker-compose.deploy.yml up -d
    docker compose -f docker-compose.deploy.yml ps

MSG