#!/bin/bash
# ============================================================
# AkhAI — VPS Initial Setup (run once as root on a FRESH host)
# Usage: bash setup-vps.sh [--user=U] [--app-dir=D] [--data-dir=D] [--dry-run]
# Config: deploy/lib.sh defaults ← deploy/deploy.env ← env ← flags
# Works on any Debian/Ubuntu VPS (FlokiNET today, Hetzner tomorrow).
# ============================================================
set -e

# shellcheck source=deploy/lib.sh
. "$(cd "$(dirname "$0")" && pwd)/lib.sh"
parse_deploy_flags "$@"

DEPLOY_HOME="/home/$DEPLOY_USER"

echo "━━━ AkhAI VPS Setup (user=$DEPLOY_USER app=$APP_DIR node=${NODE_MAJOR}.x) ━━━"
print_config

# 1. System updates
echo "[1/7] Updating system..."
run apt update
run apt upgrade -y

# 2. Install Node.js LTS + build tools (build-essential is REQUIRED for better-sqlite3)
echo "[2/7] Installing Node.js ${NODE_MAJOR}.x..."
if [ "$DRY_RUN" = "1" ]; then
  echo "RUN  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -"
else
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
fi
run apt install -y nodejs build-essential python3 git

# 3. Install pnpm + PM2
echo "[3/7] Installing pnpm & PM2..."
run npm install -g "pnpm@$PNPM_VERSION" pm2

# 4. Create app user & directories (app tree, data dir, env-file parent)
echo "[4/7] Creating app user & dirs..."
run useradd -m -s /bin/bash "$DEPLOY_USER" || true
run mkdir -p "$APP_DIR" "$DATA_DIR" "$CACHE_DIR" "$(dirname "$HOST_ENV_FILE")"
run chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME"

# 5. Install Caddy (auto-HTTPS reverse proxy)
echo "[5/7] Installing Caddy..."
run apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
if [ "$DRY_RUN" = "1" ]; then
  echo "RUN  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg"
  echo "RUN  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list"
else
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
fi
run apt update
run apt install -y caddy

# 6. Configure firewall
echo "[6/7] Configuring firewall..."
run apt install -y ufw
run ufw allow 22/tcp
run ufw allow 80/tcp
run ufw allow 443/tcp
run ufw --force enable

# 7. Setup PM2 startup
echo "[7/7] Configuring PM2 startup..."
run pm2 startup systemd -u "$DEPLOY_USER" --hp "$DEPLOY_HOME"
run systemctl enable "pm2-$DEPLOY_USER"

echo ""
echo "━━━ Setup complete! ━━━"
echo "Next:"
echo "  1. Copy deploy/.env.production.example to $HOST_ENV_FILE and fill it (as $DEPLOY_USER)"
echo "  2. Run deploy/quick-deploy-standalone.sh from your workstation"
