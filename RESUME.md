# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: 2026-07-11 · PUSHED through f5cf4f0 (origin synced, 23-commit day) · SHIELD green · ENGINE DONE + FULL UI-REFINEMENT ARC SHIPPED
> 2026-07-11 session: config-submit fix (a84ae0f) · config PROVEN to affect output (0.179 word-similarity) · reasoning-richer+grounding (025cd13/376b699) · dark-root fix (ac218ee) · reasoning-dedupe (c55f8fa/4660bf5) · smooth words (a8b34cc/fdce6d1) · words→blue block (50da2f3) · tot rows visible (2cc6b4c/372c5ba) · tot synthesis STREAMS (ebd5c63, any_types ratchet ↓131) · rows like direct (00c5680) · SIMPLE-TERMS: all live reasoning in plain language + tot roster row (f5cf4f0)
> OPEN CHIPS: failed queries stay status=pending (mark failed) · client crash if it recurs (need browser console) · canvas/history stale-darkMode · session_id fresh-install schema · eval-bar Node-24 vitest · off-peak advisor re-pin · E6.1 single-source rates
> CALENDAR: Aug 8 hosting decision · Aug 13 freeze rerun (formality, dry 100/100) · F4 launch copy (launch week) · Aug 30 prod freeze · Sep 5 LAUNCH

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

## FINAL REFINEMENT PLAN — ✅ COMPLETE 2026-07-10 (A✅ B✅ C✅ D✅ E✅ — engine DONE, frozen-core-ready)
RESULTS: A=9cb2bb3 (per-model pricing, 5 copies of flat-Sonnet bug killed; quick-query result col).
B=eaf9129 (4 surfaces truthful lineup incl. privacy disclosure). C=36451da (LOCK proven live:
anon/cross-user 404, owner 200; prod-gated diag routes; dead session_id branch removed; Map capped).
D=vision PROVEN (Sonnet 5 saw a real image, "Blue", HTTP 200 — no code needed). E=eval goldens
15/15 = quality 100/100 + honesty 2/2 (2026-07-10 official run); vitest 219 pass on Node 24;
sweep 14/14 (DB-reconstructed). NOTE: eval-bar prints FAIL because ITS vitest runs under the
Node-22/undici toolchain conflict — false negative, chip filed (run floor vitest on Node 24).
REMAINING (not engine): E3 Algoq manual pass · end-of-day 8-commit push · Aug 8 hosting decision ·
Aug 13 official freeze rerun (formality) · F4 launch copy (launch week) · Aug 30 prod freeze · Sep 5 LAUNCH.

## the original plan text (executed):
A. BUGS (fix first):
   A1 `go rates` — E6.1.1: core sc.ts PROVIDER_RATES is provider-keyed flat-Sonnet ($3/$15 for ALL
      anthropic) → Opus under-billed, Haiku over-billed in metrics. Fix to per-model; VERIFY current
      Anthropic pricing live before writing numbers. Reconcile vs web provider-selector.ts:255 table.
   A2 `go quickfix` — quick-query getRecentQueries reads `response` column it never SELECTs.
B. TRUTH POLISH (quick, user-facing):
   B1 `go labels` — 3 stale-provider spots: dashboard advisor cards (names/active-state vs new free
      advisors), privacy page (names providers that no longer receive queries), explore "Powered by" footer.
C. SECURITY PASS (the pre-freeze audit Algoq mandated): `go security`
   C1 query/[id] + history anon-read-any-by-id (getQuery unscoped when userId null) — DECIDE:
      public-share-by-design or close. C2 diagnostic routes test-key/test-providers/layer-test exposed
      in prod — gate behind NODE_ENV or remove. C3 memory: `queries` Map never evicts (+ returns
      bodies pre-scope); thought-stream crash-orphan buffers lack TTL sweep. C4 (optional cosmetic)
      dev-login plaintext-404 vs native.
D. VERIFY UNTESTED:
   D1 `go vision` — x-video-analysis endpoint with a REAL image (Sonnet-5 vision swap never exercised).
   D2 off-peak: retry qwen3-next/gemma-4 free slugs for the strategic advisor pin (noted in models.ts).
E. FINAL TEST → FROZEN CORE (Aug 13):
   E1 official `node scripts/eval-bar.mjs` ≥85 (dry run 2026-07-09 = 100/100). E2 rerun
   methodology-sweep.mjs (was 14/14). E3 Algoq manual pass on every surface (all 7 methodologies,
   god-view, trees, consensus, vision, history). PASS ⇒ freeze; fixes-only after.
GATES: Aug 8 hosting decision (FlokiNET vs Hetzner, external) · Aug 30 prod freeze · Sep 5 LAUNCH.
PARKED (not engine): F4 launch copy w/ partner (Fable-ban sovereignty story, launch week) · E4.5b CSP
nonce (post-launch) · live-reasoning Part 2 answer-streaming refactor (design call).

## PREVIOUS NEXT-STEPS (superseded by the plan above — kept for context)
1. E4.7 eval-bar rerun ≥85 — FREEZE WEEK (Aug 13 gate). `node scripts/eval-bar.mjs` (or `pnpm eval`
   in your terminal), Node 24, server :3000. DRY RUN 2026-07-09 = PASS 100/100 (floor 2/2, quality
   13/13, 0 ERRORED, independently artifact-verified from /tmp/akhai-eval.json) — 15pt margin, NO
   tuning needed. Official freeze-week rerun still REQUIRED at Aug 13 (dry run only de-risks it).
2. FREE CONSENSUS DONE (3 commits, UNPUSHED pending Algoq browser check → push together):
   · 8c2084d — advisors on FREE OpenRouter slugs (3 labs), openrouter/free auto-router fallback
     (+402 trigger, live-justified), zero-advisor 502 guard, $0 advisor COGS rows, helpers split to
     lib/openrouter.ts + consensus-scoring.ts. Consensus REAL for the first time (was single-Opus).
   · 69d6f3d — 9-MIN HANG fixed: clearTimeout moved AFTER json() (congested free upstreams trickle
     bodies unbounded — observed 9-15min), advisor budget 60s→35s fail-fast, tot's mid-pipeline
     'complete' emit → non-terminal 'analysis' (was closing client SSE + freeing buffer while
     guard/save still ran). Same query 9+min → 86s.
   · cadd6bc — refine: round 2 gated on FULL round 1 (degraded round 2 = 0% twice, pure waste) +
     honest skip emit; strategic pin nemotron(dead 3/3)→cohere/north-mini-code:free (only third-lab
     slug answering 2026-07-10; qwen3-next/gemma-4 = off-peak re-pin candidates, noted in models.ts);
     advisor timeouts/failures NARRATED on panel (emitTotAdvisorMiss); strongest-round synthesis
     (later rounds win ties — full R1 no longer dropped for degraded R2).
   VERIFIED HERE worst-case live: 1/3 advisors under congestion → misses narrated, round-2 skip line,
   synthesis delivered, 131s, saved. FREE-TIER REALITY: quality degrades at peak (auto-router subs,
   thin answers) — functional+honest+bounded, not premium. Cosmetic chips from cc review: dashboard
   advisor cards mislabeled/inactive, privacy page names old providers, explore "Powered by" footer.
3. Live-reasoning PART 2 (optional, design call) — b6beee5 fixed the DROPPED-EVENTS race (buffer+replay
   in thought-stream pub/sub, verified live: 2s-late SSE connect replays full backlog; tot now emits
   honest calling/complete around its blocking consensus). Reasoning panel now always populates. STILL
   TRUE: the ANSWER itself doesn't stream (useQueryHandlers.ts:401 blocking res.json(), ProcessingIndicator
   while isStreaming&&!content) — "0 chars" until completion is by-architecture. Streaming the answer
   text = bigger refactor (SSE/chunked response path), separate decision. Residual: crash-before-terminal
   leaves its ≤300-event buffer unfreed (no TTL sweep) — tiny, belt-and-braces later.
4. F4 — ban-story launch copy (with partner).

## PARKED CHIPS (don't lose)
- SESSION FINDINGS 2026-07-09 (from log verification of E6.1b on localhost — dev log /tmp/akhai-dev.log):
  · E6.1b RUNTIME: Sonnet 5 CONFIRMED working (arboreal-chat + god-view/council = 7 successful
    claude-sonnet-5 calls, 200 OK). SC→Opus confirmed. grok-4.3 UNVERIFIED + Vision(Sonnet 5)
    NOT EXERCISED (see below). E6.1b is NOT a regression — safe to push; Sonnet 5 part proven.
  · [IMPORTANT] TOT CONSENSUS NOT ACTUALLY RUNNING: /api/tot-consensus 500s EVERY time with
    "No AI providers configured" → falls back to single Opus. Cause: XAI_API_KEY, DEEPSEEK_API_KEY,
    MISTRAL_API_KEY all ABSENT from .env.local. So the multi-AI consensus (Grok/DeepSeek/Mistral
    advisors + Mother Base) — a HEADLINE feature — is silently single-Opus. grok-4.3 unverifiable
    until XAI key added. ACTION: (a) add advisor keys to dev, re-run TOT to verify grok-4.3 + consensus;
    (b) CONFIRM PROD has these keys or consensus is degraded at launch too.
    DECISION 2026-07-09: FREE-ONLY advisors (Algoq: no paid APIs). Grok=PAID ($1.25/$2.50 per M; $25
    signup credit 30-day; $150/mo only via DATA-SHARING = xAI trains on our queries = anti-sovereignty)
    → DROP Grok, remove ADVISORS.creative from constant. DeepSeek also paid (cheap, not free). Consensus
    route hardcodes only 3 providers (deepseek/mistral/xai in PROVIDERS block, checks their keys).
    OLLAMA not wired anywhere + CAN'T run on €11 VPS (no GPU) → dev-machine only until sovereign-GPU
    (Q1 2027), NOT launchable. OPENROUTER_API_KEY IS SET → cleanest free path = rewrite consensus to
    OpenRouter :free models (Llama/Qwen/DeepSeek-R1 free, $0, no new keys, but data via US OpenRouter).
    Mistral free tier (EU) = quickest test (free key, NO code change, 1 advisor + Opus synth). Consensus
    NOT broken for users (Opus fallback returns real answers) → side-lane, NOT a launch blocker.
  · [RESOLVED 2026-07-09] react "opus-4-8 404 → free Llama" was a STALE DEV-BUILD artifact, NOT a code
    bug. Clean rebuild (rm -rf .next .turbo + restart) → react uses premium Opus correctly (verified 2×
    via curl: model=claude-opus-4-8, ~$0.005/query, ZERO fallback). Current source is fine; PROD builds
    clean (deploy runs rm .next .turbo) so unaffected. LESSON: dev server accumulates stale turbopack
    cache — clean-rebuild before trusting any "it's broken in dev" observation. OBSERVABILITY GAP
    (minor, unfixed): the premium→free fallback is SILENT — a premium failure returns free-tier with
    no signal, which is what MASKED this. Consider surfacing fallback events to logs/UI (parked).
  · Video/URL in main query box = sc/search/Opus, NOT the x-video-analysis vision endpoint — so the
    Sonnet-5 vision swap is untested; needs the actual vision entry point to verify.
  · [UX] Live reasoning stream not always visible (sat at "ANALYZING… 0 chars") — user wants it ALWAYS
    visible regardless of methodology selected. Real fix.
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
