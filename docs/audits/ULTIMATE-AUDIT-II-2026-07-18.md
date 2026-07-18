# ULTIMATE AUDIT II — AkhAI Verification Gate

**Audited hash:** `e7dada0` · **Baseline:** `97c25c1` (ULTIMATE-AUDIT 2026-07-12, NO-GO / 9 blockers) · **Date:** 2026-07-18
**Method:** live exploitation against the running server (:3000) + 9 parallel read-only analysis agents + offline harnesses (selector gauntlets, SSRF unit, DB pragmas). **Source files changed: ZERO** (this report + `findings-ii.json` are the only writes).

Pre-flight: HEAD `e7dada0`, tree clean, `shield.sh --fast` PASS. **Provider-call cost: $0.00 / 30 (0 paid calls)** — every live query ran the anonymous free-model lane ($0); all exploit/gauntlet/DB work was local.

---

## 1. EXEC SUMMARY

The remediation sprint is **real**. All 9 original blockers were attacked with their own exploits and 8 are dead in production; the 9th (key rotation) is open by design and deferred to deploy. Wallet auth forges 401, anonymous callers can no longer touch a paid provider, the payment→entitlement chain is wired end-to-end, the admin mutation is gone, and the SSRF guard blocks every private/metadata target including redirect hops and encoded-IP tricks. M2 (selector) and M4/M5 verify cleanly; M2 scored **97/100 on both 100-prompt gauntlets, measured here**. But the verification found one **new brand-existential BLOCKER the M1 relabel missed**: the live, Navbar-linked `/dashboard` still tells users the `pas` methodology *"generates & runs code"* — it executes nothing. For a product whose brand is methodology honesty, a lying label on the primary methodology surface is launch-blocking, exactly as the prior audit judged. Add two anon-experience HIGHs (users are shown the wrong model name, and the free model leaks its system prompt as the "answer" ~20% of the time) and the freeze is **GO-WITH-CONDITIONS**, not clean-GO.

## 2. FREEZE VERDICT: **GO-WITH-CONDITIONS**

The engine went from NO-GO/9-blockers to one remediable copy-fix away from launch-ready. Conditions to convert to GO:

1. **[BLOCKER] Fix the `/dashboard` methodology labels** — `app/dashboard/page.tsx:81-84`: `pas` → drop "Program of Thought"/"Generate & run code" (runtime is prompt-only Plan-and-Solve, no execution); `cod` "Chain of Draft" and `sc` "Buffer of Thoughts" → the names the M1 relabel already standardised elsewhere. ~5 lines, one file. This is the same lie class the July-12 audit called existential; the relabel fixed 7 surfaces and missed this one.
2. **[B5] Rotate the two Anthropic keys + one OpenRouter key** still reachable in git history at `a050fe3` (`SESSION_RESUME_MAR17_2026.md`). Removed from HEAD tree, but the blob persists — mandatory before/at deploy. (Not rotated by this audit, per scope.)
3. **[HIGH] Make the displayed model true, and stop the free-model garbage** — anon users are shown `Llama 3.3 70B` while `callOpenRouter` hard-calls `nvidia/nemotron-3-super-120b-a12b:free`; that same free model leaked its system prompt verbatim as the answer on ~2/9 live anon queries. Align the display with the call and add the free-auto-router fallback + an output sanity check.
4. **[HIGH] Honour or soften the data-deletion promise** — `app/privacy/page.tsx:21` promises deletion; no deletion code path exists.

Everything else (MED/LOW) is post-launch-tolerable.

## 3. BLOCKER RE-VERIFICATION TABLE

Each original blocker attacked with its own exploit against the live server (or its guard exercised directly). Verbatim results:

| # | Blocker | Original exploit | Attempted | Result | Verdict |
|---|---------|------------------|-----------|--------|---------|
| B1 | Wallet sig = no-op `true` | forge sig from another wallet, claim victim addr | attacker-signs-victim-challenge → **401**; wrong-address → **401**; garbage sig → **401**; valid self-sign → **200**; replay consumed nonce → **401**; fabricated never-issued nonce → **401** | exploit dead | **CLOSED** |
| B2 | 26/27 paid routes ungated → anon Anthropic DoS | anon POST to esoteric/*, god-view/*, depth-extract, cognitive-signature, canvas-viz, conversation-synthesis, guard-suggestions, idea-factory, arboreal-chat, enhanced-links, web-browse, x-video-analysis | **all 13 → 401 `authentication_required`**; anon `simple-query` → free model, **cost $0**; deleted `topic-suggestions` → 404; `rank/deepen` has requireAuth+guardPaidRoute and spends nothing (Opus reserved) | 0 anon-reachable paid routes | **CLOSED** |
| B3 | Stripe credits grant 0 tokens (key mismatch) | trace grant-write vs ledger-read | `addTokens`→`subscriptions.token_balance`; `getCreditBalance` reads the **same column**; over-budget-with-credits allowed (`source:'credits'`); debited on completion (`simple-query:1027`); idempotent via `INSERT OR IGNORE` | grant lands, no double-grant | **CLOSED** (code+tests; live Stripe sim skipped to avoid DB mutation) |
| B4 | Subscriptions never raise enforced tier | trace tier write | webhook `setUserTier` on checkout/updated (→pro/legend) and `'free'` on cancel; `checkBudget` reads `users.tier`→`TIER_BUDGETS` | Pro raises budget, cancel reverts | **CLOSED** (code) |
| B5 | Live keys in pushed git history | `git show a050fe3:SESSION_RESUME_MAR17_2026.md` | **2 Anthropic key-shaped lines still present** in history; file gone from HEAD tree | keys still live | **OPEN BY DESIGN** — rotate at deploy |
| B6 | `admin/reset-stuck` open DB mutation | unauth POST | → **401**, processing-row count **unchanged** (before=after=0); 404 in prod | no mutation | **CLOSED** |
| B7 | Deploy can't bootstrap fresh host | `--dry-run` defaults + overrides | defaults resolve to `82.221.101.3 /home/akhai/app :3000`; overrides fully re-resolve; no real secret in any tracked `deploy/` file | portable + fresh-host capable | **CLOSED** |
| B8/B9 | SSRF: `fetch-url`/`web-browse` no guard | metadata/loopback/private/redirect/encoded-IP | `assertPublicUrl` **BLOCKED** 169.254.169.254, 127.0.0.1, 10/8, 192.168, `[::1]`, `localhost`, `file://`, decimal `2130706433`, hex `0x7f000001`; live redirect→metadata **BLOCKED** at hop re-check; public control allowed; anon entry → **401**; guard sits at shared sink `url-content-fetcher.ts:189` | SSRF dead at auth + guard layers | **CLOSED** |

**8 of 9 blockers CLOSED (exploit dead). B5 open by design (rotation deferred to deploy).**

## 4. REFINEMENT SCORECARD (M1–M5 + live reasoning)

| Refinement | Verdict | Evidence |
|---|---|---|
| **M1 methodology honesty** | **DEGRADED — 1 BLOCKER** | Relabel (642f2e6) correctly fixed 7 surfaces (methodology-data savings→n/a, sc "voting" removed, dead bot/pot keys dropped), but MISSED the live `/dashboard` control panel — served HTML still contains "Program of Thought", "Generate &amp; run code", "Buffer of Thoughts", "Chain of Draft". Two more false-exec labels survive in **dead** components (FunctionIndicators, ReportConsoleDrawer — no live importers → LOW). |
| **M2 embedding selector** | **VERIFIED** | Ran both harnesses here: `gauntlet100` **97/100**, `gauntlet100b` **97/100** (matches the sprint's claim). `EMBED_ROUTER=0` → `routeByEmbedding` returns null → keyword fallback (confirmed live). Model cache `.cache/transformers` gitignored, 0 tracked. Cold-start latch + linux-binding swap present. |
| **M3 voice** | **VERIFIED (with an anon caveat)** | Live: simple fact → "351" (1 word, **no SYNTHESIS block** — isSubstantial gate fires correctly); weighty → gravity + SYNTHESIS; wonder → "the atmosphere is a fine net that catches the short blue waves" (one vivid image). Zero negative framing on clean responses. **Caveat:** the anon free model (nemotron:free) intermittently returns its system prompt as the "answer" (~2/9), which is a model/plumbing defect, not a voice-prompt defect. |
| **M4 mindmap** | **VERIFIED IN CODE** | `mindmap/rank` makes no provider call ($0 hover); `rank/deepen` returns `transformative: null`, Opus reserved behind requireAuth+guardPaidRoute (spends nothing today); flower-of-life layout has a vitest proving ≥80u min-distance at 124 nodes; tunnel theme-adaptive (both themes) per d4e6a90. |
| **M5 philosophy** | **VERIFIED** | `/philosophy` 200, clean `next build` (4.43 kB static). Claims documented-not-asserted; the seven-movement paper ends at the trees (5e84d6d); no invented quotes; no metaphysics asserted as fact (prior M5 honesty audit + this build). |
| **Live reasoning** | **VERIFIED IN CODE** | Stage-keyed dedup (57d4742) in ReasoningTrace/ProcessingIndicator; anon streaming path present (openrouter textCb no longer anthropic-gated, 00f9118). One stale contradicting comment above the dedup key (LOW). |

## 5. NEW FINDINGS (what the sprint broke or left, ranked)

| # | Sev | Finding | File:line | Impact |
|---|-----|---------|-----------|--------|
| 1 | **BLOCKER** | `/dashboard` (live, Navbar-linked) labels `pas` "Program of Thought" / "Generate & run code" — runtime executes nothing; also cod/sc mislabeled. The M1 relabel missed this surface. | `app/dashboard/page.tsx:81-84` | Brand-existential: a lying methodology label on the primary methodology page of a transparency-branded product. |
| 2 | HIGH | Anon users shown model `Llama 3.3 70B` while code hard-calls NVIDIA Nemotron. | `lib/multi-provider-api.ts:626` + `simple-query:393` | Honesty gap on every anonymous answer; the displayed provenance is false. |
| 3 | HIGH | Free model (`nemotron:free`) leaks the system prompt / reasoning as the "answer" on ~20% of anon queries (measured 2/9 live). | `lib/multi-provider-api.ts:626` (no output sanity check / auto-router fallback) | First-touch experience for signed-out users is intermittently broken and self-doxxes the prompt. |
| 4 | HIGH | Data-deletion promised, no deletion code path exists. | `app/privacy/page.tsx:21` | Brand/legal exposure (GDPR-style promise unbacked). |
| 5 | MED | `callOpenRouter` ignores `request.model` (hardcoded nemotron) — the code bug behind #2/#3. | `lib/multi-provider-api.ts:626,658,730` | COGS + display attribute the wrong model. |
| 6 | MED | `pageContext` re-sends the last-5 messages already in `conversationHistory` (uncached dup). Prior finding #10 half-fixed (side-canal dup resolved). | `hooks/useHomePageDerived.ts:107` | ~1–2K wasted tokens/turn at output prices. |
| 7 | MED | `thought-stream` `buffers`/`connections` Maps leak entries on early-return paths with no terminal emit (long-lived PM2). | `lib/thought-stream.ts:189` | Slow memory growth between restarts. |
| 8 | MED | Auto web-search injected into the prompt on **every** query regardless of need. | `app/api/simple-query/route.ts:496` | Latency + token cost on facts that need no search. |
| 9 | MED | "We do not use tracking cookies" contradicted by PostHog cookie persistence. | `app/privacy/page.tsx:16` | Honesty/consent gap. |
| 10 | MED | Dashboard control toggles (incl. "Grounding Guard") are wired to nothing. | `app/dashboard/page.tsx:132` | Dead UI implies configurability that doesn't exist. |
| 11 | MED | "Zero hallucinations" absolute claim on the paid pricing success page. | `app/pricing/success/page.tsx:95` | Overstated guarantee on a paid surface. |
| 12 | MED | "Advisors: 4 Parallel" overstates the 3-advisor consensus engine. | `app/explore/page.tsx:46` | Consensus count inflated. |
| 13 | MED | Email verification OTP + address logged to server console. | `app/api/auth/email/route.ts:79` | Secret-adjacent log leak (prior finding, still live). |
| 14 | LOW | False code-exec labels in **dead** components (no live importers). | `FunctionIndicators.tsx:79`, `ReportConsoleDrawer.tsx:293` | Not user-visible; fix or delete. |
| 15 | LOW | X OAuth state + PKCE cookies omit `secure`/`sameSite`. | `app/api/auth/x/route.ts:42` | CSRF-adjacent hardening gap. |
| 16 | LOW | Pricing card advertises "Claude Opus 4.5"; system calls Sonnet-class for most paths. | `components/CustomCreditCard.tsx:107` | Model overstatement on a paid card. |
| — | INFO | Deleted components/routes (`MindMapTableView`, `TopicExpansionPanel`, `GolemProtocolSection`, `MethodologiesAndCovenantSections`, `topic-suggestions`, `re-extract`) — **zero live references, build clean**. | tree-wide | Regression hunt clean. |

**Corrections applied to the analysis pass:** the two extra false-exec surfaces (FunctionIndicators, ReportConsoleDrawer) were re-rated HIGH→LOW after confirming neither has a live importer (dead code). Only the `/dashboard` surface is live → the single new BLOCKER.

## 6. THE ROUTE MATRIX (bypass answer)

**Explicit bypass answer: ZERO paid routes are reachable by an anonymous caller in production.** Of 88 routes, ~29 can reach a paid provider: **25 gated by `requireAuth`** (401 for anon, first statement of the handler, provider call in a helper invoked only after the gate), **1** (`simple-query`) routes anon → the $0 OpenRouter free model + `checkBudget` for signed-in, **3** dev-only diagnostics hard-gated to 404 in production (`layer-test`, `test-providers`, `test-key`), and **0** gated by budget-only `guardPaidRoute` (the one route wiring it — `mindmap/rank/deepen` — also calls `requireAuth` and has no live paid call yet). Signed-in over-budget → **402** (tier budget exhausted **and** credits zero). Full per-route table (paid routes) in `findings-ii.json`; representative rows:

| Route | Auth | Zod | Paid (model) | Gate |
|---|---|---|---|---|
| esoteric/analyze | requireAuth | ✓ | Opus | @17 |
| god-view/council | requireAuth | ✓ | mid | @48 |
| depth-extract | requireAuth | ✓ | Anthropic | @44 |
| tot-consensus | requireAuth | ✓ | premium synth + free debate | @176 |
| web-browse | requireAuth | ✓ | budget | @18 |
| simple-query | anon→free / checkBudget | ✓ | paid only for signed-in | free@389 + budget@278 |
| mindmap/rank/deepen | requireAuth + guardPaidRoute | ✓ | none yet (Opus reserved) | @29/@32 |
| layer-test | prod-404 | ✓ | sonnet (dev only) | NODE_ENV@38 |

## 7. EFFICIENCY REPORT (E, with numbers)

- **E1 tokens:** `conversationHistory` bounded server-side (`route.ts:466` `slice(-6)`); system prompt **not** duplicated (cached-prefix + dynamic split, `multi-provider-api.ts:73`). Remaining wins: (1) `pageContext` re-sends the last-5 messages already in history — **~1–2K tokens/turn**; (2) auto web-search injected every query — **~200–600 tokens + a network round-trip** on facts needing none; (3) client uploads full `conversationHistory` each request (server trims, but upload bytes are wasted). Prior "side-canal injected twice" is **fixed** (single inject `route.ts:470`).
- **E2 cache:** `query-cache` key is not user-scoped **but cannot serve a cross-user answer** — every per-user signal forces a miss or blocks the write. **Verified FINE.**
- **E3 query plans:** all 5 hot queries index-backed, **no table scans** — `getDailyUsage` (idx_queries_user_id), `query by id` (autoindex PK), `session by token` (autoindex), `credit balance` (idx_subscriptions_user_id). `getRecentQueries` uses MULTI-INDEX-OR + TEMP B-TREE for ORDER BY (acceptable; the `OR user_id IS NULL` still exposes anon rows to signed-in history — MED, pre-existing).
- **E4 bundle:** clean build; `/dashboard` 3.16 kB, `/philosophy` 4.43 kB static; wallet/web3 stack remains the heaviest client mass (lazy-load candidate, pre-existing).
- **E5 memory:** all module-level caches bounded **except** `thought-stream` buffers/connections (leak on early-return); prior `ddgCache` no longer exists.
- **E6 known chips:** OpenRouter nemotron hardcode / display mismatch — **still open** (findings #2, #5); free-tier 429 with no auto-router fallback — **still open** (finding #3); rank-eval duplicate weight const — INFO (harness re-implements scoring; synced in a7aefcc).

## 8. STRATEGIC READ *(JUDGMENT — Algoq decides)*

- **G1 — genuinely launch-ready?** The spine is. The security remediation is real and verified by exploitation, not diff-reading. The soft spot the metrics hide is the **anonymous first-touch experience**: the free model occasionally answers with its own system prompt, and the labels a new visitor reads (`/dashboard`) still lie about what the methodologies do. Those are the two things a launch-day skeptic hits first, and neither is in a passing test.
- **G2 — highest risk between today and Sep 5:** the honesty surface, not the security surface. One live mislabel on the primary methodology page can undo the entire "transparency engine" positioning in a single screenshot. It's a 5-line fix — but it must actually ship, and there should be a **grep-gate in SHIELD** (`Program of Thought|Generate & run code|92% savings|Self-Consistency voting` = fail) so honesty can't silently regress again, which is exactly how this one slipped back in.
- **G3 — if only three things ship before launch:** (1) the dashboard label fix + a SHIELD honesty grep-gate; (2) align the anon model display with the model actually called and add the free-auto-router fallback + output sanity check (kills findings #2/#3 together); (3) implement account/data deletion (or soften the promise) — the one item with legal teeth.
- **G4 — strain at 100×:** the in-memory ring-buffer instruments (COGS, thought-stream, rate-limit maps) all live on a single long-lived PM2 process — they don't survive restart and don't shard. The cheapest early prevention is to treat them as ephemeral-by-design (already true for COGS) and move only the rate-limiter to a shared store (Redis) before multi-instance; the SQLite `queries` table is already index-clean and will carry read load far past 100× with WAL.

## 9. AUDIT COST LEDGER

| Item | Provider calls | $ |
|---|---|---|
| Live blocker exploits (A1–A6) | 0 paid (wallet/SSRF/admin local; anon simple-query = free model) | $0.00 |
| Selector gauntlets (200 prompts) | 0 (on-device embeddings) | $0.00 |
| Voice + garbage-rate probes (10 anon queries) | 0 paid (free model) | $0.00 |
| Analysis workflow (9 read-only agents) | 0 provider (code reading only) | $0.00 |
| **TOTAL** | **0 / 30** | **$0.00 / $3.00** |

---

*Verification audit on `e7dada0`. 8/9 original blockers confirmed CLOSED by exploitation; B5 open-by-design (rotate at deploy). 1 NEW BLOCKER (dashboard mislabel), 3 HIGH, 9 MED, 3 LOW. Verdict: GO-WITH-CONDITIONS.*
