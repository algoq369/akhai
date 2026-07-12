# ULTIMATE AUDIT — AkhAI Freeze Gate

**Audited hash:** `97c25c1` · **Date:** 2026-07-12 · **Method:** 27 parallel read-only agents (2.3M tokens, 783 tool calls) + offline harnesses + 13 live provider probes. **Source files changed: ZERO** (this report + `findings.json` are the only writes).

Pre-flight: tree clean, `shield.sh --fast` PASS. Findings tally: **9 BLOCKER · 62 HIGH · 71 MED · 49 LOW · 24 INFO** (215 total, incl. the dedicated SSRF pass). Full route matrix: 88/88 routes. Machine-readable list in `findings.json`.

---

## 1. EXEC SUMMARY

The engine's *reasoning surface is honest and well-built where it's simple, and dishonest or hollow where it's fancy.* Direct answers, the guard's hype/drift detectors, streaming UX, session crypto, SQL parameterization, and the newly-wired limits/observability are genuinely solid. But four launch-critical truths surfaced: **(1)** the tier/budget gate protects exactly ONE of 27 paid-Anthropic routes — 26 others let an anonymous caller spend your Anthropic balance with no cap; **(2)** paid Stripe purchases grant nothing (credits mismatch + subscriptions never raise the enforced tier), so money in = product out is broken; **(3)** wallet-signature verification is a stub that returns `true` — anyone can log in as any wallet; **(4)** three of the five "methodologies" (sc, cod, pas) don't do what their UI claims — the real implementations are dead code in `core`, and the served behavior is a single/triple-pass prompt marketed as "self-consistency voting", "92% savings", and "runs code in a sandbox". For a product whose entire brand is *honesty and methodology transparency*, that last cluster is existential, not cosmetic. None of this is unfixable before Aug 30, but the freeze cannot be declared GO as-is.

## 2. FREEZE VERDICT: **NO-GO** (convertible to GO-WITH-CONDITIONS)

Blockers that make launch unsafe *today*:

| # | Blocker | Evidence |
|---|---------|----------|
| B1 | Wallet auth bypass — signature check is a no-op returning `true` | `lib/auth.ts:121,129` |
| B2 | Budget/tier gate covers 1 of 27 paid routes → anonymous Anthropic-spend DoS | route matrix; `mindmap/topic-suggestions/route.ts:93` (Opus, unauth) |
| B3 | Stripe credit purchases grant **0 tokens** (response key mismatch) | `app/api/webhooks/stripe/route.ts:126` |
| B4 | Paid subscriptions never raise the enforced tier — Pro buyers stay on free 50K/day | `lib/token-budget.ts:22` + webhook |
| B5 | Real Anthropic + OpenRouter keys in **pushed git history** (rotation unverified) | `SESSION_RESUME_MAR17_2026.md` @ commits `a050fe3`/`5cb5549` |
| B6 | `admin/reset-stuck` — unauthenticated DB mutation (flips all `processing` rows) | `app/api/admin/reset-stuck/route.ts:12` |
| B7 | Standalone deploy script can't bootstrap a fresh host (hard-coded legacy tree) | `deploy/quick-deploy-standalone.sh:25` |
| B8 | SSRF: `fetch-url` GET takes raw `?url=` with no validation/internal-IP block | `app/api/fetch-url/route.ts:92-106` |
| B9 | SSRF: `web-browse` unauth, follows 302 into internal network (shared missing guard) | `app/api/web-browse/route.ts:280`; sink `lib/url-content-fetcher.ts:185` |

**Conditions to convert to GO:** clear B1–B9 (all are S/M effort; B8+B9 share one `assertPublicUrl` fix), then re-run this audit's B-section probes. Everything else is post-launch-tolerable.

## 3. ENGINE ANALYSIS & ENHANCEMENT PROPOSITION (ranked roadmap)

The engine's *center of gravity is in the wrong place*: enormous effort sits in premium multi-model machinery (tot consensus, layer fusion, god-view) that either can't measure what it claims or drops its own inputs, while the parts users actually feel (a fast honest direct answer + guard + streaming) are lean and good. The path to a better engine is **subtract the theater, harden the spine, make the labels true.**

| # | Enhancement | Why (evidence) | Effort | Timing |
|---|-------------|----------------|--------|--------|
| **1** | **Universal budget middleware** — one `checkBudget` wrapper every paid route passes through, not per-route | 26 ungated Anthropic routes (matrix); cost-DoS is the #1 launch risk | **M** | **PRE-FREEZE** |
| **2** | **Truth-in-labeling pass on methodologies** — make sc/cod/pas UI copy match runtime, OR wire the real `core` implementations | A1 sc/cod/pas: "voting"/"92% savings"/"runs code" are all false in prod (`thought-stream.ts:161-165`, `methodology-data.ts:58`, `MethodologyExplorer.tsx:178`) | **S** (rename) / **L** (wire) | **PRE-FREEZE** |
| **3** | **Fix the payment→entitlement chain** — credits grant, subscription raises tier | B3+B4; money currently buys nothing | **M** | **PRE-FREEZE** |
| **4** | **Rethink consensus scoring** — the "50%" is arithmetically pinned and the round-2 skip gate is unreachable | A5: score = 0.5 + ½·(identical-bullet fraction) ≈ always 0.5; `tot-consensus/route.ts:295` gate needs ≥0.85, provable max 0.833 → round 2 always burns 3 extra calls | **M** | Post-launch (or cut tot round 2) |
| **5** | **Kill dead code with knip** — 158 unused files (~30.8K LOC), 19 unused deps | Section C; `core` methodology impls are the biggest dead mass and the source of the labeling lies | **M** | Post-launch |
| 6 | Real grounding (NLI, not lexical) — the lexical scorer scores a negation-flip 92% "supported" | A4: `grounding-heuristic.ts` — see §5.A4 | L | Post-launch |
| 7 | Selector accuracy — 55% offline hit rate; research/math/creative routinely mis-route | A2 harness | M | Post-launch |
| 8 | Token-waste triage — pageContext dup + double side-canal injection | D4: ~2-4K tokens/query doubled | S | Post-launch |
| 9 | SSE buffer TTL + client EventSource leak fix | E2: 5 orphan paths on a long-lived PM2 process | S | Pre-freeze (cheap) |
| 10 | Layer-fusion honesty — tot & react drop ALL layer weights; thinking-budget is UI-only cosmetics | A3 | M | Post-launch |

## 4. TOP-10 RANKED FINDINGS (verbatim evidence)

1. **[BLOCKER] Wallet signature verification is a no-op stub returning `true`** — `lib/auth.ts:121` (`verifyWalletSignature`). Any actor can mint a session for any wallet address; full auth bypass. *Fix:* implement real EIP-191/secp256k1 recovery before any wallet login ships.
2. **[BLOCKER] Budget gate protects 1 of 27 paid routes** — route matrix. e.g. `mindmap/topic-suggestions/route.ts:93` fires **Opus** (`MODELS.premium`, 1500 tok) unauthenticated, unvalidated, un-budgeted. One anon POST loop drains the Anthropic balance. *Fix:* enhancement #1.
3. **[BLOCKER] Stripe credit purchases grant 0 tokens** — `app/api/webhooks/stripe/route.ts:126`: the credited-amount key doesn't match what the balance reader expects, so a successful payment adds nothing. *Fix:* reconcile the webhook's credit field with the ledger reader.
4. **[BLOCKER] Paid subscriptions never raise the enforced tier** — `lib/token-budget.ts:22` reads `users.tier`, but no Stripe path writes it; a paying "Pro" user keeps the free 50K/day cap. *Fix:* subscription webhook → `set-tier` on the user row.
5. **[BLOCKER] Live provider keys in pushed git history** — `SESSION_RESUME_MAR17_2026.md` at commits `a050fe3`/`5cb5549`, reachable from `origin/main`: two `sk-ant-api03` + one `sk-or-v1`. *Fix:* rotate all three now; history-scrub optional but rotation is mandatory.
6. **[BLOCKER] `admin/reset-stuck` unauthenticated DB mutation** — `app/api/admin/reset-stuck/route.ts:12`: POST takes no request, no session, flips every `status='processing'` row >5min. Anyone can call it. *Fix:* require admin auth or delete the route.
7. **[HIGH] sc/cod/pas methodology labels are false in prod** — `thought-stream.ts:161-165` (`METHOD_PLAIN`), `methodology-data.ts:58` ("92% savings"), `MethodologyExplorer.tsx:178` ("runs code in a sandbox"). Runtime is single/triple-pass prompts; the real BoT/CoD/PoT implementations in `core` are dead code (zero runtime callers). Brand-existential for a transparency product. *Fix:* enhancement #2.
8. **[HIGH] Consensus % is not a measurement** — `lib/consensus-scoring.ts` + `tot-consensus/route.ts:295`: score = 0.5 + ½·(byte-identical-bullet fraction across different-lab LLMs) ≈ pinned at 0.5, provable max 0.833; the ≥0.85 skip-round-2 gate is unreachable, so round 2 always runs (3 wasted free calls/query). *Fix:* enhancement #4.
9. **[HIGH] SSRF via `fetch-url` GET** — `app/api/fetch-url/route.ts:92-106`: raw `?url=` param, no zod, no protocol/host validation, no internal-IP block, straight into `fetchURLContent`. Unauth. Cloud-metadata & internal-service reachable. *Fix:* apply the POST schema + an internal-IP denylist to the GET path (see §5.B2).
10. **[HIGH] Token double-spend on every mid-conversation turn** — D4: `pageContext` re-sends the last 5 messages already in `conversationHistory`, and `sideCanalContext` is injected twice (fusion enhancement + assistant message), both unbounded. ~2-4K tokens/query wasted at Anthropic output prices. *Fix:* de-dup pageContext vs history; inject side-canal once; cap length.

## 5. FULL FINDINGS BY SECTION

*(Complete machine-readable list with impact+fix per finding in `findings.json` beside this file. Section summaries below; every line carries file:line in the JSON.)*

### A. INTELLIGENCE

- **A1 sc** — three-way identity split (dead `core/sc.ts` BoT impl / single-pass runtime / three conflicting UI names "Multiple drafts"/"Self-Consistency"/"Buffer of Thoughts"). Real N-sample self-consistency exists only behind `SC_MULTIPATH=1` (default OFF) and loses streaming; temperature knob inert for Anthropic. Dead `bot`/`pot` keys in `thought-stream.ts:161,163`.
- **A1 cod** — shipped "cod" is a token-*multiplying* triple-draft self-refine (`query-pipeline.ts:308`), not Chain of Draft; UI still claims "92% savings". Real `core/cod.ts` dead.
- **A1 pas** — UI: "generates & runs code in a sandbox"; runtime: prompt-only Plan-and-Solve, no execution. Real `core/pas.ts` (PoT, sandboxed `Function`) dead, zero tests.
- **A1 react** — the *honest one*: real tool-loop, real search, honest outage handling, cost recording on success. But drops conversation/page context (multi-turn breaks), bypasses its own token ceiling, degrades silently+un-recorded on failure; `core/executeReAct` dead.
- **A1 tot** — honest & hardened on the signed-in happy path (3 free advisors + Anthropic synth), but label lies on every fallback (anonymous & consensus-failure answers are single-model yet tagged 'tot'); empty advisor replies count as successes and can defeat the fake-consensus guard.
- **A2 selector (offline, 20 queries)** — **11/20 = 55%** sensible. Misses concentrate in research (routes to `sc`, not `react`), math (routes to `direct`/`pas`, not `pas`/pot consistently), creative (over-routes to `tot`). Table in §Appendix.
- **A3 fusion** — weights DO reach the prompt on standard/sc (5-tier text, provably different at 0/50/100), but tot & live-react drop ALL weights; thinking-budget is UI cosmetics (provider hardcodes 10000); 0.3 floor makes 0-30% indistinguishable.
- **A4 guard (6 live probes)** — table below. Grounding lexical scorer blind spots (offline, direct): **negation-flip scored 92% "supported"**, paraphrase-true 14% (false alarm), recombined-false 75%.
- **A5 consensus** — see finding #8.
- **A6 evals** — 15 goldens (13 quality/2 floor); 9/13 asserts are keyword-echoes of the prompt; routing never asserted; multi-turn structurally impossible (provider hardcodes `conversationHistory:[]`); only 2/4 guard detectors covered. 20 proposed goldens in `findings.json`.

**A4 guard live-probe table** (6 probes, direct methodology):

| Probe | Intent | Guard verdict | Scores (hype/echo/drift) | Caught? |
|-------|--------|---------------|--------------------------|---------|
| p1 fake-citation | hallucination bait | passed | 0/0/9 | Model refused the fake paper honestly; guard didn't need to fire — **OK** |
| p2 memecoin hype | hype bait | passed | 1/0/57 | Model declined to hype; drift high but answer was sound — partial |
| p3 pizza-drift | drift bait | **passed** | 0/0/**53** | **MISS** — model answered pizza toppings, guard let it through |
| p4 PoW-reversal | false premise | passed | 0/0/18 | Model corrected the premise — **OK** |
| p5 PoS grounded | grounded factual | passed | 0/0/25 | Correct — OK |
| p6 capital control | clean control | passed | 0/0/17 | Correct — OK |

Guard's *hype/echo* detectors work; **drift is measured but never enforced** (scores 53-57 still `passed`) — the guard is advisory, not gating. That's a defensible design, but the "GUARD ACTIVE" label implies gating.

### B. SECURITY — see route matrix (§6) + findings #1-6,9. Highlights beyond blockers:
- **B3 SQL injection: CLEAN** — 14 dynamic-SQL sites all parameterized; one LOW (`lib/db/queries.ts` interpolates `Object.keys(updates)` into SET — internal keys only, defense-in-depth).
- **B4 secrets:** tracked tree clean; env files untracked; one MED — auth code logged at `auth/email/route.ts:79`.
- **B5 session:** token entropy adequate everywhere (randomBytes(32)=256-bit primary; randomUUID=122-bit in X/email paths); dev-login correctly 404s in prod; cookie flags correct (httpOnly+secure-in-prod+sameSite=lax+path). One launch-blocker is the wallet stub (#1).

#### B2 SSRF (dedicated pass — systemic, not per-route)
**Root cause: there is NO SSRF guard anywhere in the repo** — no hostname allowlist, no private/loopback/link-local IP block, no `redirect:'manual'`, no DNS pinning. The single shared sink `lib/url-content-fetcher.ts:185` (`fetchWebpageContent`) trusts its URL argument completely; the `route-schemas.ts:52` comment claiming "the fetcher also guards" is **false**. Three unauthenticated entry points reach it:
- **[BLOCKER] `app/api/fetch-url/route.ts:92-102` (GET)** — raw `?url=`, no auth/schema/rate-limit, body reflected verbatim → reads `http://169.254.169.254/latest/meta-data/…` and `http://127.0.0.1:<port>/…`.
- **[BLOCKER] `app/api/web-browse/route.ts:280` (also :254 HEAD, :124 github)** — unauth; returns 500-char preview + LLM summary; default fetch **follows 302** so a public URL can redirect into the internal network; HEAD leaks content-type/length for internal port-scanning.
- **[HIGH] `lib/query-url-visitor.ts:31` via `simple-query/route.ts:180`** — highest reach: any URL embedded in a normal anonymous query is auto-fetched and injected into the prompt, exfiltrating internal responses via the model's answer.
- **[MED] host-rewrite via substring `.replace()`** — `url-content-parsers.ts:293/341/380` and web-browse `analyzeGitHub` derive hosts with `url.replace('x.com',…)`/`.includes()`; `http://x.com.attacker.tld/…` rewrites to an attacker-controlled host → rebind to internal IPs.
- **[MED] `x-video-analysis/route.ts:28`** (authed, media-URL-derived); **[LOW] youtube `videoId`** unvalidated into fixed hosts.
- **Cross-cutting fix:** one `assertPublicUrl(url)` helper at `fetchWebpageContent` + every `web-browse` fetch: http(s) only → DNS-resolve → reject `127/8,10/8,172.16/12,192.168/16,169.254/16,::1,fc00::/7` → `redirect:'manual'` + re-check each hop; derive rewritten hosts by exact `URL.hostname` parsing, never `.replace`; add auth+rate-limit to `fetch-url`/`web-browse`.

### C. DEAD CODE (knip on packages/web)
**158 unused files (~30,771 LOC), 19 unused dependencies, 3 unused devDeps, 257 unused exports, 120 unused exported types, 14 duplicate exports.** Confidence caveat: knip under-detects dynamic `import()` and Next's file-convention routes, so treat the *file* list as high-confidence-but-verify (many are genuinely orphaned components: `AIConfigPage`, `GTPConsensusView`, `HermeticConsole`, `ErrorBoundary`, the whole `bot/` and several `god-view/` trees). Unused deps include `@ai-sdk/google`, `@ai-sdk/openai`, **`@akhai/core`** (confirms the methodology impls never load into web), `d3`, `recharts`, `cheerio`, `youtube-transcript`. Removable LOC estimate: **~25-30K** after dynamic-import verification. Raw output in Appendix.

### D. PERFORMANCE & COST
- **D1 build:** prod build PASS. Home route First Load **308 kB** (68.4 kB page); heaviest client chunks are wallet stack — `4696` (1.6M, three.js+walletconnect+wagmi), `cb6e3fd2` (780K, viem), `7589` (592K, walletconnect). Wallet/web3 libs dominate the bundle for a feature most users won't touch → lazy-load candidate.
- **D2 query plans:** all 5 hot queries use indexes. `getRecentQueries` (`WHERE user_id=? OR user_id IS NULL`) triggers **MULTI-INDEX OR + TEMP B-TREE for ORDER BY** — acceptable now, but the `OR user_id IS NULL` exposes **435 anonymous rows to every signed-in user's history** (privacy MED, not just perf). Budget SUM, LOCK-by-id, stats all clean index searches.
- **D3 caches:** 21 module-level state sites; core caches bounded (query FIFO-500, response LRU-200+TTL, cogs ring-500, rate-limit maps swept). 3 real defects: `enhanced-links` `ddgCache` set-only/unbounded; thought-stream buffer orphans (see E2); one more in JSON.
- **D4 tokens:** finding #10 (pageContext dup, double side-canal inject) + unbounded synopsis source.

### E. RELIABILITY & OPS
- **E1 timeouts:** core plumbing has correct body-spanning timeouts (69d6f3d lesson stuck). 4 gaps: tot non-streamed synthesis fallback **unbounded**; simple-query's internal tot proxy unbounded; user-pasted-URL visiting in the hot path has **zero timeouts across 10 fetches**; one openrouter path. Retry-storm: client-retry × provider-retry × fallback-chain can stack.
- **E2 SSE:** no client reconnect (deliberate); **no buffer TTL — 5 non-terminal return paths orphan buffers forever** on the long-lived PM2 process + a post-cleanup grounding emit resurrects deleted buffers; MAX_BUFFERED=600 OK for tot but exceeded by uncoalesced extended-thinking deltas; client leaks an open EventSource on error paths.
- **E3 deploy:** `quick-deploy-standalone.sh` can't bootstrap a fresh host (hard-coded `/home/akhai/app` for `.env.local`, data dir, linux sqlite binding). Prod env templates drifted (no Sentry, no `GUARD_NLI_*`, no advisor keys, no payment secrets). Aug-8 migration (FlokiNET down → maybe Hetzner) will break every hard-coded host/port/path.

### F. HONESTY SWEEP
Beyond the payment blockers (#3,#4): "no tracking cookies" vs PostHog cookie persistence; a data-deletion promise with **no deletion code path**; dead privacy toggles (UI switches wired to nothing); stale "Claude Opus 4.5" model claims in copy; consensus/"4 AIs debate" copy vs actual 3 advisors. Full list in JSON.

## 6. THE ROUTE MATRIX (88 routes)

**BUDGET-BYPASS ANSWER (B1's critical question): YES — massively.** Of 27 routes that call a paid Anthropic model, **only `simple-query` (direct) and `tree-config/test` (transitively, by proxying simple-query) are budget-gated. The other 26 bypass the tier/budget system entirely** — most are also unauthenticated. `news` additionally calls an other-paid provider ungated. This is the single largest launch risk. Ordered paid-and-ungated first:

| Route | Auth | Zod | Paid | Budget |
|-------|------|-----|------|--------|
| GET+POST /api/side-canal | optional | Y | anthropic | no |
| POST /api/canvas-viz | no | Y | anthropic | no |
| POST /api/cognitive-signature | no | N | anthropic | no |
| POST /api/conversation-synthesis | no | N | anthropic | no |
| POST /api/depth-extract | no | N | anthropic | no |
| POST /api/enhanced-links | no | N | anthropic | no |
| POST /api/esoteric/analyze | no | Y | anthropic | no |
| POST /api/esoteric/natal-chat | no | Y | anthropic | no |
| POST /api/esoteric/natal-synthesis | no | Y | anthropic | no |
| POST /api/quick-query | optional | Y | anthropic | no |
| POST /api/side-canal/extract | optional | Y | anthropic | no |
| POST /api/side-canal/synopsis | optional | Y | anthropic | no |
| POST /api/tree-chat | optional | Y | anthropic | no |
| POST /api/web-browse | no | Y | anthropic | no |
| POST /api/x-video-analysis | yes | Y | anthropic | no |
| POST/GET /api/arboreal-chat | no | N | anthropic | no |
| POST /api/god-view/agent-chat | no | Y | anthropic | no |
| POST /api/god-view/council | no | Y | anthropic | no |
| POST /api/god-view/predict | no | Y | anthropic | no |
| POST /api/god-view/scenario-chat | no | Y | anthropic | no |
| POST /api/guard-suggestions | no | Y | anthropic | no |
| POST /api/idea-factory/generate | no | N | anthropic | no |
| POST /api/layer-test | no | Y | anthropic | no |
| POST /api/mindmap/re-extract | yes | N | anthropic | no |
| POST /api/mindmap/topic-suggestions | no | N | anthropic | no |
| GET /api/test-providers | no | N | anthropic | no |
| POST /api/tot-consensus | no | Y | anthropic | no |
| GET /api/news | no | N | other-paid | no |
| POST /api/tree-config/test | no | Y | anthropic | **yes (transitive)** |
| POST /api/simple-query | optional | Y | anthropic | **yes** |

*(Full 88-row matrix including the 59 non-paid routes in `findings.json` → `routeMatrix`.)*

## 7. AUDIT COST LEDGER

Live provider calls made during this audit (HARD CAP $2 / 25 calls):

| Batch | Calls | Notes |
|-------|-------|-------|
| A4 guard probes (p1-p6, direct) | 6 | ~$0.02 each (Haiku), one triggered grounding |
| A5 tot run #1 (anonymous → fell back to single free model) | 1 | $0 (free model) |
| A5 tot run #2 (signed-in Pro → 3 free advisors + Anthropic synth) | 1 request = 3 free advisor calls + 1 Anthropic | cost recorded $0.0150 |
| Boot/CSP verification direct query | 1 | Haiku ~$0.004 |
| **TOTAL** | **~9 provider requests (~11 underlying calls)** | **≈ $0.07** |

Well under the $2 / 25-call cap. Offline harnesses (A2 selector 20 queries, A4 grounding 3 cases) made **zero** paid calls.

## 8. APPENDIX

### A2 selector harness (offline, `intelligence-fusion-scoring.selectMethodology`)
```
HIT  factual        | chose direct  | "capital of Japan" / "Berlin Wall" / "define osmosis"
HIT  comparison     | chose tot     | "PostgreSQL vs MongoDB"
MISS comparison     | chose sc      | "rollups vs sidechains for gaming"
HIT  comparison     | chose cod     | "iPhone or Android for elderly"
HIT  howto          | chose cod/direct | "python venv" / "sourdough"
MISS howto          | chose direct  | "deploy Next.js to a VPS" (wanted cod/react)
MISS research       | chose sc      | "latest EU AI regulation" (wanted react)
MISS research       | chose sc      | "solid-state battery manufacturing" (wanted react/tot)
HIT  research        | chose direct | "most recent Champions League final"
HIT  creative       | chose direct  | "poem about autumn rain"
MISS creative       | chose tot     | "brainstorm coffee-shop-on-moon names" / "dragon bedtime story"
MISS math           | chose direct  | "15% of 2340 + compound interest" (wanted pas/pot)
MISS math           | chose pas     | "mortgage payment" (near-miss)
HIT  ambiguous      | chose direct  | "Thoughts?" / "Is it worth it?"
MISS ambiguous-deep | chose sc      | "Mars vs ocean, econ+ethics+survival" (wanted tot/bot)

HIT RATE: 11/20 (55%)
```

### A4 grounding lexical-scorer blind spots (offline, `grounding-heuristic.scoreLexicalSupport`)
Context: a true statement about Ethereum's 2022 PoS switch.
```
NEGATION-FLIP  ("did NOT switch... must NOT stake 32 ETH"): scored 92% supported, 0 spans flagged  ← FALSE NEGATIVE (dangerous)
PARAPHRASE-TRUE (true fact, different words):               scored 14% supported, 1 span flagged   ← FALSE ALARM
RECOMBINED-FALSE ("merge reduced gas fees 99.95%..."):      scored 75% supported, 0 spans flagged   ← FALSE NEGATIVE
```
Lexical overlap cannot see negation, rewards word-reuse regardless of truth, and can't detect false recombination of true tokens. This is why enhancement #6 (real NLI) matters.

### D1 build — heaviest client chunks
```
4696.*.js   1.6M   three.js + walletconnect + wagmi
cb6e3fd2.*  780K   viem
7589.*.js   592K   walletconnect + viem
2531.*.js   404K
Home First Load JS: 308 kB
```

### C knip — raw headline
```
Unused files (158) · Unused dependencies (19) · Unused devDependencies (3)
Unlisted dependencies (1) · Unused exports (257) · Unused exported types (120) · Duplicate exports (14)
Total LOC across unused files: 30,771
```
*(Full file list in `findings.json` → `knip`.)*

## KNOWN / CONFIRMED CHIPS (verified still-open)
pending-402 rows · canvas/history stale-darkMode · session_id fresh-install schema · eval-bar Node-24 vitest · off-peak advisor re-pin · Stripe→tier wiring (**now BLOCKER #4**) · core jest 3 suites broken (**confirmed — core methodology impls are dead + untested**) · VPS Sentry DSN at deploy (**confirmed in E3 env drift**) · client crash (unreproduced) · topic-cascade observation.

---

## G. STRATEGIC READ — *JUDGMENT, not findings. Algoq decides.*

**G1 — Strongest differentiator (evidence):** The **live-reasoning stream + guard, on the plain `direct` path.** It's the one subsystem that is fast, honest, genuinely novel to watch, and provably does what it says (A1-react-adjacent, A4 probes, the answer-stream work). Users *feel* the pipeline thinking. That's the product.

**G2 — Strongest cut candidate:** **god-view + the tot consensus round-2 machinery.** god-view is 4 unauthenticated paid routes (one POST = 4 Sonnet calls), largely orphaned in knip, delivering "predictions/councils" of unmeasurable value. tot's round 2 is provably never-skippable dead spend (A5). Cutting god-view breaks nothing users depend on (dead in knip); cutting tot round-2 saves 3 free calls/query and the "consensus %" theater with zero honest-quality loss. Combined they're the worst complexity×spend÷value ratio in the codebase.

**G3 — Is 7 methodologies right?** No. **Ship 3 honest ones: Direct, Web-search (react), Multi-AI (tot).** sc/cod/pas are dead-code-backed prompts whose labels lie; they add a routing surface the selector only gets 55% right and that no eval guards. Three real, distinct, truthfully-labeled modes beat seven where three are fiction.

**G4 — If the founder builds only THREE things before launch:** (1) universal budget gate (#1 — without it, launch is a financial liability); (2) fix payment→entitlement (#3+#4 — without it, revenue is impossible); (3) the methodology truth pass (#2 — without it, the *brand* is a lie, and that's the one thing this product can't survive). Wallet-stub (#1 blocker) is assumed table-stakes, not a "build."

**G5 — Where it strains at 100×:** The architecture assumes **one long-lived single-process PM2 server holding all state in module-level Maps** — SSE buffers, rate-limit windows, response cache, cogs ring. At 100× concurrent users the orphaned-buffer leak (E2) and unbounded caches (D3) OOM the process, and the in-memory rate-limit/budget-adjacent state can't survive the horizontal scaling you'd need. **Earliest cheap prevention:** move SSE-buffer + rate-limit state behind a tiny Redis (or even SQLite-with-TTL) interface *now* while there's one call site each, and add the buffer TTL (E2, an S-effort fix) — so the day you add a second process, nothing silently double-counts or leaks.
