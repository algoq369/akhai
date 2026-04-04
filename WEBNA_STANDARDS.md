# AKHAI — WEBNA DEVELOPMENT STANDARDS
# READ THIS BEFORE EVERY SESSION. NO EXCEPTIONS.
# Last updated: 2026-04-04
# Authority: This file overrides ALL other prompt files, plans, and trackers.

## WHAT CHANGED (April 2026)

AkhAI now has `@algoq/stdlib` — 20 production engineering patterns extracted from
Anthropic's Claude Code source (512K LOC audit). This changes HOW we implement WEBNA phases.
The stdlib is the enforcement layer — it turns WEBNA rules into actual running code.

**stdlib location:** `~/akhai/packages/stdlib/`
**Tests:** `npx tsx --test tests/run.ts tests/phase2.ts` → 123 tests, 0 failures
**Import:** `import { pattern } from '@algoq/stdlib/module'`

### WEBNA Phase → stdlib Pattern Map

Part 1-2 (Phases 1-24):
- Phase 4 (API Integration) → `withRetry()`, `circuitBreaker()`, `createContext()`
- Phase 6 (Error Hardening) → Error taxonomy, `classifyError()`, `TelemetrySafeError`
- Phase 11 (Monitoring) → `createTracker()`, `createMeter()`, `startSpan()`
- Phase 15 (Input Validation) → `buildOperation()` with Zod schemas
- Phase 17 (Error Boundaries) → `classifyError()`, telemetry-safe errors
- Phase 19 (Structured Logging) → `createDebugLogger()` — buffered, leveled
- Phase 22 (Security) → `createGuard()`, `denyList()`, `rateLimit()`
- Phase 24 (Production Readiness) → `createHookRegistry()`, `createTracker()`

Part 3 (Phases 25-34):
- Phase 25 (Backend API) → `buildOperation()`, `createGuard()` for middleware
- Phase 26 (Payments) → `withRetry()` for Stripe, `circuitBreaker()` for webhooks
- Phase 27 (Real-Time) → `createSignal()` for events, `createContext()` for connection lifecycle
- Phase 28 (File Storage) → `withRetry()` for uploads, `createFileStateCache()` for caching
- Phase 29 (Email) → `withRetry()` for delivery, `createTracker()` for email stats
- Phase 31 (CMS) → `createFileHistory()` for content versioning
- Phase 32 (i18n) → `defineConfig()` for locale configuration
- Phase 34 (AI/LLM) → ALL stdlib patterns — retry, streaming, tracking, context, hooks

---

## THE 5 IRON RULES (unchanged — stdlib enforces them)

### RULE 1: NEVER DEPLOY WITHOUT GREEN GATES
```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
```
If any gate fails, FIX IT before committing. No exceptions.

### RULE 2: SURGICAL EDITS ONLY
- Read the file section BEFORE editing
- Change ONLY the lines that need changing
- If your diff touches >50 lines for a small fix, REVERT and retry
- One concern per commit. One fix per commit.

### RULE 3: COMMIT AFTER EVERY WORKING CHANGE
```bash
git add -A && git commit -m "fix: description of what changed"
```
Use Conventional Commits: feat|fix|refactor|docs|test|chore

### RULE 4: UPDATE RESUME.md BEFORE CONTEXT FILLS
RESUME.md is the ONLY file the next session reads. Keep it under 100 lines.

### RULE 5: EVERY FILE UNDER 500 LINES
If a file exceeds 500 LOC, split it IMMEDIATELY. Not "later." Not "next session."

---

## STDLIB INTEGRATION RULES (NEW — April 2026)

### Rule 6: USE STDLIB FOR INFRASTRUCTURE, NOT HAND-ROLLED CODE
When you need retry, timeout, permissions, tracking, or events — use stdlib.
Do NOT hand-roll these patterns. The stdlib versions are tested (123 tests) and proven.

| Need this? | Use this — NOT hand-rolled code |
|---|---|
| Events/pub-sub | `createSignal()` from `@algoq/stdlib/signals` |
| Retry with backoff | `withRetry()` from `@algoq/stdlib/retry` |
| Timeout with cleanup | `createContext().withTimeout()` from `@algoq/stdlib/context` |
| Permission checks | `createGuard()` from `@algoq/stdlib/permissions` |
| Cost/token tracking | `createTracker()` from `@algoq/stdlib/tracking` |
| Lifecycle hooks | `createHookRegistry()` from `@algoq/stdlib/hooks` |
| Telemetry (spans) | `createMeter()`, `startSpan()` from `@algoq/stdlib/telemetry` |
| Error classification | `classifyError()` from `@algoq/stdlib/errors` |

### Rule 7: EVERY API CALL MUST BE RESILIENT
All external API calls (AI providers, web fetches) go through `callProviderSafe()`.
Raw `callProvider()` is banned in new code — it has zero retry, zero timeout, zero tracking.

### Rule 8: EVERY OPERATION GETS A TIMEOUT
Nothing runs forever. Use `createContext().withTimeout(ms)` for any operation that
could hang. Tier timeouts: Direct 30s, CoD/SC 60s, ReAct/PAS 90s, ToT/GTP 180s.

---

## CODE QUALITY STANDARDS

### TypeScript
- `strict: true` — no exceptions
- Zero `as any` casts — use proper types or `unknown`
- Named exports only (no default exports except pages)
- Every function has explicit return types

### Error Handling (now stdlib-powered)
- Use stdlib error taxonomy: `AbortError`, `TimeoutError`, `ValidationError`
- `classifyError()` for telemetry — never log raw stack traces
- `TelemetrySafeError` when error messages might contain PII/paths
- `withRetry()` on all external API calls
- `createContext().withTimeout()` on all potentially-hanging operations

### File Organization
- Max 500 LOC per file — split when approaching
- One component per file
- Co-locate: component + its types + its tests

---

## GIT DISCIPLINE

### Commit Convention
feat|fix|refactor|docs|test|chore — Conventional Commits only.

### What NEVER Goes in Git
- .env files (use .env.example with dummy values)
- Database files (.db, .sqlite)
- Planning/prompt files (CC_PROMPT_*, CLI_PROMPT_*)
- Node modules, .next cache, build artifacts
- API keys, tokens, secrets of any kind

---

## SESSION WORKFLOW

### On Session Start
1. `cat RESUME.md` — read current state (1 tool call)
2. Start building immediately. Do NOT re-read old prompts.

### During Work
3. One task at a time. Finish it. Test it. Commit it.
4. Run gates after every change: `pnpm type-check && pnpm build`
5. If build breaks, fix IMMEDIATELY
6. Commit after each working change

### Before Session Ends
7. Run full gate: `pnpm type-check && pnpm lint && pnpm test && pnpm build`
8. Update RESUME.md
9. `git push`

---

## THE STDLIB TOOLBOX (quick reference)

```ts
// Events (replaces hand-rolled pub/sub)
import { createSignal } from '@algoq/stdlib/signals'

// Retry (replaces raw fetch with no protection)
import { withRetry } from '@algoq/stdlib/retry'

// Timeout + cancellation (replaces Promise.race hacks)
import { createContext } from '@algoq/stdlib/context'

// Permission layers (replaces hardcoded if-checks)
import { createGuard, denyList, rateLimit, circuitBreaker } from '@algoq/stdlib/permissions'

// Cost/token/duration tracking
import { createTracker } from '@algoq/stdlib/tracking'

// Telemetry (counters, histograms, spans)
import { createMeter, startSpan } from '@algoq/stdlib/telemetry'

// Lifecycle hooks (before/after/error)
import { createHookRegistry } from '@algoq/stdlib/hooks'

// Operation factory (Zod validation + timeout + abort)
import { buildOperation } from '@algoq/stdlib/operations'

// Error classification (telemetry-safe)
import { classifyError, TelemetrySafeError } from '@algoq/stdlib/errors'

// Debug logging (buffered, leveled, namespaced)
import { createDebugLogger } from '@algoq/stdlib/debug'
```

---

---

## WEBNA PHASE COMPLETION STATUS (as of Day 79)

### Completed Phases (~72% compliance)
- ✅ Phase 4 (API Integration) — withRetry on AI calls, Zod validation
- ✅ Phase 5 (Code Quality) — 44→0 files over 500 LOC, 21 `as any` removed
- ✅ Phase 10 (SEO) — OpenGraph + Twitter Card metadata
- ✅ Phase 13 (Rate Limiting) — 10 req/min per IP middleware
- ✅ Phase 15 (Input Validation) — Zod schemas on /api/query
- ✅ Phase 18 (E2E Testing) — Playwright: 3 specs (query, nav, methodology)
- ✅ Phase 19 (Structured Logging) — DEBUG_LOG structured console logging
- ✅ Phase 22 (Security) — Dependency audit, rate limiting
- ✅ Phase 23 (Performance) — Dynamic imports for heavy components
- ✅ Phase 24 (Production Readiness) — Rollback strategy, health endpoint, stdlib tracker+context

### Remaining Gaps (post-launch)
- Visual checks A-F: Need manual Lighthouse audit
- PWA: Service worker, offline support
- Search engine: sitemap.xml, robots.txt
- i18n: Multi-language support
- Phase 11 (Monitoring): Full telemetry spans (partial — tracker only)
- Phase 17 (Error Boundaries): React error boundaries not yet added

---

*This document follows the WEBNA 34-Phase methodology.*
*stdlib: 20 patterns, 123 tests, zero external deps beyond Zod.*
*Created by Algoq | AkhAI | Updated April 2026*
