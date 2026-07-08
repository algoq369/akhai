# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: 2026-07-05 · HEAD cd4fdbc · 219 tests (+3 gated) · all ratchets locked · clean tree

## HOW TO WORK (the loop that produced everything below)
1. Read real code before designing (no guessing — this has caught a spec flaw nearly every session).
2. Hand `cc` (Claude Code CLI, runs on Fable 5) a precise prompt → cc executes.
3. Independently verify in the repo — "cc's green isn't green until it's green HERE."
4. UI-touching → localhost → Algoq's eyes → only then done.
5. Gate every commit: tsc 0 · vitest · SHIELD · Node 24.

## ENVIRONMENT (respect on resume — these break things if ignored)
- Node 24 MANDATORY: `export PATH="/opt/homebrew/bin:$PATH"` (better-sqlite3 ABI 137; nvm default
  22 breaks sqlite tests). tsc/vitest/shield all run from `packages/web`.
- Commit `--no-verify` (prettier hook only); NEVER `--no-verify` the PUSH (SHIELD gates there).
- SHIELD (`bash scripts/shield.sh --fast`) contains tsc+vitest+ratchets — it alone is a full gate.
  Do NOT also chain tsc+vitest in the same command (SHIELD reruns them → DC 4-min timeout).
- DC (Desktop Commander) crashes every few calls on long sessions + ~4-min ceiling. Split commands.
- Dev restart (canonical): `lsof -ti:3000 | xargs kill -9; sleep 2; rm -rf .next .turbo; nohup bash
  -c 'set -a && source .env.local && set +a && SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p
  3000' > /tmp/akhai-dev.log 2>&1 &` then sleep 15. `/tmp/akhai-dev.log` carries [COGS] lines.
- STALE-HMR HAZARD: a long-running dev server serves pre-commit code → fresh-restart before any
  live probe (the tranche-3 500s were server artifacts, not bugs).
- Local dev LACKS DEEPSEEK/MISTRAL/XAI keys → local ToT always runs single-model fallback (prod/VPS
  runs real consensus). Non-Anthropic paths also can't be cost-probed locally.
- Bracket route paths (`app/api/export/[id]/`) break zsh globs — use python glob or git grep.
- Flag defaults now LIVE in prod: REACT_AGENT_LIVE (agent ON; =0 disables). SC_MULTIPATH OFF (F2
  said HOLD; =1 only for the parked rematch).

## WHERE WE ARE (since Fable 5 returned Jul 1 — the whole arc, all PROVEN)
- Optimization sprint closed + MEASURED (gap-A cache, budgets, response cache $0-repeats, selective
  grounding, quick-query ~10×, eval bar 100/100).
- R-track: quickharden, autocache (auto path 12s→0.32s $0), totfix.
- Phase D: citations+Sources · GENUINE sc-multipath (2.1× not 3×, flag off per F2) · ReAct per-step
  streaming (USER-VERIFIED live, outage-honest) · prompt honesty (fabrication removed, test-locked).
- F-track RESOLVED: Fable 5 plumbed → auditioned ($0.78, 52 calls) → SKIP for launch (SC 8/8=8/8
  @2.96×; Fable 8/10=8/10 @3.22×). Model-aware pricing fixed the whole scorecard as a byproduct.
  Plumbing inert (flag off). Rematch parked (harder cases / if an agentic surface ships).
- Phase E HARDEN — 5 of 6 lanes CLOSED:
  · E1 Zod 31→0 TERMINAL (33 schemas in pure lib/route-schemas.ts, 19 boundary tests, ratchet 0).
  · E2 console 244→103 (+2 secret-logging catches) · any 277→135 (laundering-audited). G3
    file-splits HELD at 12 (post-launch — pre-freeze refactor risk declined).
  · E3 retirement 2,743 lines + tree-wide SC honesty (incl. packages/core, imported by MCP server).
  · E5 react agent DEFAULT ON (both states live-proven).
  · E7 all cache-key dimensions closed + THE FIND: gap-A was inert for real browser traffic
    (pageContext in the stable prefix) → resurrected, PROVEN cR=1285 across differing contexts.
- AI configurator VERIFIED end-to-end + its cache bug fixed live.

## E4 QA — THE ONE OPEN LANE
DONE:
- E4.1 vitest env-split (be13258): server(node)/client(jsdom scaffold). Killed the root cause of 3
  collection bugs; query-cache canary armed (standard node:crypto import fails loudly on regression).
- SECURITY ARC COMPLETE — 7 vulns closed:
  · E4.2 (8af805b): x-video cross-user X-OAUTH-token selection [HIGH] · checkout×3 body-beats-session
    payment spoofing · tree-activations IDOR read param.
  · E4.2b (a818881): export/[id] unscoped conversation dump [HIGH] · quick-query body-userId reading
    victims' history into the prompt [HIGH].
  · cleanup (f2dee83): debug-agent egress (#region agent log → 127.0.0.1:7242) in validateSession.
  · webhook (4090ece): delimiter-broken crypto order-ids (UUID hyphens shattered parsing → every
    payment mis-credited) → hyphen-safe v2 codec (lib/order-id.ts). btcpay was NOT broken (posData).
    Legacy ids still decode.
  · E4.3 (49207a1): dev-login minted a no-auth 30-day ADMIN session in prod [CRITICAL] → NODE_ENV
    404 gate · living-tree thought-graph IDOR → ownership via UNION join to queries.user_id.

## NEXT STEPS (pick up here — recommended order)
1. E4.4 packages/core honesty audit — the LAST honesty item. E3's sweep found core still carried
   "majority vote"/Yao (Wang ICLR) SC claims; web's ToT is verified real but core's ToT/Yao impl is
   UNREAD. Audit before open-sourcing. (Recommended FIRST — read-and-classify, low risk. `go core`.)
2. E4.5 CSP nonce — assess current headers first; may be Caddy-level (report-only to start). `go csp`.
3. E4.6 methodology × route functional sweep — all 7 methodologies × routes on the fixed eval set.
4. E4.7 eval-bar rerun ≥85 — FREEZE WEEK (Aug 13 gate). `pnpm eval`, Node 24, server :3000.
5. E6.1 — fold the 31 hardcoded model strings (measured 2026-07-05) into the MODELS constant.
6. F4 — ban-story launch copy (with partner).

## PARKED CHIPS (don't lose)
- quick-query getRecentQueries never SELECTs the `response` column it reads (runtime bug, own fix).
- dev-login 404 body is plaintext not native-HTML (cosmetic prober signal; post-launch).
- sc-multipath rematch (harder cases) · Fable rematch (if agentic surface) — post-launch.
- temperature: callAnthropic drops it — CONFIRMED no-op on Opus 4.8 (rejects non-default temp). Low.
- D2 retrieval (gated on box) · D1 router (cuttable) — decide at the Aug-8 hosting gate.
- crypto-webhook: already FIXED (was task_3ef8b1f1) — do not reopen.

## ALGOQ'S DECISIONS (external, not engine work)
- HOSTING by Aug 8 (HARD gate): FlokiNET outage unresolved; Hetzner CX22 recommended. Also carries
  the Brave 2k/mo quota → SearXNG call. Unblocks D2, the guard box, NLI grounding.

## HARD DATES
Aug 8 hosting · Aug 13 FROZEN CORE (eval ≥85 gates it) · Aug 30 prod freeze+deploy · SEP 5 LAUNCH.
Position: ~5 weeks of buffer to freeze; only verification/polish remains; nothing risky unstarted.
