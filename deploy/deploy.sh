#!/bin/bash
# ============================================================
# AkhAI — Full deploy from workstation to VPS (legacy pnpm tree)
# Usage: ./deploy/deploy.sh [VPS_IP] [--user=U] [--app-dir=D] [--port=P] [--dry-run]
# Config: deploy/lib.sh defaults ← deploy/deploy.env ← env ← flags
# ============================================================
set -e

# shellcheck source=deploy/lib.sh
. "$(cd "$(dirname "$0")" && pwd)/lib.sh"
parse_deploy_flags "$@"
# Positional VPS IP kept for backward compatibility: ./deploy.sh 1.2.3.4
[ ${#DEPLOY_ARGS[@]} -ge 1 ] && DEPLOY_HOST="${DEPLOY_ARGS[0]}"

echo "━━━ AkhAI Deploy → $(SSH_TARGET) ━━━"
print_config

# 1. Sync code to VPS (never the host's env, data, or node_modules)
echo "[1/5] Syncing code..."
run rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'data/*.db' \
  --exclude 'data/*.db-*' \
  --exclude '.env.local' \
  --exclude '.turbo' \
  "$REPO_ROOT/" "$(SSH_TARGET):$APP_DIR/"

# 2. Fix ownership (rsync as the deploy user already sets correct ownership)
echo "[2/5] Permissions OK (rsync as $DEPLOY_USER user)"

# 3. Install deps & build on VPS
echo "[3/5] Installing & building..."
run_ssh "cd $APP_DIR/packages/web
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
npm rebuild better-sqlite3
NODE_OPTIONS=\"--max-old-space-size=768\" npx next build"

# 4. Verify env vars exist on the host
echo "[4/5] Checking env vars..."
run_ssh "test -f $HOST_ENV_FILE || echo 'WARNING: No $HOST_ENV_FILE on VPS! Copy deploy/.env.production.example there and fill it.'"

# 5. Restart with PM2
echo "[5/5] Starting AkhAI..."
run_ssh "cd $APP_DIR/packages/web
pm2 delete $PM2_NAME 2>/dev/null || true
NODE_ENV=production pm2 start \"npx next start -p $APP_PORT\" --name $PM2_NAME
pm2 save"
