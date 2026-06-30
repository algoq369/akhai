# WEBNA Alignment — Decision Record
> What we adopt from WEBNA_HANDOFF.md (WEBNA HEAD 5c367f8), in what order, and why.
> Date: 2026-06-30. This reorders LAUNCH_PLAN around WEBNA's #1 insight: INSTRUMENT FIRST.

## THE ONE REFRAME THAT CHANGES OUR ORDER
WEBNA's first law (B0): **you cannot optimize what you do not measure.** Build the per-call
scorecard BEFORE any token optimization. Our LAUNCH_PLAN had optimization (Phase C) but didn't
lead with the instrument. It now does. The scorecard is what makes gaps A–D measurable instead
of guesswork — and it directly proves each fix (cache via cacheRead/cacheCreation, budgets via
outTok, semantic cache via hit-rate).

## WHAT WE ADOPT (transfers 1:1 per the Appendix)
ENGINEERING (Part A → encode into SHIELD as gates):
- A2 non-negotiables: Zod every boundary · crypto tokens · secrets server-side+rotate ·
  build-fails-loud · errors-as-data · server-side enforcement · never-ship-incomplete.
- A3 deterministic-gate philosophy (THE highest-leverage idea): deterministic tooling catches
  STRUCTURAL bugs (free, certain); LLM reserved for JUDGMENT only. Never pay a model to check
  what a function can. Self-heal→recheck. Ultimate gate = "does it actually run?" — for AkhAI:
  does the reasoning EXECUTE and the answer GROUND against real sources (behavior, not intent).
- A4 security headers/audit · A5 retry+circuit-breaker+timeout on every external call (stdlib) ·
  A6 0 any/0 ts-ignore + <500-line files + stdlib · A7 one provider contract gated by eval.

TOKEN EFFICIENCY (Part B → our gaps A–D, measured against the scorecard):
- B0/B1 SCORECARD (build FIRST): {purpose, model, inTok, cacheRead, cacheCreation, outTok,
  durationMs, costUSD, outcome, objectiveMet}. Must RECONCILE (Σ tokens === reported total).
  outcome/objectiveMet derived from signals we ALREADY have (grounded? within budget? retried?).
- B2 model dispatch (gap B): every methodology carries a justified tier; CEILING on simple
  queries so a cheap query can never escalate to Opus. (Extends our existing direct→Haiku cascade.)
- B3 output budgets (gap B): per-methodology max_tokens, not flat 4096. Output = 4–5× input price.
- B4 prompt-cache architecture (gap A, PRIORITY): cache_control on the STABLE 9KB methodology
  prefix; date/web/fusion go AFTER the breakpoint or into the user turn. Measure via
  cacheRead vs cacheCreation. (WEBNA confirms our diagnosis is exactly right.)
- B5 cheapest-sufficient path: semantic cache (gap C — our biggest un-built lever) · ground
  SELECTIVELY (gap D reframed: skip NLI where parametric answers honestly) · stream for perceived latency.
- B6 levers: down-tier checkers · scope input (don't send whole transcript) · cut re-runs ·
  know margin per query · free tier hard-metered on cheapest model.

## WHAT WE DO NOT PORT (per Appendix)
- WEBNA's code-gen orchestration (pinned-base/body-fill) — wrong shape for a reasoning engine.
  Our scored-fusion + methodology router is correct for our domain. KEEP IT.
- Website-specific phases (UI/SEO) — N/A.
- Semantic cache (gap C) + retrieval-grounding (gap D) — WEBNA has neither to lend. OURS TO BUILD.
  (They're two of our biggest efficiency wins.)

## WHAT WE DO NOT INHERIT AS GOSPEL (WEBNA's own open TODOs)
- Cache cost-folding: WEBNA tracks cache tokens but costs them at full input price. We take the
  MEASUREMENT METHOD + PRINCIPLE (both proven), and wire the real 0.1×-read/1.25×-write economics
  ourselves (Anthropic-canonical).
- Verifier down-tier: specced, not shipped. We apply the principle directly (dispatch ceiling).
- "≥85 shared bar" ISN'T REAL YET: WEBNA is deterministic pass/fail, not 0–100. Reconcile (below).

## EVAL BAR RECONCILIATION (Part C.4)
Our promptfoo goldens = 0–100. WEBNA = deterministic pass/fail. The shared bar =
**deterministic gates as the hard pass/fail FLOOR + a quality score (0–100) on top.**
Then "≥85" means something both engines agree on: floor must pass AND score ≥85.

## REORDERED ENGINE SEQUENCE (supersedes LAUNCH_PLAN order)
```
1. INSTRUMENT   COGS per-call scorecard (B0/B1) — reconciling. THE FIRST MOVE.  ← next
2. AUDIT        A1 de-stub sweep + A2 methodology reality (now also captures per-method cost)
3. CACHE FIX    B4 / gap A — stable prefix; PROVE via cacheRead vs cacheCreation
4. DISPATCH     B2+B3 / gap B — per-method tier + ceiling + output budgets; measure outTok drop
5. SEMANTIC $   B5 / gap C — in-memory LRU semantic cache; measure hit-rate
6. SELECTIVE ⊕  B5 / gap D — ground only where factuality risk is real
7. STANDARDS    encode Part A into SHIELD as gates (rolling, throughout)
8. EVAL BAR     deterministic floor + quality score → real "≥85"
9. REFINE       router (E3) + retrieval (E4.1) + ReAct depth (E2) — from ENGINE_ROADMAP
10. HARDEN      S4 + code health → commercial-ready
```
Every step: behind a flag, measured before/after on the scorecard, reversible, localhost-verified,
gated by SHIELD. Same discipline that produced our current 105-test clean state and WEBNA's
106-commit verified state.

## WHY THIS IS THE EFFICIENT PATH
- Scorecard first = every later optimization is PROVABLE (a number for a partner), not claimed.
- Gap A (cache) is the biggest single token win and our stated priority — done early, measured.
- Semantic cache (gap C) is the biggest lever we don't have — built after the instrument exists.
- Standards→SHIELD = WEBNA's bar becomes ENFORCED, not aspirational.
- Nothing here needs hosting. All deploy-free. Launch timeline (mid–end Aug) intact.
