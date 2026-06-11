#!/usr/bin/env bash
set -euo pipefail
# AkhAI STANDALONE DEPLOY — V6 Block 1 / A4. Runtime ships with artifacts; ZERO installs on VPS.
# Safety: deploys beside legacy app, verifies on :3001, cutover is a printed command not auto-run.
VPS=akhai@82.221.101.3
APP=/home/akhai/app                  # legacy tree — source of .env.local, data/, linux sqlite binding
NEW=/home/akhai/app-standalone
LOCAL="$(cd "$(dirname "$0")/.." && pwd)/packages/web"

[ -f "$LOCAL/.next/standalone/packages/web/server.js" ] || { echo "✗ no standalone build (next.config output:'standalone' + npm run build first)"; exit 1; }

echo "→ shield fast gate"
bash "$LOCAL/scripts/shield.sh" --fast

echo "→ rsync standalone runtime"
rsync -az --delete "$LOCAL/.next/standalone/" "$VPS:$NEW/"
echo "→ rsync static + public (not included in standalone by design)"
rsync -az --delete "$LOCAL/.next/static/" "$VPS:$NEW/packages/web/.next/static/"
rsync -az --delete "$LOCAL/public/"       "$VPS:$NEW/packages/web/public/"

echo "→ VPS wiring: env copy · shared data symlink · linux sqlite binding"
ssh "$VPS" bash -s <<'EOS'
set -e
NEW=/home/akhai/app-standalone; APP=/home/akhai/app
cp "$APP/packages/web/.env.local" "$NEW/packages/web/.env.local"
mkdir -p "$APP/packages/web/data"
rm -rf "$NEW/packages/web/data"
ln -sfn "$APP/packages/web/data" "$NEW/packages/web/data"
BIND=$(find "$APP/node_modules/.pnpm" -path "*better-sqlite3*/build/Release/better_sqlite3.node" 2>/dev/null | head -1)
DEST=$(find "$NEW" -path "*better-sqlite3*/build/Release" -type d 2>/dev/null | head -1)
if [ -n "$BIND" ] && [ -n "$DEST" ]; then cp "$BIND" "$DEST/better_sqlite3.node"; echo "  sqlite binding: linux OK"; else echo "  sqlite binding: NOT FOUND — verify manually"; fi
EOS

echo "→ boot verify on :3001"
ssh "$VPS" "pm2 delete akhai-next >/dev/null 2>&1; cd $NEW/packages/web && PORT=3001 HOSTNAME=127.0.0.1 pm2 start server.js --name akhai-next --update-env >/dev/null && sleep 6 && curl -s -o /dev/null -w ':3001 health → HTTP %{http_code}\n' http://127.0.0.1:3001/ && pm2 logs akhai-next --nostream --lines 3 --no-color | grep -E 'Next.js|Ready' || true"

cat <<'TXT'

── If :3001 returned 200 and banner shows the NEW Next version ──
CUTOVER : ssh akhai@82.221.101.3 'pm2 delete akhai; cd /home/akhai/app-standalone/packages/web && PORT=3000 HOSTNAME=127.0.0.1 pm2 start server.js --name akhai --update-env && pm2 save && pm2 delete akhai-next'
ROLLBACK: ssh akhai@82.221.101.3 'pm2 delete akhai 2>/dev/null; cd /home/akhai/app/packages/web && pm2 start npm --name akhai -- start && pm2 save'
TXT
