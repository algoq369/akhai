#!/usr/bin/env bash
set -euo pipefail
# AkhAI STANDALONE DEPLOY — V6 Block 1 / A4, hardened by B7 (deploy-harden).
# Host-agnostic + fresh-host capable: all paths/host/user/ports come from deploy/lib.sh
# (defaults = the current FlokiNET deploy; override via deploy/deploy.env, env vars, or flags).
# Safety: deploys beside the live app, verifies on $VERIFY_PORT, cutover is a printed
# command, never auto-run. --dry-run prints every resolved command without executing.
#
# Fresh host requirements (see deploy/setup-vps.sh): node >= NODE_MAJOR, pm2, build tools,
# and the filled secrets file at $HOST_ENV_FILE (start from deploy/.env.production.example).

# shellcheck source=deploy/lib.sh
. "$(cd "$(dirname "$0")" && pwd)/lib.sh"
parse_deploy_flags "$@"

LOCAL="$REPO_ROOT/packages/web"
print_config

# ── local preflight ─────────────────────────────────────────────────────────
if [ ! -f "$LOCAL/.next/standalone/packages/web/server.js" ]; then
  if [ "$DRY_RUN" = "1" ]; then
    echo "warn: no standalone build yet (dry-run continues; a real run requires npm run build)"
  else
    die "no standalone build (next.config output:'standalone' + npm run build first)"
  fi
fi

# Native packages that ship platform binaries: the standalone tree was traced on macOS,
# so every one of these present in the tree MUST be replaced by a linux install on the
# VPS. Versions are pinned to what the local tree actually resolved.
# (Dry-run without a build falls back to detecting them in local node_modules.)
NATIVE_PKGS=()
for PKG in better-sqlite3 sharp onnxruntime-node; do
  IN_TREE=0
  find "$LOCAL/.next/standalone" -path "*/node_modules/$PKG/package.json" -not -path "*/$PKG/node_modules/*" 2>/dev/null | grep -q . && IN_TREE=1
  [ "$IN_TREE" = "0" ] && [ "$DRY_RUN" = "1" ] && [ ! -d "$LOCAL/.next/standalone" ] &&
    (cd "$LOCAL" && node -e "require.resolve('$PKG/package.json')" >/dev/null 2>&1) && IN_TREE=1
  if [ "$IN_TREE" = "1" ]; then
    VER=$(cd "$LOCAL" && node -p "require('$PKG/package.json').version" 2>/dev/null) ||
      die "$PKG is in the standalone tree but its version cannot be resolved locally"
    NATIVE_PKGS+=("$PKG@$VER")
  fi
done
[ ${#NATIVE_PKGS[@]} -gt 0 ] || die "no native packages found in standalone tree — tree looks wrong"
echo "→ native packages to (re)install on VPS: ${NATIVE_PKGS[*]}"

echo "→ shield fast gate"
run bash "$LOCAL/scripts/shield.sh" --fast

# ── remote preflight (abort loudly BEFORE touching the host) ────────────────
echo "→ remote preflight"
# NOTE: remote scripts are built via top-level `read -d ''` heredocs, NOT $(cat <<EOF):
# macOS bash 3.2 misparses quotes inside heredocs nested in command substitution.
read -r -d '' PREFLIGHT_SCRIPT <<PREFLIGHT || true
set -e
FAIL=0
say(){ printf '%s\n' "\$1"; }
NODEV=\$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1 || echo 0)
[ "\$NODEV" -ge $NODE_MAJOR ] && say "  ok node v\$NODEV (>= $NODE_MAJOR)" || { say "  FAIL node >= $NODE_MAJOR required (found: \$(node -v 2>/dev/null || echo none))"; FAIL=1; }
command -v pm2 >/dev/null && say "  ok pm2" || { say "  FAIL pm2 missing (run deploy/setup-vps.sh)"; FAIL=1; }
command -v cc >/dev/null && say "  ok build tools (cc)" || { say "  FAIL cc missing — apt install build-essential"; FAIL=1; }
FREE_MB=\$(df -Pm "\$HOME" | awk 'NR==2{print \$4}')
[ "\$FREE_MB" -ge $MIN_FREE_MB ] && say "  ok disk \${FREE_MB}MB free (>= ${MIN_FREE_MB}MB)" || { say "  FAIL disk: \${FREE_MB}MB free < ${MIN_FREE_MB}MB"; FAIL=1; }
# secrets file — checked by NAME only; values are never printed
if [ -f "$HOST_ENV_FILE" ]; then
  say "  ok env file $HOST_ENV_FILE"
  for V in ANTHROPIC_API_KEY OPENROUTER_API_KEY; do
    grep -q "^\$V=." "$HOST_ENV_FILE" && say "  ok env \$V present" || { say "  FAIL env \$V missing/empty in $HOST_ENV_FILE"; FAIL=1; }
  done
  for V in SENTRY_DSN NEXT_PUBLIC_SENTRY_DSN STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET GUARD_NLI_URL BRAVE_SEARCH_API_KEY; do
    grep -q "^\$V=." "$HOST_ENV_FILE" || say "  warn env \$V not set (feature runs degraded)"
  done
else
  say "  FAIL no secrets file at $HOST_ENV_FILE — copy deploy/.env.production.example there and fill it"
  FAIL=1
fi
# data + cache dirs: created if absent (fresh-host bootstrap), must be writable
mkdir -p "$DATA_DIR" "$CACHE_DIR" 2>/dev/null || true
touch "$DATA_DIR/.write-test" 2>/dev/null && rm -f "$DATA_DIR/.write-test" && say "  ok data dir writable $DATA_DIR" || { say "  FAIL data dir not writable: $DATA_DIR"; FAIL=1; }
if command -v ss >/dev/null && ss -ltn 2>/dev/null | grep -q ":$VERIFY_PORT "; then
  pm2 describe $PM2_VERIFY_NAME >/dev/null 2>&1 && say "  ok :$VERIFY_PORT held by $PM2_VERIFY_NAME (will restart)" || { say "  FAIL :$VERIFY_PORT in use by another process"; FAIL=1; }
else
  say "  ok :$VERIFY_PORT free"
fi
[ "\$FAIL" = "0" ] || { say "PREFLIGHT FAILED — nothing deployed."; exit 1; }
say "  preflight PASS"
PREFLIGHT
run_ssh "$PREFLIGHT_SCRIPT"

# ── rsync the runtime ────────────────────────────────────────────────────────
echo "→ rsync standalone runtime"
run rsync -az --delete "$LOCAL/.next/standalone/" "$(SSH_TARGET):$STANDALONE_DIR/"
echo "→ rsync static + public (not included in standalone by design)"
run rsync -az --delete "$LOCAL/.next/static/" "$(SSH_TARGET):$STANDALONE_DIR/packages/web/.next/static/"
run rsync -az --delete "$LOCAL/public/" "$(SSH_TARGET):$STANDALONE_DIR/packages/web/public/"

# ── VPS wiring: env · persistent data + model cache · REAL native bindings ──
echo "→ VPS wiring (env copy · data/cache symlinks · native binding install)"
read -r -d '' WIRE_SCRIPT <<WIRE || true
set -e
NEW="$STANDALONE_DIR"
# host secrets live OUTSIDE the rsync --delete target; copied in fresh each deploy
cp "$HOST_ENV_FILE" "\$NEW/packages/web/.env.local"
# sqlite data + transformers model cache persist across deploys via symlink
mkdir -p "$DATA_DIR" "$CACHE_DIR"
rm -rf "\$NEW/packages/web/data" "\$NEW/packages/web/.cache"
ln -sfn "$DATA_DIR"  "\$NEW/packages/web/data"
ln -sfn "$CACHE_DIR" "\$NEW/packages/web/.cache"

# Native bindings: the tree carries darwin binaries — install the SAME versions for
# the target arch and overwrite. No copying from a legacy tree: works on a fresh host.
BUILD="\$NEW/.bindings-build"
mkdir -p "\$BUILD" && cd "\$BUILD"
[ -f package.json ] || echo '{"name":"bindings","private":true}' > package.json
echo "  installing: ${NATIVE_PKGS[*]} (native build for \$(uname -sm))"
npm install --no-save --no-audit --no-fund ${NATIVE_PKGS[*]} ||
  { echo "✗ FATAL: native package install failed — host cannot produce linux bindings."; echo "  Fix the host (network/build-essential) and re-run. NOT cutting over."; exit 1; }
for PKG in ${NATIVE_PKGS[*]%%@*}; do
  SRC="\$BUILD/node_modules/\$PKG"
  DST=\$(find "\$NEW" -path "*/node_modules/\$PKG/package.json" -not -path "*/\$PKG/node_modules/*" -not -path "\$BUILD/*" 2>/dev/null | head -1)
  [ -n "\$DST" ] || { echo "✗ FATAL: \$PKG not found in standalone tree on host"; exit 1; }
  rsync -a --delete "\$SRC/" "\$(dirname "\$DST")/"
  echo "  \$PKG: linux binding installed"
done
# LOUD verification — a binding that cannot load is a failed deploy, not a warning.
# (Silent fallback is how the embedding router died in prod before: M2 standalone note.)
SQL=\$(find "\$NEW" -path "*/node_modules/better-sqlite3/package.json" -not -path "\$BUILD/*" | head -1)
node -e "require(require('path').dirname('\$SQL'))" ||
  { echo "✗ FATAL: better-sqlite3 binding does not load on this host — deploy aborted before boot"; exit 1; }
echo "  better-sqlite3: loads OK"
ORT=\$(find "\$NEW" -path "*/node_modules/onnxruntime-node/package.json" -not -path "\$BUILD/*" | head -1)
if [ -n "\$ORT" ]; then
  node -e "require(require('path').dirname('\$ORT'))" ||
    { echo "✗ FATAL: onnxruntime-node binding does not load — embedding router would silently die; deploy aborted"; exit 1; }
  echo "  onnxruntime-node: loads OK"
fi
WIRE
run_ssh "$WIRE_SCRIPT"

# ── boot verify on $VERIFY_PORT ──────────────────────────────────────────────
echo "→ boot verify on :$VERIFY_PORT"
run_ssh "pm2 delete $PM2_VERIFY_NAME >/dev/null 2>&1; cd $STANDALONE_DIR/packages/web && PORT=$VERIFY_PORT HOSTNAME=127.0.0.1 pm2 start server.js --name $PM2_VERIFY_NAME --update-env >/dev/null && sleep 6 && curl -s -o /dev/null -w ':$VERIFY_PORT health → HTTP %{http_code}\n' http://127.0.0.1:$VERIFY_PORT/ && pm2 logs $PM2_VERIFY_NAME --nostream --lines 3 --no-color | grep -E 'Next.js|Ready' || true"

cat <<TXT

── If :$VERIFY_PORT returned 200 and banner shows the NEW Next version ──
CUTOVER : ssh $(SSH_TARGET) 'pm2 delete $PM2_NAME; cd $STANDALONE_DIR/packages/web && PORT=$APP_PORT HOSTNAME=127.0.0.1 pm2 start server.js --name $PM2_NAME --update-env && pm2 save && pm2 delete $PM2_VERIFY_NAME'
ROLLBACK: ssh $(SSH_TARGET) 'pm2 delete $PM2_NAME 2>/dev/null; cd $APP_DIR/packages/web && pm2 start npm --name $PM2_NAME -- start && pm2 save'
TXT
