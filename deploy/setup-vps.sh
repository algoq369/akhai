#!/bin/bash
# ============================================================
# AkhAI — FlokiNET Iceland VPS Initial Setup (run once as root)
# Sovereign infrastructure · Reykjavik datacenter
# ============================================================
set -e

echo "━━━ AkhAI VPS Setup ━━━"

# 1. System updates
echo "[1/7] Updating system..."
apt update && apt upgrade -y

# 2. Install Node.js 20 LTS + build tools (for better-sqlite3)
echo "[2/7] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs build-essential python3 git

# 3. Install pnpm + PM2
echo "[3/7] Installing pnpm & PM2..."
npm install -g pnpm@8.15.0 pm2

# 4. Create app user & directory
echo "[4/7] Creating app user..."
useradd -m -s /bin/bash akhai 2>/dev/null || true
mkdir -p /home/akhai/app /home/akhai/app/data
chown -R akhai:akhai /home/akhai

# 5. Install Caddy (auto-HTTPS reverse proxy)
echo "[5/7] Installing Caddy..."
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

# 6. Configure firewall
echo "[6/7] Configuring firewall..."
apt install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 7. Setup PM2 startup
echo "[7/7] Configuring PM2 startup..."
pm2 startup systemd -u akhai --hp /home/akhai
systemctl enable pm2-akhai

echo ""
echo "━━━ Setup complete! ━━━"
echo "Next: Run deploy.sh from your Mac"
