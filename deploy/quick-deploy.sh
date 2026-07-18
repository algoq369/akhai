#!/bin/bash
# ============================================================
# AkhAI — Quick Deploy (build local, push to VPS)  [legacy pnpm tree]
# Usage: ./deploy/quick-deploy.sh [--host=IP] [--user=U] [--app-dir=D] [--dry-run]
# Config: deploy/lib.sh defaults ← deploy/deploy.env ← env ← flags
# Takes ~1-2 minutes instead of 10+
# ============================================================
set -e

# shellcheck source=deploy/lib.sh
. "$(cd "$(dirname "$0")" && pwd)/lib.sh"
parse_deploy_flags "$@"

LOCAL_WEB="$REPO_ROOT/packages/web"
REMOTE_WEB="$APP_DIR/packages/web"

echo "━━━ AkhAI Quick Deploy → $(SSH_TARGET) ━━━"
print_config
echo ""

# Step 0: Rebuild better-sqlite3 for current Node.js version
echo "🔧 Rebuilding better-sqlite3..."
cd "$REPO_ROOT"
run rm -rf node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3/build
run npm rebuild better-sqlite3

# Step 1: Clean stale cache + build locally (fast on M3)
echo "⚡ Building locally..."
cd "$LOCAL_WEB"
run rm -rf .next
run npx next build

echo ""
echo "💾 Backing up current build on VPS..."
run_ssh "cp -r $REMOTE_WEB/.next $REMOTE_WEB/.next.backup 2>/dev/null || true"

echo ""
echo "📦 Syncing to $DEPLOY_HOST..."

# Step 2: Sync .next build output
run rsync -avz --delete "$LOCAL_WEB/.next/" "$(SSH_TARGET):$REMOTE_WEB/.next/"

# Step 3: Sync changed source files (never the host's env, data, or caches)
run rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'data/*.db' \
  --exclude 'data/*.db-*' \
  --exclude '.turbo' \
  --exclude '.cache' \
  --exclude '.env.local' \
  "$LOCAL_WEB/" \
  "$(SSH_TARGET):$REMOTE_WEB/"

echo ""
echo "🔄 Restarting PM2..."
run_ssh "pm2 restart $PM2_NAME"

echo ""
echo "✅ Deployed! http://$DEPLOY_HOST"
