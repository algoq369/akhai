# AkhAI — Efficient Path to Commercial Launch
> Engine: audit → verify → optimize → refine → commercial-ready.
> Target: mid–end August 2026 launch, prime September. Commercial prep handled with partner.
> Date: 2026-06-29 · HEAD bae8ae6 · 105 tests · all deploy-free (hosting decision pending, not blocking).

## TIMELINE (engine work — ~6 weeks to launch-ready)
```
Now → mid-Aug : engine audit + optimization + refinement (Phases A–E below)
mid–end Aug   : commercial launch (with partner handling commercial prep)
September     : prime operating window
```
Pace basis: this session shipped 6 verified engine commits in clean focused blocks. Estimated
~34–46 engine-hours remain → ~15–18 focused sessions → comfortably inside 6 weeks with buffer.

## OPERATING LOOP (locked — produced the current clean state)
1. Read real code → design precisely (no guessing)
2. Hand cc the prompt → cc executes
3. Independently verify in repo (don't trust the report)
4. UI-touching → localhost → your eyes → only then deploy
5. Tick plan, next step. Gate every commit: tsc 0 · vitest · SHIELD · Node 24.

═══════════════════════════════════════════════════════════════════
## PHASE A · AUDIT (find every gap — ~1 session)
- [ ] A1  De-stub sweep (E5.4): grep engine for placeholder/sim/hardcoded-that-should-compute
          patterns (like fact:0 was). Output: list of remaining fakes.
- [ ] A2  Methodology reality audit (E5.1/E5.2): live-test all 7 like we did sc/react. Confirm
          ToT actually calls multiple providers; PaS/CoD real. Flag any simulated.
- [ ] A3  Token audit: measure real tokens/cost per methodology on a fixed query set. Baseline
          numbers for the optimization phase (gaps A–D in WEBNA_BRIEFING).
- [ ] A4  WEBNA standards intake: once received, diff WEBNA's rules vs current SHIELD gates.

## PHASE B · VERIFY (prove what works — ongoing, built into every step)
- [ ] B1  Per-methodology promptfoo golden suite (E4.5): each of the 7 gets golden cases → CI gate.
- [ ] B2  Grounding accuracy check: heuristic scorer vs known supported/fabricated answers.
- [ ] B3  Regression lock: every fix gets a test so it can't silently return (proven pattern).

## PHASE C · OPTIMIZE (token + speed efficiency — ~2-3 sessions)
- [ ] C1  PROMPT CACHE FIX (highest token ROI): restructure systemPrompt so the stable 9KB
          methodology block is the cached prefix; move date/web/fusion content AFTER it or into
          the user turn. Measure cache-hit rate before/after.
- [ ] C2  Per-methodology max_tokens: replace flat 4096 with right-sized output budgets
          (direct small, tot large). Measure output-token reduction.
- [ ] C3  Semantic cache (E4.3): in-memory LRU keyed on query embedding, conservative threshold
          → skip LLM on similar repeats. Measure hit rate + cost saved.
- [ ] C4  Prompt-cache coverage audit (E4.4): ensure tool schemas + methodology all cached.
- [ ] C5  Apply WEBNA token-efficiency standard once received; re-measure.
  Target: report token/query before vs after across all 7 methodologies.

## PHASE D · REFINE (sharpen intelligence — ~4-5 sessions)
- [ ] D1  Learned router (E3): Langfuse export → ModernBERT → shadow → flip only if it beats
          keyword scorer on goldens. Includes A15 determinism fix.
- [ ] D2  Retrieval into main path (E4.1): Qdrant/BM25 so ALL queries get grounded context,
          not just react → grounding meter applies broadly.
- [ ] D3  In-process factuality depth (E1.2/E1.3): SC cross-path confidence, citation enforcement.
- [ ] D4  ReAct depth (E2): per-step canvas streaming, multi-tool (fetch/calculator), telemetry.
- [ ] D5  Methodology prompt consistency (E5.3) + adopt any WEBNA engine patterns.

## PHASE E · COMMERCIAL-READY (harden + finish — ~2-3 sessions)
- [ ] E1  WEBNA hardening (S4): Zod on remaining routes, CSP nonce, user_id audit, ESLint rule
          → WEBNA quality bar ≥85 (using WEBNA's own metric once aligned).
- [ ] E2  Code health (E7): ratchet down console/any, split touched large files, Sentry hooks.
- [ ] E3  Cleanup (E6): fold remaining model strings into MODELS constant.
- [ ] E4  Full QA sweep: all methodologies + all routes, fixed eval set, green.
- [ ] E5  Flag flips: REACT_AGENT_LIVE → default (after box or in-process grounding proven).
- [ ] E6  Hosting (WHEN DECIDED, partner/your call): provision, deploy, guard box → grounding
          upgrades heuristic→NLI. NOT on critical path — engine is launch-ready without it.

═══════════════════════════════════════════════════════════════════
## EFFICIENT ORDER (maximize value, minimize risk)
A1+A2 (audit fakes) → C1 (cache fix, biggest token win) → A3 baseline + measure →
B1 (eval gate) → D1 (router) → D2 (retrieval) → C2/C3 (budgets+cache) → E (harden) → launch.
Rationale: kill fakes first (don't build on stubs), then the single biggest token win (cache),
then lock quality with evals, then upgrade intelligence, then harden for commercial.

## WHAT MAKES THIS EFFICIENT
- Every item deploy-free → hosting never blocks progress.
- cc executes, I verify → throughput without trust gaps.
- SHIELD gate → quality enforced automatically, no manual policing.
- WEBNA alignment folded into Phases A/C/D/E → standards become enforced gates, not aspirations.
- Token work is MEASURED (before/after) → "more efficient" is provable, not claimed.

## DELIVERABLES BEFORE LAUNCH
Engine: audit-clean (no stubs), all 7 methodologies real + tested, token-optimized (measured),
learned routing, broad grounding, WEBNA-aligned standards enforced by SHIELD, ≥85 quality bar.
Commercial prep: handled with partner (out of engine scope).
