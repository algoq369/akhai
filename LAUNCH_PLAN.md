# AkhAI — Master Plan v2 (post-optimization · Fable-5-aware)
> Engine: audit → verify → optimize → **refine → harden → commercial**.
> Target: **Sept 5, 2026** launch (prime September). Commercial prep handled with partner.
> Updated: 2026-07-01 · HEAD ea6fe6b · 147 tests · eval bar PASS (floor 2/2, quality 100/100).
> All engine work deploy-free; hosting decision pending (not blocking).

## STATUS AT A GLANCE
```
Phase A · AUDIT      ✅ DONE  no live stubs · ToT verified multi-provider · SC relabeled honest
Phase B · VERIFY     ✅ DONE  15 tiered goldens → eval bar · 91→147 tests · regression locks
Phase C · OPTIMIZE   ✅ DONE  gaps A–D closed+MEASURED · cascade complete · SHIELD ratchets · eval bar
Phase D · REFINE     ✅ DONE(unblocked): D3+D3a+D4+D5 shipped+proven · D2 gated on box · D1 cuttable
Phase F · FABLE 5    ✅ RESOLVED — auditioned with data ($0.78), SKIP for launch; plumbing inert; F4 copy open
Phase E · HARDEN     ◕ 5/6: E1 Zod 0 · E2 103/135 · E3-retire done · E5 flipped · E7 closed · E4 in progress · E6.1 open(31)
```

## OPERATING LOOP (locked — produced the current clean state)
1. Read real code → design precisely (no guessing)
2. Hand cc the prompt → cc executes
3. Independently verify in repo (don't trust the report)
4. UI-touching → localhost → your eyes → only then deploy
5. Gate every commit: tsc 0 · vitest · SHIELD · Node 24.

## EVAL BAR (frozen-core gate — the unified ≥85 verdict)
`pnpm eval` (from packages/web) reconciles both engines into one number: a DETERMINISTIC FLOOR
(SHIELD `--fast` + the 2 honesty goldens — hype-suppression + Einstein fabrication-refusal — hard
pass/fail) AND a QUALITY SCORE (0–100 over the 13 correctness goldens). Verdict = floor PASS AND
quality ≥85. Milestone gate (needs :3000 + API budget); SHIELD `--fast` remains the per-push gate.
Run with Node 24 active (SHIELD); eval-bar switches to Node 22 internally for promptfoo.

═══════════════════════════════════════════════════════════════════
## R · REVIEW CLOSURE (this week — from the post-ban code review, F1–F5)
- [x] R1  quickharden (quick-query/route.ts, 1 pass): AbortSignal.timeout on callOpenRouterAlt (F2)
          · recordCall + real usage on the alt path (F3) · strip user EMAIL from prompt/PII to
          3rd-party free models (F4) · narrow the '400' fallback trigger to credit/402 (F5).
- [x] R2  autocache (F1, HIGH): 2nd response-cache check on the RESOLVED methodology (after fusion
          resolves 'auto'→direct/cod) — makes gap C actually fire on the main UI's 'auto' default.
          Live-prove twice-query $0 [CACHE HIT] on an 'auto' request.

## D · REFINE (resequenced)
- [x] D3a sc-multipath SHIPPED+PROVEN (92dc7cf; flip HOLD per F2 data 8/8=8/8 @2.96×): real N-sample self-consistency (the honest E1.2). Eval-gate vs single-pass
          on quality AND cost; adopt only if lift justifies N× cost. (agreed next after review)
- [x] D4  ReAct per-step streaming (E2): SHIPPED + user-verified live in browser (ff26ea9) — search/results/answer events, honest outage signal fired on real Brave 429, parallel-search ids held; react cost blindness found in the session and fixed (real $ + COGS). V2 candidates parked: pre-search signal (emit in tool execute), canvas step-nodes.
- [x] D5  prompt honesty pass (b042ccd): react flag-off no longer instructs simulated observations (knowledge-recall + never-fabricate); SC prompt aligned to audited buffer/validate structure; extraction dual-marker; honesty LOCKED by tests. 5/7 prompts verified clean. Chip: retire query-handler/process-query stale prompt copies (dead code).
- [ ] D2  retrieval into main path (E4.1)     ← GATED on Hetzner box.
- [ ] D1  learned router (E3)                  ← CUTTABLE (widest variance / needs training rig).

## F · FABLE 5 TRACK (new — optional frontier tier, eval-gated, flag-OFF default)
Facts: model id `claude-fable-5` · $10/M in · $50/M out (2× Opus 4.8) · $1/M cached (90% off) ·
1M ctx / 128k out · refusals return HTTP 200 stop_reason:'refusal' (server-side fallback in beta) ·
adaptive thinking always-on via `effort` param, NO raw CoT (4.6 thinking_delta path does NOT map) ·
30-day retention, NOT available under ZDR (conflicts with sovereignty promise → opt-in + disclosed).
- [x] F1  plumbing (flag OFF): MODELS.frontier='claude-fable-5' · refusal handling
          (stop_reason:'refusal' → auto-fallback Opus 4.8, COGS-tagged) · effort param · budgets row.
- [x] F2  eval A/B (DONE 2026-07-02, $0.78, 52 calls, 0 errors): 15 goldens + 5 long-horizon cases, Fable vs Opus on the eval bar + COGS
          objective-per-$ → adopt ONLY where lift > 2× cost. Candidates: Legend Mode, ToT synthesis,
          hardest long-horizon queries. NEVER direct/cod/quick (those stay Haiku).
- [x] F3  DECISION (made early, 2026-07-02, data-driven): SKIP for launch. F2 verdicts — SC HOLD
          (multi 8/8 = single 8/8 at 2.96×, no headroom, consistency signal noisy on correct answers)
          and FABLE SKIP (8/10 = 8/10 at 3.22× cost-per-pass, floor tie, no refusals, ~2× slower).
          Flags stay OFF · plumbing retained (inert, zero cost) · rematch parked post-launch with
          harder Part-A cases + premise-echo-exempt floor check. Original toggle plan (if adopted): Legend "Frontier" toggle w/ explicit 30-day-retention
          disclosure · Sovereign Mode HARD-excludes Fable. Decision ~Jul 20.
- [ ] F4  positioning: the June-ban story (frontier model gone 19 days by gov order, ~90min notice)
          = live proof of AkhAI's sovereignty thesis → launch copy.

## E · HARDEN (Aug 4–13)
- [x] E1  ZOD COMPLETE (04e0caf→09b60f6): 31→21→10→0 in three tranches. 33 schemas in pure lib/route-schemas.ts, 19 boundary tests, PII no-echo live-probed, cost-amplification caps live-probed, internal contracts preserved. TERMINAL ratchet 0 — every future body-reading route validates from birth. Remaining from original scope: CSP nonce · user_id audit (fold into E4 QA).
- [x] E2  Code health DONE (99aa398+4c80dd1): console 244→103 (incl. 2 secret-logging catches) · any 277→135 (laundering-audited) · file-splits formally HELD at ratchet 12 (post-launch lane) · Sentry hooks deferred post-launch.
- [ ] E3  E6.1 model strings: 31 hardcoded outside models.ts (measured 2026-07-05) → fold into MODELS constant. (Separate win under this label: dead-code retirement DONE 1534b9c, 2,743 lines + tree-wide SC honesty.)
- [ ] E4  Full QA sweep: all methodologies + all routes, fixed eval set, green.
- [x] E5  FLIPPED (2026-07-05): live agent is the DEFAULT for react — both states live-proven (no-flag → agent w/ 19-source answer + $0.044 COGS; =0 → knowledge-recall single-call, no Sources). Rollback: REACT_AGENT_LIVE=0 + restart. Auto→react exposure confirmed (fusion-scoring:176) — Brave 2k/mo quota rides the Aug-8 hosting/SearXNG decision.
- [x] E7  CLOSED (98bc671+4580875): history gate · URL-outage belt (+case-insensitive early) · sideCanal+gnostic.progressState sanitized from cached payloads · pageContext OUT of the stable prefix → GAP-A RESURRECTED for browser traffic (proven: cR=1285 across differing contexts) + sha256 key partition. layersWeights closed earlier. Original scope: conversationHistory, pageContext, per-user
          sideCanal.suggestions embedded in cached payloads, layersWeights, URL-fetch-failure window.
- [ ] E6  Hosting (WHEN DECIDED): provision, deploy, guard box → grounding upgrades heuristic→NLI.
          NOT on critical path — engine is launch-ready without it.

═══════════════════════════════════════════════════════════════════
## OPS TIMELINE (backwards from Sept 5)
```
this week   R1+R2 review closure · sc-multipath · F1 plumbing
~Jul 20     F2 eval A/B → F3 Fable adopt/skip decision
Aug 4–13    HARDEN phase (Zod, code health, QA)
Aug 8       HOSTING DECISION (hard external gate)
Aug 13      FROZEN CORE (eval bar ≥85 gates it)
Aug 15–30   marketing ramp (partner) · prod freeze+deploy Aug 30
Sep 5       LAUNCH
```
Buffer: optimization+audit+eval done well ahead of schedule. Router (D1) is the readiest cut.

## WHAT MAKES THIS EFFICIENT
- Every engine item deploy-free → hosting never blocks progress.
- cc executes, I verify → throughput without trust gaps.
- SHIELD gate (6 ratchets) → quality enforced automatically per push.
- Token work MEASURED on COGS scorecard → "more efficient" is provable, not claimed.
- Fable integrates via existing machinery (stable-prefix cache exploits its $1/M cached reads;
  budgets cap its 128k output; eval bar + COGS make the 2×-worth-it question empirical) and
  flag-off + Opus auto-fallback means a second ban costs nothing.

## DELIVERABLES BEFORE LAUNCH
Engine: audit-clean · all 7 methodologies real+tested · token-optimized (measured) · cascade complete ·
citations · optional Fable frontier tier (eval-gated) · WEBNA standards enforced by SHIELD · eval ≥85.
Commercial prep: handled with partner (out of engine scope).
