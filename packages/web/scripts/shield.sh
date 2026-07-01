#!/usr/bin/env bash
# AkhAI SHIELD — automated audit gate (Master Plan V6, Block 1 / W8)
# Usage: shield.sh [--fast|--full] [--build-log <path>]
# --fast (default): tsc + vitest + tripwires + ratchets, ts-ignore/large-file/route-validation ratchets (WEBNA A2/A6)  (~90s, pre-push)
# --full: fast + pnpm audit (no crit/high) + bundle budget (every route <= 450 kB)
set -uo pipefail
cd "$(dirname "$0")/.."   # packages/web
MODE="${1:---fast}"
BUILD_LOG="${3:-/tmp/akhai-standalone-build.log}"
RED='\033[0;31m'; GRN='\033[0;32m'; NC='\033[0m'
FAIL=0
say(){ printf "%b\n" "$1"; }
gate(){ if [ "$1" -ne 0 ]; then say "${RED}FAIL${NC} $2"; FAIL=1; else say "${GRN} OK ${NC} $2"; fi }

# ---------- 1. TypeScript ----------
npx tsc --noEmit >/dev/null 2>&1; gate $? "tsc --noEmit"

# ---------- 2. Tests ----------
npx vitest run --silent >/dev/null 2>&1; gate $? "vitest"

# ---------- 3. Tripwires (hard fails) ----------
# Whitelisted non-security randomness: retry jitter, display variety, activation noise (A15 — determinism flag pending)
MR=$(grep -rn "Math.random" app/api lib --include="*.ts" 2>/dev/null | grep -v "news/route.ts" | grep -v __tests__ \
  | grep -v "lib/retry.ts" | grep -v "lib/meta-core-protocol.ts" | grep -v "lib/intelligence-fusion-scoring.ts" | wc -l | tr -d ' ')
[ "$MR" -eq 0 ]; gate $? "no Math.random in app/api+lib (found: $MR)"

for f in lib/database.ts lib/auth.ts lib/multi-provider-api.ts; do
  head -1 "$f" | grep -q "server-only"; gate $? "server-only guard: $f"
done

AS=$(grep -c "AbortSignal.timeout" lib/multi-provider-api.ts 2>/dev/null || echo 0)
[ "$AS" -ge 6 ]; gate $? "provider timeouts present (>=6, found: $AS)"

ENV_TRACKED=$(git ls-files | grep -E "\.env($|\.local|\.production)" | grep -v example | wc -l | tr -d ' ')
[ "$ENV_TRACKED" -eq 0 ]; gate $? "no env files tracked (found: $ENV_TRACKED)"

# ---------- 4. Ratchets (counts may shrink, never grow) ----------
BASE=scripts/.shield-baselines
touch "$BASE"
ratchet(){ # name current
  local name="$1" cur="$2" prev
  prev=$(grep "^$name=" "$BASE" | cut -d= -f2)
  if [ -z "$prev" ]; then echo "$name=$cur" >> "$BASE"; say "${GRN} OK ${NC} ratchet init $name=$cur"; return; fi
  if [ "$cur" -gt "$prev" ]; then say "${RED}FAIL${NC} ratchet $name grew: $prev -> $cur"; FAIL=1
  else
    say "${GRN} OK ${NC} ratchet $name: $cur (<= $prev)"
    [ "$cur" -lt "$prev" ] && sed -i.bak "s/^$name=.*/$name=$cur/" "$BASE" && rm -f "$BASE.bak"
  fi
}
CL=$(grep -rn "console\.log" app components lib hooks --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v __tests__ | wc -l | tr -d ' ')
ratchet console_log "$CL"
ANY=$(grep -rn ": any" app components lib hooks --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v __tests__ | wc -l | tr -d ' ')
ratchet any_types "$ANY"
DT=$(grep -rn "datetime('now')" lib app --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')
ratchet sqlite_datetime_now "$DT"

# WEBNA A6: no @ts-ignore / @ts-expect-error (target 0; ratchet down from current)
TSI=$(grep -rn "@ts-ignore\|@ts-expect-error" app components lib hooks --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v __tests__ | wc -l | tr -d ' ')
ratchet ts_ignore "$TSI"

# WEBNA A6: source files under 500 lines (grandfather existing, block NEW oversized files)
LF=$(find app components lib hooks \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | grep -v __tests__ | xargs wc -l 2>/dev/null | awk '$2!="total" && $1>500' | wc -l | tr -d ' ')
ratchet large_files "$LF"

# WEBNA A2: Zod validation at mutating route boundaries (block NEW routes that read a body without validation)
UV=0
for f in $(grep -rl "request.json()" app/api --include="*.ts" 2>/dev/null); do
  grep -qE "\.parse\(|\.safeParse\(|Schema|z\.object|parsed\." "$f" || UV=$((UV+1))
done
ratchet unvalidated_routes "$UV"

# ---------- 5. Full mode ----------
if [ "$MODE" = "--full" ]; then
  AUD=$(cd ../.. && pnpm audit --prod 2>/dev/null | grep -E "critical|high" | wc -l | tr -d ' ')
  [ "$AUD" -eq 0 ]; gate $? "pnpm audit: 0 critical/high"

  if [ -f "$BUILD_LOG" ]; then
    OVER=$(awk '/Route \(app\)/,/First Load JS shared/' "$BUILD_LOG" | \
      awk '$NF=="kB" && $(NF-1)+0 > 450 {print $2, $(NF-1)"kB"}')
    if [ -n "$OVER" ]; then say "${RED}FAIL${NC} bundle budget (>450 kB):"; echo "$OVER"; FAIL=1
    else say "${GRN} OK ${NC} bundle budget: all routes <= 450 kB"; fi
  else
    say "${RED}FAIL${NC} bundle budget: no build log at $BUILD_LOG (run a build first)"; FAIL=1
  fi
fi

[ "$FAIL" -eq 0 ] && say "${GRN}SHIELD PASS${NC}" || say "${RED}SHIELD FAIL${NC}"
exit $FAIL
