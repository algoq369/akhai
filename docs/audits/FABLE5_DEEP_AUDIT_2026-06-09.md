# AkhAI Deep Audit — Claude Fable 5
**Date:** 2026-06-09 | **Head:** `fae1395` (main, clean) | **Scope:** packages/web full + engine intelligence check
**Gates at audit time:** tsc 0 errors | vitest 91/91 | localhost + akhai.app healthy

## VERDICT
- Engine architecture: **B+** — fusion core clean, modular, tested, graceful degradation.
- Security posture: **C-** — two auth-token generation flaws + 113 dependency vulns are launch blockers. ~1 day to B+.
- Code quality: **B-** — 98% client components, 323 console.log, 291 `any`, 12 files ≥500 lines.
- RESUME.md drift: "ALL Math.random replaced" is false — 53 remain, 2 in auth paths.

---

## P0 — CRITICAL

### 1. Email auth code via Math.random() — account takeover vector
`app/api/auth/email/route.ts:34` → `Math.floor(100000 + Math.random() * 900000)`
Math.random is not CSPRNG; V8 xorshift128+ state recoverable → predictable 6-digit codes.
**Fix:** `crypto.randomInt(100000, 1000000).toString()` (node:crypto). Verify attempt-limit + TTL exist.

### 2. OAuth state + code_verifier via Math.random() — CSRF / code interception
`app/api/auth/x/route.ts:21-23`. PKCE verifier and state MUST be crypto-random (RFC 7636).
**Fix:** `crypto.randomBytes(32).toString('base64url')` for both.

### 3. 113 dependency vulnerabilities (2 critical, 37 high, 70 moderate, 4 low)
- **protobufjs** <7.5.6 — arbitrary code execution (critical, transitive)
- **next** ^15.5.13 → DoS in Server Components, patched >=15.5.15
- **lodash** <=4.17.23 code injection via _.template; **axios** <1.15.1; **undici** <7.24.0; **hono** 4.12.8 (packages/api); rollup <4.59, picomatch <2.3.2, path-to-regexp <8.4, fast-uri <=3.1.0
**Fix:** bump `next` to ^15.5.15; add root package.json pnpm.overrides:
```json
"pnpm": { "overrides": { "protobufjs": ">=7.5.6", "lodash": ">=4.18.0", "axios": ">=1.15.1", "undici": ">=7.24.0", "hono": ">=4.12.18", "rollup": ">=4.59.0", "picomatch": ">=2.3.2", "path-to-regexp": ">=8.4.0", "fast-uri": ">=3.1.1" } }
```
Then `pnpm install && pnpm audit --prod` to verify, rebuild, redeploy.

---

## P1 — HIGH

### 4. 53 Math.random() remain (prior "13 files / 65 replacements / ALL" sweep missed app/api/)
Migrate to crypto.randomUUID() — ID generation spots:
`simple-query/route.ts:40,83,346` · `tot-consensus/route.ts:209` · `enhanced-links/route.ts:371,394` · `discover-links/route.ts:181`
Keep as-is (visual jitter/shuffle, non-security): living-tree positions, MindMapLayout jitter, news shuffle, layout.tsx inline UUID fallback polyfill.

### 5. Zero timeouts on LLM provider calls
`lib/multi-provider-api.ts` (532 lines): no AbortController/timeout anywhere. Hung upstream socket never errors → withRetry never fires → request hangs. RESUME Phase 4 item confirmed open.
**Fix:** `fetch(url, { signal: AbortSignal.timeout(90_000) })` on every provider call; per-methodology budgets (direct 45s, tot 180s). Also CoinGecko fetch in query-pipeline (10s).

### 6. Fallback methodology selector — dead branches
`lib/query-pipeline.ts selectMethodology`: branch order makes any query <100 chars without "analyze/compare" return `direct` — react/tot/sc/cod unreachable for short queries ("search latest AI news" → direct; "pros and cons of X" → direct).
Mitigation: production uses the **scored fusion selector** (query-fusion.ts:181); keyword selector only runs on fusion error or explicit methodology. Still a buggy safety net + **duplicate selectMethodology** (intelligence-fusion-scoring vs query-pipeline) = SSOT violation.
**Fix:** reorder keyword branches before the short-query branch, or delete keyword selector (fallback = direct + log). Rename one of the two functions.

### 7. lib/database.ts leaks into client-resolvable module graph
Vitest warning: `Module "fs" externalized for browser compatibility, imported by lib/database.ts`. A client import chain reaches server DB code. Phase 1 `server-only` still missing.
**Fix:** `import 'server-only'` atop database.ts, auth.ts, multi-provider-api.ts; ESLint no-restricted-imports for lib/db/* from components/.

---

## P2 — MEDIUM

### 8. Guard factuality check = permanent placeholder
query-pipeline.ts: `factScore = 0; factTriggered = false`. Guard advertises 5 checks, runs 4. Implement (cheap: cross-check named entities/figures vs Side Canal/Qdrant retrieval) or remove from scores so UI shows no fake metric.

### 9. ReAct fabricates observations by design
Prompt: "Action: describe what you would search (even if simulated)". Observations are hallucinated — contradicts the anti-hallucination Guard mission. **Fix:** wire ReAct to real discover-links/web fetch, or relabel "Reasoning Trace" until wired.

### 10. 98% client components, ~no code splitting
289/294 .tsx are 'use client'; only 2 next/dynamic imports. No RSC benefits, max hydration bundle. **Fix:** dynamic() heavy views (CanvasWorkspace, MindMapSVG, GodViewTree, whitepaper); audit leaves for server-renderable. (Phase 5.)

### 11. Zod coverage: 7/51 API route groups
Validated: simple-query (schema.ts), quick-query, tree-chat, guard-suggestions, query, side-canal/extract, canvas-viz. Phase 1 targets still raw: **settings, enhanced-links, depth-extract**.

### 12. checkCryptoQuery latent bug + overblocking
- `change24h` can be undefined → `.toFixed(2)` throws (caught → returns null → live-price silently dies).
- futureKeywords includes `analysis`, `potential`, `expected` → "btc price analysis now" skips live data. Overbroad.
- 4 coins hardcoded; no fetch timeout.

### 13. Rate limiter: in-memory Map
Resets on PM2 restart; breaks under cluster/multi-instance. Fine for single-instance launch — note the ceiling. x-forwarded-for trust is valid only behind Caddy; document.

### 14. CSP defined in TWO places
middleware.ts AND next.config.js both set CSP/XFO/HSTS — divergence risk. Nonce CSP (Phase 2) not implemented. **Fix:** single source (middleware, nonce-capable), delete next.config duplicates.

### 15. SQLite timestamp inconsistency
8x `datetime('now')` in btcpay/crypto webhook SQL vs `strftime('%s','now')` epochs in auth.ts vs ISO strings in app code — three formats, one DB. Server routes aren't minified (original bug was client-side) so not breaking; standardize on epoch or ISO.

---

## P3 — CLEANUP
16. **323 console.log** (down from 557). `[FUSION_DEBUG]` fires on every prod query — gate behind NODE_ENV or logger level.
17. **291 `: any`** annotations — typed-down sprints per module.
18. **~140 status .md files in packages/web root** — move to docs/archive/. Untracked AUDIT.md + docs/AUDIT_CLI_PROMPTS.md + docs/FINAL_AUDIT_CHECKLIST.md: commit or remove.
19. **RESUME.md stale**: says Day 115 / last commit 07e5488 / withRetry pending — actual head fae1395, retry+rate-limit shipped, 91 tests. Refresh per project-resume discipline.
20. **12 files >=500 lines** (Phase 3 said 10): CanvasHelpers 695, simple-query/route 680 (was 656), whitepaper/page 629, useCanvasState 611, content-classifier 561, CanvasNodeContent 544, multi-provider-api 532, ChatMessages 527, useQueryHandlers 523, intelligent-links 509, CanvasWorkspace 501, query-pipeline 500.
21. `.npmrc` `enable-pre-post-scripts` — pnpm-only key, npm warns every run.
22. 20 TODO/FIXME markers — triage into issues.
23. `2+2=5` sanity check is a toy assertion — remove or generalize to arithmetic verification.
24. 20x `user_id IS NULL` patterns — Phase 1 audit unverified; confirm each is anonymous-scope-only, cannot return another user's rows.

---

## ENGINE INTELLIGENCE CHECK (Fable 5 qualitative)

**Strong:** fusion refactor (133-line orchestrator + analysis/scoring/behaviors/types) is genuinely good engineering; graceful degradation (fusion failure → legacy path, never user-facing crash); 91-test suite covers classifier, registry, scoring, guard; methodology prompts encode a consistent editorial voice (compression doctrine) across all 7; antipattern guard cleanly modularized; thinking-budget + parallel/weighted mode from activations is sound design.

**Weak:** intelligence is front-loaded — selection/prompting smart, post-response verification thin (factuality stubbed, echo/drift surface heuristics, ReAct simulated). The anti-hallucination claim currently rests on hype-word lists and overlap ratios. Fastest credibility win pre-launch: real factuality via retrieval cross-check + real ReAct tool execution — converts Guard from theater to substance.

**Selector truth-table:** auto + fusion OK → scored selector (correct). auto + fusion error → buggy keyword selector. Explicit methodology → honored. Acceptable; unify.

---

## EXECUTION ORDER
1. **Today (~2-3h):** P0.1 + P0.2 (crypto.randomInt / randomBytes) → P0.3 (next bump + overrides + audit clean) → surgical commits, deploy.
2. **Next session:** P1.5 timeouts on all provider fetches → P1.6 selector fix/unify → P1.7 server-only → P1.4 randomUUID sweep.
3. **Then:** P2.11 Zod (settings/enhanced-links/depth-extract) → P2.14 CSP single-source + nonce → P2.8/9 Guard substance.
4. **Pre-launch sweep:** P3.16 log gating, P3.19 RESUME refresh, P3.18 doc archive.

**WEBNA estimate:** ~55/100 now → ~75 after P0+P1 → 85 reachable with P2.

— End of audit. Generated by Claude Fable 5, no model switch.
