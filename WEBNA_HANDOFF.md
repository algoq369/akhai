# WEBNA -> AkhAI: Engineering Standards & Token-Efficiency Protocol

> The CURRENT WEBNA bar (supersedes the WEBNA-derived portions of WEBNA_STANDARDS.md, Apr 2026)
> plus the token-efficiency protocol AkhAI requested. Written for the merge ahead:
> **WEBNA becomes AkhAI's agentic code tool -- what Claude Code is to Anthropic, WEBNA is to AkhAI.**
>
> Source: WEBNA engine HEAD 5c367f8 (branch feat/reliability-engine-v3.1, 106 commits ahead of main),
> V3.1 rulebook (36 phases / 8 gates / 22 cross-cutting checks), COGS protocol measured + verified this week.
> Date: 2026-06-30

## 0. HOW TO READ THIS

- **Part A** = coding standards (development, security, smoothness, organization, efficient tech). Encode the enforceable ones into SHIELD as gates.
- **Part B** = token-efficiency protocol (the profitable-engine core). Maps directly onto AkhAI gaps A-D.
- **What transfers vs not (read the Appendix first):** WEBNA is a CODE-GENERATION engine; AkhAI is a REASONING engine. The ENGINEERING DISCIPLINE, the MODEL-DISPATCH, and the MEASUREMENT PROTOCOL transfer 1:1. WEBNA's code-gen orchestration (pinned-base / body-fill) does NOT -- do not port it.

---

# PART A -- THE WEBNA BAR (high-level coding standards)

## A1. Prime directive
"Verified products, not prototypes." **Standards are CODE (gates that block), not docs that get ignored.** Every claim is verified, never inferred.
The single most expensive lesson this week: a generated app that LOOKED complete shipped with 5 of 6 navigation links returning 404 -- because four separate verification layers *assumed* the routes existed instead of *checking*. The compiler does not flag a `<Link>` to a missing route (it 404s only at runtime); the "completeness" check only parsed syntax; the quality gates checked UI/a11y/SEO but not route resolution; and the LLM reviewer's rubric checked the INVERSE bug (created-but-unused files, not referenced-but-missing). **Assume nothing. Gate everything you can check deterministically.**

## A2. Development principles (non-negotiable)
1. **Validate every boundary with Zod.** No unvalidated input crosses a function/route edge. No exceptions.
2. **crypto.randomBytes for tokens/IDs** -- never Math.random.
3. **Secrets server-side only.** Never in client code, never in git history, rotate quarterly. If it is in git, it is public.
4. **Build fails LOUD** (env validation at build time) -- not runtime-fails-silent. Missing config must break the build, not surface as a 3am incident.
5. **Errors as DATA:** try/catch + graceful fallback on every path; classify errors, keep telemetry safe (never leak internals into logs/responses).
6. **Untested backup = no backup. Rollback-tested or do not deploy.**
7. **Server-side enforcement** of anything that costs money or grants access. Never trust the client.
8. **Verified progress > fast broken progress.** "Fast is slow when you have to redo it."
9. **Never ship incomplete:** all env configured, all services provisioned, all internal links resolve.

## A3. Verification gates (the discipline that prevents broken ships)
- **Gates BLOCK on failure** -- they are not advisory warnings. A failed hard gate stops the pipeline.
- **The two-layer model -- the highest-leverage idea in this whole document:**
  - **Deterministic tooling catches STRUCTURAL bugs** (free, certain, instant).
  - **The LLM is reserved for JUDGMENT** (coherence, design, intent) -- the things only judgment can assess.
  - **Never pay a model to check what a 3-line function can verify.** WEBNA's LLM verifier (an Opus call costing ~$0.14, 29% of build cost) passed a build with 5 broken routes because route-resolution was not in its rubric. The fix is a FREE deterministic route-resolution gate using EXACT App Router segment matching -- and it now blocks that entire class. (Critical detail: it is exact-segment matching, NOT prefix matching -- a parent route never covers its children, and a naive prefix check would mask the very bug it exists to catch.)
- **Self-heal, then re-check:** on a hard-gate failure, attempt one bounded repair, re-run the gate, block if still failing. WEBNA's body-fill hit a typecheck error on a real build, self-healed it, and `next build` then passed -- captured and costed.
- **The ultimate gate is "does it actually run?"** WEBNA runs a real `next build` (install + typecheck + compile) on generated output -- not a proxy, not inference. AkhAI's analog: verify the reasoning actually EXECUTES and the answer actually GROUNDS against real sources -- behavior, not intent.

## A4. Security
- CSP + HSTS + X-Content-Type-Options + X-Frame-Options on every surface. Aim A+ on securityheaders.com.
- Secrets server-side + rotation (A2.3). Input validation via Zod at every boundary (A2.1).
- Parameterized queries only. Auth verified at the DATA layer, not just the route.
- `pnpm audit` before every deploy; zero high-severity; wait 7-14 days before adopting new packages.
- Layered permission guard pattern: deny-list + rate-limit + circuit-breaker composed (stdlib `createGuard`), not hand-rolled if-checks.

## A5. Smoothness (reliability + UX)
- **Every external call: retry + circuit breaker** (stdlib `withRetry` + `circuitBreaker`) -- one upstream failure never crashes the engine.
- **Every operation: timeout + abort propagation** (stdlib `createContext`) -- nothing hangs forever; cancellation flows parent->child; cleanup runs on cancel.
- Loading + error states on every async path. **Graceful degradation** -- AkhAI's grounding meter "parametric" tier is the right instinct: degrade honestly, do not fail.
- **Structured logging** (stdlib `createDebugLogger`), never raw console.log in production. Redact sensitive fields.

## A6. Organization
- TypeScript strict. **0 `any`, 0 @ts-ignore** -- WEBNA holds 0/0 across a ~6.6K-LOC engine. This is enforceable; enforce it.
- **Every file < 500 lines** (your existing rule -- keep it). Single responsibility. Modular.
- **@algoq/stdlib as the shared primitive layer** -- you already have it (`~/akhai/packages/stdlib/`, same package). Import primitives, do not hand-roll infrastructure.
- Conventional commits, branch protection on main, signed commits, surgical edits (smallest diff that does the job).

## A7. Efficient technology (the stack)
- Next.js + TypeScript + Zod + @algoq/stdlib.
- **Provider-agnostic LLM layer behind ONE contract** -- models swap without a rebuild, and every swap is gated by the eval harness. This is what makes the engine pivot-ready AND lets you route per-task to the cheapest sufficient model without touching engine code.
- The deterministic-gate pattern (A3) is the single highest-leverage technical lesson: cheap, certain, free guards beat expensive LLM checks for anything structural.


---

# PART B -- TOKEN-EFFICIENCY PROTOCOL (the profitable engine)

The goal: **the cheapest path that still meets the quality bar, for every single query.** Efficiency is not "use a small model" -- it is "spend exactly what correctness requires, and not one token more." You get there by measuring first, then routing, sizing, and caching against the measurement.

## B0. The first law: you cannot optimize what you do not measure
Before ANY optimization, INSTRUMENT. WEBNA's COGS protocol is a per-call anatomy that **RECONCILES** -- the sum of per-call (input + output) tokens equals the engine's reported total, to the token. If it does not reconcile, the measurement is lying and every optimization built on it is guesswork.
Every LLM call records: `{ purpose, model, inTok, cacheRead, cacheCreation, outTok, durationMs, costUSD, outcome, objectiveMet }`.
This is the instrument for everything below. Build it FIRST -- it is literally your "measure before/after" optimization phase, made concrete.

## B1. The per-call scorecard (adopt this before anything else)
Each row answers four questions: **what was this call for, how much did it cost, how long did it take, and did it hit its objective.** That is exactly what lets you decide "which model should do which part" with data instead of vibes.
- `purpose` -- a plain-language label per call site (for AkhAI: the methodology + intent, e.g. "direct answer", "react: search + synthesize", "self-critique pass").
- `outcome` / `objectiveMet` -- derived from signals you ALREADY have (no extra LLM calls): did it ground? did it answer within budget? did it need a retry? For WEBNA these come free from phase status, verifier pass/fail, and gate results.
The scorecard is the single source of truth for the whole protocol. Without it, B2-B6 are opinions.

## B2. Model dispatch -- right model for right task (your gap B)
**Match the model to TASK DIFFICULTY, not a blanket default.** Tiers:
- **light** (mechanical / checking / cosmetic) -> cheapest model.
- **standard** (the workhorse) -> mid model.
- **complex** (high-leverage: planning, security reasoning, the genuinely hard inference) -> best model.

THE measured insight, in one number: WEBNA's LLM verifier was paying Opus rates ($5 / 1M input) to read **27,355 tokens and emit 16** -- it read the whole codebase to say "looks good." Checking is mechanical; it does not need the flagship model. Down-tiering that ONE call recovers ~23% of build COGS with no quality loss (verified on the scorecard).
**For AkhAI, directly:** a `direct` answer is a light-tier task and must NOT touch Opus. Your cost cascade already does simple->Haiku -- extend it so EVERY methodology carries a justified tier, and **put a CEILING on simple queries** so a cheap query can never silently escalate to the most expensive model.

## B3. Output budgets -- size max_tokens to the task (your gap B, directly)
Never a flat 4096. A `direct` answer needs a few hundred tokens; `tot` (tree-of-thought) needs many more. Set the output budget per methodology, and tune it against the scorecard's `outTok` column -- which shows you the ACTUAL output distribution per task, so you size from data, not a guess. Output tokens are the expensive side (often 4-5x input price); over-budgeting output is the quiet, recurring cost leak.

## B4. Prompt architecture for cache stability (your gap A -- the priority)
The fix is canonical, and your diagnosis is already correct: **cache_control belongs on the STABLE prefix** (your ~9KB methodology block). Everything dynamic -- current date, live web context, fusion modifications -- goes AFTER the cached breakpoint, or moves into the user turn. A prefix that mutates per query guarantees cache misses; that is your entire gap A.

Correct message shape:
```
[ system: STABLE methodology block ]   <- cache_control breakpoint HERE
[ system or user: dynamic date / web context / fusion mods ]
[ user: the actual query ]
```

**MEASURE it with the scorecard you built in B1:** `cacheRead` vs `cacheCreation` per call IS your cache hit-rate. `cacheCreation` firing on every call = your prefix is still unstable (misses). `cacheRead` dominating = the prefix is stable (hits). You will SEE the fix land.

**Honest caveat (so you do not inherit a myth):** WEBNA *tracks* cache tokens but currently costs them at full input price (an open TODO on our side -- the 0.1x-read / 1.25x-write cache economics are not yet wired into our cost model). So WEBNA hands you the MEASUREMENT METHOD and the PRINCIPLE (both proven), not a finished cache cost-model. The principle is Anthropic-canonical; the measurement is the part WEBNA has working.

## B5. The most efficient USER EXPERIENCE (query -> cheapest sufficient path)
"Efficient experience" = fast, correct, and as cheap as correctness allows -- the user feels speed, you keep margin. Concretely, in order of impact:
1. **Route to the cheapest SUFFICIENT method + model.** Your fusion classifier already picks the method; layer the B2 tiering on top so the model matches too. Most real queries are `direct` and should cost cents, not dollars.
2. **Cache aggressively.** Prompt cache (B4) for prefix reuse + a **SEMANTIC cache** for repeat/similar queries (your gap C) -- a cache hit is the cheapest "inference" that exists: near-zero tokens, near-zero latency. This is the single biggest lever you do not yet have.
3. **Right-size output (B3) and STREAM** -- streaming cuts *perceived* latency even when total tokens are unchanged.
4. **Ground only when factuality risk is real.** Your grounding meter is the right instinct -- do not pay for external NLI on a query the parametric tier answers honestly. Spend the grounding budget where being wrong is expensive, skip it where it is not (your gap D is really "ground selectively", not "ground always").
5. **Pre-compute on idle** (stdlib `createSpeculator`) -- turn idle cycles into warm, cached future answers.

## B6. The most efficient INTERNAL ARCHITECTURE (profitable engine)
- **ONE provider contract; all models behind it; every swap gated by the eval.** This is what lets you route per-task to the cheapest model WITHOUT touching engine code, and pivot providers without a rebuild.
- **The three efficiency levers (from WEBNA's COGS work, in priority order):**
  - **L1 -- DOWN-TIER checkers / mechanical steps** to the cheapest model (the verifier lesson -- biggest single win).
  - **L2 -- SCOPE the input.** Never send the whole context when a slice suffices. WEBNA's two priciest calls each read ~27K tokens; trimming input is linear, guaranteed savings. For AkhAI: give each methodology only the context it needs, not the entire transcript/history.
  - **L3 -- CUT re-runs.** Re-check / re-process only what CHANGED. Do not re-read the whole tree per heal cycle; do not re-ground or re-reason from scratch on a refinement.
- **KNOW YOUR MARGIN PER QUERY.** Once the scorecard is live, you know the exact COGS of every query TYPE. That is the input to pricing: you cannot price for profit if you do not know unit cost. WEBNA proved a representative full build costs ~$0.48 and can name where every cent went -- that is the level of cost-clarity that makes an engine *bankable*.
- **FREE-TIER DISCIPLINE.** Platform key + tier->model routing + a free tier **hard-metered on the cheapest model**, sized from real COGS. Never let a free query reach your most expensive model -- that is how "free" silently becomes your largest line item.


---

# PART C -- HOW TO ADOPT (the same discipline that got WEBNA here)

1. **INSTRUMENT FIRST.** Build the per-call scorecard (B0/B1) before any optimization. Optimizing blind produces confident regressions.
2. **Encode the enforceable standards (Part A) into SHIELD as gates.** They join your existing tsc / vitest / tripwire / ratchet / bundle gates. A standard that is not a gate is a suggestion.
3. **Optimize against measurement.** Each lever (B2-B6) goes in behind a flag, measured before/after on the scorecard, reversible, verified on localhost. This is the exact discipline that produced WEBNA's 106-commit verified state -- deploy-free, gated, reversible.
4. **Align the eval bar before you call it shared.** WEBNA's bar is DETERMINISTIC -- gates pass / build compiles / 0 high-severity issues / eval discrimination holds. That is pass/fail, NOT a 0-100 score. Your promptfoo goldens are 0-100. So "WEBNA >= 85" is not yet a real shared metric. Reconcile them: **deterministic gates as the hard pass/fail floor, PLUS a quality score on top** -- then ">= 85" means something both engines agree on.

---

# APPENDIX -- what transfers vs what does not (the honest map)

**TRANSFERS 1:1 (take these directly):**
- Engineering principles (A2), security (A4), smoothness patterns (A5) -- general TS engineering, apply as-is.
- @algoq/stdlib -- you already have the same package; import primitives, do not re-implement.
- The deterministic-gate philosophy (A3) -- the highest-leverage idea here: check structurally what you can, reserve the model for judgment.
- Model dispatch (B2), output budgets (B3), prompt-cache architecture (B4), the measurement protocol (B0/B1), the three efficiency levers (B6).

**DOES NOT TRANSFER (do not port these):**
- WEBNA's code-gen orchestration (pinned-base / body-fill pipeline) -- that solves "prompt -> running app", not "query -> reasoned answer." Your scored-fusion + methodology router is the right shape for your domain; keep it.
- Website-specific phases (UI polish / responsive / SEO) -- N/A to a reasoning engine.
- WEBNA has **no semantic cache** (your gap C) and **no general retrieval-grounding** (your gap D) to lend -- those are yours to build. They are also two of your biggest efficiency wins, so build them.

**WEBNA'S OWN OPEN TODOs (so you do not adopt our gaps as gospel):**
- Cache cost-folding -- we track cache tokens but cost them at full input price; the cache economics are not yet wired in (B4 caveat).
- Verifier down-tier -- identified as the #1 COGS waste and specced, but not yet shipped at the time of this hand-off.
- The scorecard's `purpose` / `outcome` fields -- the timing + cost columns are live and reconciling; the purpose/outcome enrichment is in progress this week.

---

*Hand-off prepared by the WEBNA engine audit track. Questions / version drift -> reconcile against WEBNA HEAD (currently 5c367f8, branch feat/reliability-engine-v3.1). This document supersedes the WEBNA-derived portions of WEBNA_STANDARDS.md (Apr 2026); AkhAI's own session-operating conventions in that file still stand.*
