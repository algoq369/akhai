#!/bin/bash
# ============================================================
# AkhAI — Deploy from Mac to FlokiNET Iceland VPS
# Usage: ./deploy/deploy.sh <VPS_IP>
# Example: ./deploy/deploy.sh 185.xx.xx.xx
# ============================================================
set -e

VPS_IP="${1:?Usage: ./deploy.sh <VPS_IP> [domain]}"
DOMAIN="${2:-}"
SSH_APP="ssh -o StrictHostKeyChecking=no akhai@$VPS_IP"

echo "━━━ AkhAI Deploy → $VPS_IP ━━━"

# 1. Sync code to VPS (exclude node_modules, .next, data)
echo "[1/5] Syncing code..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'data/*.db' \
  --exclude 'data/*.db-*' \
  --exclude '.env.local' \
  --exclude '.turbo' \
  /Users/sheirraza/akhai/ akhai@$VPS_IP:/home/akhai/app/

# 2. Fix ownership (rsync as akhai already sets correct ownership)
echo "[2/5] Permissions OK (rsync as akhai user)"

# 3. Install deps & build on VPS
echo "[3/5] Installing & building..."
$SSH_APP << 'REMOTE'
cd ~/app/packages/web
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
npm rebuild better-sqlite3
NODE_OPTIONS="--max-old-space-size=768" npx next build
REMOTE

# 4. Create/update .env.production if not exists
echo "[4/5] Checking env vars..."
$SSH_APP "test -f ~/app/packages/web/.env.local || echo 'WARNING: No .env.local on VPS! Copy your env vars.'"

# 5. Restart with PM2
echo "[5/5] Starting AkhAI..."
$SSH_APP << 'REMOTE'
cd ~/app/packages/web
pm2 delete akhai 2>/dev/null || true
NODE_ENV=production pm2 start "npx next start -p 3000" --name akhai
pm2 save
REMOTE
