# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: 2026-07-09 · HEAD = RESUME sync atop b3c1ef1 (E6.1b + dashboard fix) · UNPUSHED (origin 756d4fc, 8 ahead) · SHIELD PASS · clean tree

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
- E4.4 CORE HONESTY AUDIT DONE (7981d5d, +55/−640, verified HERE: grep-proof clean, SHIELD PASS,
  web+core tsc 0). Core mislabels removed: sc was Buffer-of-Thoughts (arXiv:2406.04271) mislabeled
  Self-Consistency/Wang-ICLR; tot is GTP Flash (parallel broadcast+quorum, original arch) mislabeled
  Yao-ToT; pas is Program-of-Thought (Chen 2022) mislabeled Plan-and-Solve. Fixed across index.ts,
  registry.ts, types.ts union+METHODOLOGY_INFO, selector.ts, tot headers, AND system-prompts.ts
  (RUNTIME strings sent to model — the fabrication-in-prompt class). Removed fabricated sc.ts metrics
  (estimatedToTTokens*8.3 / tokenSavings / comparisonToToT); parseDistillation tokensSaved now
  MEASURED. Retired 3 dead Opus-4.5 paths (Enhanced-BoT/CoD/Synthesis, all zero-caller). Doc rewrite,
  dist rebuilt clean. Registry keys sc/tot/pas + methodology literals + MetaBuffer.tokensSaved PRESERVED
  (web renders them) — relabel not re-key, freeze-safe. react.ts/tools ICLR citation is CORRECT (protected).
- core3 DONE (0bc7147): 5 final header/section-comment residuals rewritten to truthful (types.ts CoD/BoT
  metrics→attributed, GTP→broadcast+quorum; pas.ts +24%→"PoT paper reports"; selector.ts:288
  "SC (Self-Consistency)"→"SC (Buffer of Thoughts)"). HONESTY LANE FULLY CLOSED — zero known-false
  labels/metrics left in core. tsc 0, SHIELD PASS. (5th residual selector.ts:288 was found by a broader
  grep than E4.4's term list — lesson: honesty grep-proofs should include bare "Self-Consist"/"+NN%".)
- E4.5a DONE (68c376c, UNPUSHED pending localhost eyeball): CSP CONFLICT BUG fixed. Two disagreeing
  CSPs shipped — middleware.ts .set() OVERRODE on app paths (blocking deepseek/mistral/xai/coingecko/
  api.stripe there), next.config applied on middleware-excluded static paths (blocking openrouter/brave/
  sentry/openpanel there). NOT a header intersection (my hypothesis was wrong) — per-path override, 1
  header per path but different policy. Fix: single UNION CSP in next.config (sole source), middleware
  CSP removed (other 6 headers kept), dead 127.0.0.1:7242 dropped. SUPERSET-PROVEN (independent Python
  check: every old origin present, only 127.0.0.1 removed, ZERO additions → can only widen, cannot
  newly block). tsc/SHIELD PASS, live / = exactly 1 CSP header. 'unsafe-inline'/'unsafe-eval' KEPT.
- E4.6 DONE (8e990f5, UNPUSHED): methodology×route functional sweep harness
  (packages/web/scripts/methodology-sweep.mjs, reusable via `node scripts/methodology-sweep.mjs`).
  All 7 methodologies × 2 prompts through /api/simple-query = 14/14 PASS, dispatch fidelity clean
  (every non-auto cell returned the requested method — no silent swaps), auto routed compute→pas /
  reason→tot. Assertions verified rigorous (ok && answerLen>20 && !error; HTTP≠200 → FAIL). Harness
  in scripts/ = outside SHIELD console_log ratchet (held 103). Smoke test only — E4.7 is quality.
- E6.1a DONE (8e293e0, UNPUSHED): centralized the 4 exact-MODELS-match strings at 12 model-id sites
  (haiku→budget ×10, llama:free→free ×3 incl. provider-selector free returns + llm-extractor id:
  fields). Behavior-preserving (vitest 219 unchanged proves byte-identical). Excluded correctly:
  rate-table KEYS, models.ts def, ModelSelector UI values, __tests__ (cost-cascade .toBe is the
  independent guardrail — do NOT fold). llm-extractors import `MODELS as MODEL_IDS` (local const
  MODELS collision). opus-4-8/opus-4-6 had ZERO fold targets (only def/keys/tests). tsc 0, SHIELD PASS.
- E6.1b DONE (21aa88f + dashboard fix b3c1ef1, UNPUSHED — NEEDS Algoq localhost eyes: god-view/vision/
  consensus/chats changed model). Fixed Sonnet drift to tiers: Mother Base synthesis (tot-consensus:376
  + settings motherBase)→MODELS.premium (Opus); god-view lenses+chats, arboreal, tree-chat, x-video
  VISION, llm-extractor sonnet entries, anthropic fallback→MODELS.mid (NEW='claude-sonnet-5'). Added
  ADVISORS export {technical:deepseek-chat, strategic:mistral-small-latest, creative:grok-4.3} —
  centralized GTP advisors, normalized grok-3/grok-2→grok-4.3 (current EU flagship; grok-4.5 NOT EU
  until ~mid-Jul — parked upgrade). Verified: superset of intent, ZERO new literals, tiers correct,
  vitest 219 unchanged, SHIELD PASS. Rates UNTOUCHED (E6.1.1).

## NEXT STEPS (pick up here — recommended order)
1. E4.7 eval-bar rerun ≥85 — FREEZE WEEK (Aug 13 gate). `node scripts/eval-bar.mjs` (or `pnpm eval`
   in your terminal), Node 24, server :3000. DRY RUN 2026-07-09 = PASS 100/100 (floor 2/2, quality
   13/13, 0 ERRORED, independently artifact-verified from /tmp/akhai-eval.json) — 15pt margin, NO
   tuning needed. Official freeze-week rerun still REQUIRED at Aug 13 (dry run only de-risks it).
2. WEB-HONESTY SWEEP (NEW — user-facing, pre-launch) — core3 closed honesty in packages/core ONLY;
   web UI still mislabels methodologies with the false names/attributions E4.4 removed: dashboard/
   page.tsx:81/83/84 (sc="Self-Consistency"/"Multi-path voting", pas="Plan-and-Solve", tot="Tree of
   Thoughts"), explore/page.tsx:37 (full "Yao et al., NeurIPS 2023, explores...branches, evaluates and
   prunes" on a USER-FACING page), FunctionIndicators.tsx:55/91, IntelligenceBadge.tsx:39/41; simple-
   query log msgs :270/310 (internal, lower pri). Fix → sc=Buffer of Thoughts, tot=GTP Flash Consensus,
   pas=Program of Thought (mirror the registry). Same honesty-first principle, USER-FACING = arguably
   higher stakes than core. `go web-honesty`.
3. F4 — ban-story launch copy (with partner).

## PARKED CHIPS (don't lose)
- E4.5b (post-launch hardening, was going to be E4.5 nonce): drop 'unsafe-inline' via per-request
  nonce. Blocker is ONE first-party inline script (layout.tsx:48 — wallet-err suppress + randomUUID
  polyfill). Nonce MUST use Web Crypto (crypto.randomUUID), NOT Math.random (SHIELD ratchet=0). Keep
  'wasm-unsafe-eval' — Reown/WalletConnect need WASM; full 'unsafe-eval' removal risks Web3 auth,
  needs localhost wallet test. Report-only first, then enforce. Low urgency (single controlled inline).
- E6.1.1 (was parked) — sc.ts PROVIDER_RATES provider-keyed flat-Sonnet ($3/$15 for ALL anthropic);
  fix to per-model rates. Needs current per-model Anthropic pricing (Opus 4.8 $5/$25, Haiku $1/$5,
  Sonnet 5 = verify) + which model BoT calls. Split from E6.1b to avoid guessing pricing.
- E6.1.x diagnostic routes — test-key/test-providers/layer-test still pin sonnet-4-20250514/grok-3
  (unlisted in E6.1b, left per scope). Decide: fold to MODELS.mid/ADVISORS.creative OR remove (they're
  stale-pinned AND prod-exposed test endpoints — the prod-exposure is its own security question).
- quick-query getRecentQueries never SELECTs the `response` column it reads (runtime bug, own fix).
- dev-login 404 body is plaintext not native-HTML (cosmetic prober signal; post-launch).
- sc-multipath rematch (harder cases) · Fable rematch (if agentic surface) — post-launch.
- temperature: callAnthropic drops it — CONFIRMED no-op on Opus 4.8 (rejects non-default temp). Low.
- D2 retrieval (gated on box) · D1 router (cuttable) — decide at the Aug-8 hosting gate.
- crypto-webhook: already FIXED (was task_3ef8b1f1) — do not reopen.
- E4.3 verify findings (from re-check of 49207a1, all backlog not blockers):
  · living-tree owner rule is intentionally STRICTER than query/[id] (denies anon on owned convos).
    DO NOT "align it down" to match query/[id] — that reopens the anon-read hole. Keep as-is.
  · query/[id] + history/[id]/conversation allow anon read-any-by-id (getQuery unscoped when userId
    null). Decide: public-share-by-design or gap? Own security item, was NOT closed by E4.3.
  · in-memory `queries` Map (query-store.ts) returns response bodies BEFORE db owner-scope + never
    evicts (.set only, no .delete/TTL) → narrow cross-user read window until process restart. Low.

## ALGOQ'S DECISIONS (external, not engine work)
- HOSTING by Aug 8 (HARD gate): FlokiNET outage unresolved; Hetzner CX22 recommended. Also carries
  the Brave 2k/mo quota → SearXNG call. Unblocks D2, the guard box, NLI grounding.

## HARD DATES
Aug 8 hosting · Aug 13 FROZEN CORE (eval ≥85 gates it) · Aug 30 prod freeze+deploy · SEP 5 LAUNCH.
Position: ~5 weeks of buffer to freeze; only verification/polish remains; nothing risky unstarted.
