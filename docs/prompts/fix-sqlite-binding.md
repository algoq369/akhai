# Fix — better-sqlite3 binding missing → /api/* returning 500

Paste this block into `cc` from `~/akhai`.

---

Fix the missing better-sqlite3 native binding that's causing /api/simple-query, /api/depth-extract, /api/cognitive-signature to return 500. Dev server is running on :3000 but every DB-backed route fails.

SCOPE GUARD: This is a local env repair. No code changes. No commits. Only rebuild the native binding, clear the Next build cache, restart the dev server cleanly.

ROOT CAUSE: node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3/build/Release/better_sqlite3.node doesn't exist. The binding directory is missing entirely. Turbopack cached a build that expected the binding — every DB-touching route now throws "Could not locate the bindings file".

══════ STEP 1 — Kill dev server and clear cache ══════

  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 3
  cd packages/web
  rm -rf .next .turbo

Verify port is free:
  lsof -ti:3000
Expected: empty output.

══════ STEP 2 — Rebuild better-sqlite3 native binding ══════

  npm run predev

This runs the project's predev script which rebuilds better-sqlite3 against the current Node (v24.4.1). Watch for the Release/better_sqlite3.node being produced at the end.

Verify the binding now exists:
  ls -la node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3/build/Release/better_sqlite3.node

Expected: file exists, non-zero size. If the file is still missing, try explicit rebuild:
  npx node-gyp rebuild --directory=node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3

══════ STEP 3 — Start dev server cleanly ══════

  nohup bash -c 'set -a && source .env.local && set +a && SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000' > /tmp/akhai-dev.log 2>&1 &
  sleep 14

══════ STEP 4 — Verify the 3 failing endpoints now return 200 ══════

  echo "=== / ===" && curl -sI http://localhost:3000 | head -1

  echo "=== /api/simple-query ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST http://localhost:3000/api/simple-query -H 'Content-Type: application/json' -d '{"query":"test","methodology":"direct"}'

  echo "=== /api/depth-extract ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST http://localhost:3000/api/depth-extract -H 'Content-Type: application/json' -d '{"text":"test text for extraction"}'

  echo "=== /api/cognitive-signature ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST http://localhost:3000/api/cognitive-signature -H 'Content-Type: application/json' -d '{"query":"test query"}'

Expected:
  / → 200
  /api/simple-query → 200 (or 4xx if auth required, NOT 500)
  /api/depth-extract → 200 (or 4xx)
  /api/cognitive-signature → 200 (or 4xx)

If any still returns 500, dump the dev log to find the real cause:
  tail -60 /tmp/akhai-dev.log | grep -iE "error|failed|cannot" | head -20

══════ STEP 5 — Confirm Arboreal scaffold from commit 3facd58 is unaffected ══════

  git log --oneline -1
Expected: 3facd58 feat(arboreal): scaffold view mode toggle + empty ArborealView shell

  npx tsc --noEmit 2>&1 | tail -3
Expected: exit 0

  npx vitest run --reporter=dot 2>&1 | tail -3
Expected: 63/63 passing

══════ REPORT BACK ══════

- Did Release/better_sqlite3.node get created (ls result)?
- HTTP codes for / + the 3 API endpoints
- tsc exit code
- vitest result
- Any errors in /tmp/akhai-dev.log after the restart
- Confirmation I should re-test in browser: submit a query, verify response streams and doesn't show "Sorry, there was an error processing your query"

No commits. No code changes. Local env repair only.
