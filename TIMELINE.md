# AkhAI — Launch Timeline (backwards-planned from Sep 5, 2026)
> Verified 2026-06-30. Target launch: Sat Sep 5, 2026 → prime September operating window.
> 67 calendar days · ~9.6 weeks · ~28–38 focused sessions remaining. Feasible with the planned scope.
> NOTE on the old plan: the original June-4 website-launch date slipped as the engine deepened
> (security audit, real ReAct, grounding, cost cascade — all real, all verified). Sep 5 is the
> new realistic target; this doc adapts every milestone to it.

## THE KEY ANSWER: MARKETING STARTS ~AUGUST 10
Marketing does not wait for the engine to be 100% done — it starts once the CORE is feature-complete,
optimized, and demo-stable. That lands ~Aug 10 (wk +5/6), giving ~3.5 weeks of runway before launch.
Hardening + the personal API finish DURING the marketing window. Commercial prep runs with the partner.

## BACKWARDS-PLANNED MILESTONES
```
Tue Jul 21  (wk +3)  Engine OPTIMIZATION complete
                     scorecard → cache fix (gap A) → dispatch+budgets (gap B) →
                     semantic cache (gap C) → selective grounding (gap D). All MEASURED.
Tue Aug 04  (wk +5)  Engine REFINEMENT complete
                     learned router (E3) · retrieval into main path (E4.1) · ReAct depth (E2).
Mon Aug 10  (wk +6)  ►► MARKETING STARTS ◄◄
                     Core feature-complete + optimized + stable demo. Partner begins commercial push.
                     (Engine hardening continues in parallel — does not block marketing.)
Tue Aug 18  (wk +7)  HARDENING + PERSONAL API complete
                     S4 (Zod/CSP/user_id) + code health (E7) · personal AkhAI API (key issuance +
                     metering, priced from the COGS scorecard).
Tue Aug 25  (wk +8)  HOSTING CUTOVER + FULL QA
                     ⚠️ HOSTING DECISION MUST BE RESOLVED BY HERE (FlokiNET fix or switch to Hetzner).
                     Provision, deploy standalone build, guard box → grounding heuristic→NLI upgrade.
                     Full QA sweep: all 7 methodologies + all routes, fixed eval set, green.
Tue Sep 01  (wk +9)  LAUNCH BUFFER / final polish — absorb slippage, final checks.
Sat Sep 05  (wk +9)  ►►► LAUNCH ◄◄◄
```

## SESSION BUDGET CHECK (is this real?)
- Available: ~28–38 focused sessions (3–4/week × 9.6 weeks).
- Needed: ~20–28 sessions (engine optimize+refine+harden+API per ENGINE_ROADMAP estimate, ~34–46 hrs).
- Margin: ~8–10 sessions of buffer. Tight but realistic IF focus holds and scope doesn't expand.

## RISKS TO THE DATE (honest)
1. HOSTING is the #1 risk. FlokiNET is still down; a host decision must land by ~Aug 25 to deploy in
   time. This is the ONE external dependency that can move the date. Engine work is unaffected, but
   LAUNCH needs a live host. → Decide host by mid-August at the latest.
2. E3 learned router is the widest-variance engine item (8–12 hrs; data-quality dependent). If it
   slips, ship with the current keyword router (already works well) and add the learned router
   post-launch. It is an UPGRADE, not a launch blocker. De-risks the date.
3. Sep 5 is a SATURDAY. For launch-day mechanics (support, monitoring, press), consider Thu Sep 3 or
   Tue Sep 8. Flagged for the commercial partner's input.
4. Personal API + fine-tuning env depend on the sovereign-GPU/hosting decision; if deferred, launch
   with the hosted-provider engine (fully functional) and add self-hosted inference post-launch.

## WHAT MUST BE TRUE TO START MARKETING (Aug 10 gate)
- All 7 methodologies real + tested (no stubs). ✓ in progress (SB/S2/E1.1 done).
- Token-optimized + MEASURED (scorecard proves the numbers — a story for the partner).
- Grounding shows a real score (in-process heuristic already does; NLI upgrade later).
- Stable, fast, demoable end-to-end. SHIELD green. ≥85 quality bar.
- A live or near-live deployment to demo against (hosting decision feeding in).

## BOTTOM LINE
Launch Sep 5 is achievable from today's verified state (105 tests, engine strong). The pacing item is
the ~6 weeks of engine optimize+refine to reach the Aug 10 marketing gate. The pacing RISK is hosting,
which must be decided by ~mid-to-late August. Everything else is deploy-free and on track.
