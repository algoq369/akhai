#!/bin/bash
# ============================================================
# AkhAI — Quick Deploy (build local, push to Iceland)
# Usage: ./deploy/quick-deploy.sh
# Takes ~1-2 minutes instead of 10+
# ============================================================
set -e

VPS_IP="82.221.101.3"
VPS_USER="akhai"
LOCAL_WEB="/Users/sheirraza/akhai/packages/web"
REMOTE_WEB="/home/akhai/app/packages/web"

echo "━━━ AkhAI Quick Deploy ━━━"
echo ""

# Step 0: Rebuild better-sqlite3 for current Node.js version
echo "🔧 Rebuilding better-sqlite3..."
cd "$LOCAL_WEB/../.."
rm -rf node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3/build 2>/dev/null
npm rebuild better-sqlite3 2>/dev/null || true

# Step 1: Clean stale cache + build locally (fast on M3)
echo "⚡ Building locally..."
cd "$LOCAL_WEB"
rm -rf .next
AKHAI_FREE_MODE=true npx next build

echo ""
echo "📦 Syncing to Reykjavik..."

# Step 2: Sync .next build output
rsync -avz --delete \
  "$LOCAL_WEB/.next/" \
  "$VPS_USER@$VPS_IP:$REMOTE_WEB/.next/"

# Step 3: Sync changed source files
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'data/*.db' \
  --exclude 'data/*.db-*' \
  --exclude '.turbo' \
  --exclude '.env.local' \
  "$LOCAL_WEB/" \
  "$VPS_USER@$VPS_IP:$REMOTE_WEB/"

echo ""
echo "🔄 Restarting PM2..."
ssh "$VPS_USER@$VPS_IP" "pm2 restart akhai"

echo ""
echo "✅ Deployed! http://$VPS_IP"
