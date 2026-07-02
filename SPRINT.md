# AKHAI FINISH-LINE SPRINT — living todolist
> Updated after EVERY step. Target: fully refined, functional, fast+secure before Aug 2, 2026.
> Legend: [ ] todo · [~] in progress · [x] done · [!] blocked/needs-you · [-] deferred (logged)
> Rule: UI-touching → localhost → your eyes → FlokiNET. Backend-only → gates → :3001 → cutover.
> Gate every commit: tsc 0 · vitest 91/91 · SHIELD pass.

LAST UPDATED: 2026-06-29 (SB block + S2 done) · HEAD 13580c0 · 101 tests · live-verified: cascade→Haiku, ReAct agent real search, SC multi-path · NOTE: WEBNA-the-tool merge = separate future master-plan item; S4 'WEBNA' here = quality bar only, pending user's WEBNA standards sync

---

## S0 · BANK AT-RISK WORK (do first — uncommitted, one `git checkout` from gone)
- [x] S0.1  Build-verify orphaned Block 2 wallet-defer (wallet-bus + render-predicates + wallet/) — confirm home ≤299 kB
- [x] S0.2  Commit it as proper Block 2 commit (6 mod + 4 new files)
- [x] S0.3  Deploy to FlokiNET (UI-touching → localhost eyes first)
- [x] S0.4  Archive strays: AUDIT.md + docs/AUDIT_CLI_PROMPTS.md + docs/FINAL_AUDIT_CHECKLIST.md → docs/archive/

## S1 · BLOCK 3 — REAL GUARD (finish; foundation already pushed 32e9c94)
- [!] S1.1  Provision EU CPU box (Hetzner CX22 ~€4/mo) — YOU (BLOCKED: also waiting FlokiNET access)
- [!] S1.2  Deploy guard-service + set GUARD_NLI_URL on FlokiNET — BLOCKED on FlokiNET outage
- [x] S1.3  Grounding meter UI (b846974) — ⊕ GROUNDING row, parametric works box-free, gates pass, on localhost
- [ ] S1.4  Highlight unsupported spans in answer (from spans payload)
- [!] S1.5  Verify grounded score in prod — BLOCKED on FlokiNET + box
- [-] S1.6  Async MiniCheck Tier-2 (high-stakes only) — deferred to post-launch unless time in buffer

## S2 · BLOCK 4 — REAL ReAct (also unlocks S1 context feed)
- [x] S2.1  (3123600) real ReAct agent loop — AI SDK 6 + real Brave/DDG search, 101 tests
- [ ] S2.2  SearXNG self-hosted on the guard box (EU search) + Brave API fallback wired
- [x] S2.3  (13580c0) de-simulated react copy; real agent wired live behind REACT_AGENT_LIVE flag
- [~] S2.4  reasoning stage emitted on agent start; richer per-step streaming = polish (S2 follow-up)
- [ ] S2.5  Cost/latency caps: stepCountIs + per-query token budget
- [x] S2.6  (13580c0) agent sources fed to scoreGroundingAsync — grounded mode wired (lights up when box live)
- [x] S2.7  gates green, localhost-verified: real Brave searches + query reformulation confirmed in logs; deploy pending FlokiNET

## S3 · BLOCK 5 — LEARNED ROUTER (+ fixes A15 non-determinism)
- [ ] S3.1  Export ~1k labeled queries from Langfuse traces (methodology labels)
- [ ] S3.2  Fine-tune ModernBERT-base router (Apache-2.0); ONNX/CPU export
- [ ] S3.3  Deploy as CPU sidecar (guard box or VPS if RAM allows)
- [ ] S3.4  Shadow mode: log router vs keyword scorer disagreement to Langfuse
- [ ] S3.5  Promptfoo eval: flip ONLY if router beats keyword scorer
- [ ] S3.6  A15: make layer activation deterministic (seed or remove Math.random noise)

## SB · BACKEND PERFECTION (found by live engine test 2026-06-11 — deploy-free, do now)
- [x] SB.1  (bb7f90f) killed fact:0 stub — guardResult.scores.fact hardcoded 0 now CONFLICTS with honest grounding meter (two factuality signals). Remove/replace fake fact score.
- [x] SB.2  (651a1f6) word-boundary regex + regression test, 95 tests — "capital of Iceland" → react (heaviest path). Trivial factual Qs must not hit search methodology. Tune fusion scorer threshold (react is simulated so answer was right, but wasteful).
- [ ] SB.3  No cost cascade — NEXT substantive backend item (fold in model-constant extraction) — premium Opus 4.7 runs EVERY query incl. trivial ($0.004 for a capital lookup). Implement cheap-first cascade (Booster B5): simple→Haiku/Scaleway, escalate on complexity.
- [x] SB.4  (9e564f0) labels fixed + (67c3dcd) whole stack → Opus 4.8 incl Legend Mode, 21 sites — provider.model "claude-opus-4-7" vs reasoning text "Opus 4.6". Fix label.
- [x] SB.0  VERIFIED engine works: correct answer, full pipeline (routing→guard→sideCanal→miniCanvas), grounding meter wired to stream. Backend is FUNCTIONAL, these are refinements.

## S4 · BLOCK 6 — WEBNA CLOSE-OUT (security/quality to ≥85)
- [ ] S4.1  Zod on remaining routes: settings, enhanced-links, depth-extract
- [ ] S4.2  CSP single-source + nonce (kill next.config duplicate)
- [ ] S4.3  Gitleaks/osv-scanner in shield --full
- [ ] S4.4  Audit 20× `user_id IS NULL` queries (cross-user scope safety)
- [ ] S4.5  ESLint no-restricted-imports (lib/db/* from components)
- [ ] S4.6  A5 checkCryptoQuery: undefined change24h guard + narrow futureKeywords + de-hardcode coins
- [ ] S4.7  A7 SQLite timestamp unification · A11 remove 2+2=5 toy check

## S5 · BLOCK 7 — POLISH + BUFFER (10 sessions reserved)
- [ ] S5.1  A12 Sentry hooks (onRouterTransitionStart, captureRequestError) + silence arboreal migration warn
- [ ] S5.2  A8 gate [FUSION_DEBUG]/console behind NODE_ENV (shield blocks new ones already)
- [ ] S5.3  Mobile pass · onboarding · pricing flow · copy
- [ ] S5.4  Full QA sweep across all 33 routes
- [ ] S5.5  EXTRA REFINEMENT BUFFER (the things we'll discover) — lives here by design
- [ ] S5.6  W9 launch ops: Reown dashboard allowlist akhai.app · TWITTER_CLIENT_ID/SECRET on VPS

## NON-ENG PARALLEL (YOU, off critical path)
- [!] P.1  Norwegian AS incorporation before Sep 2026 (SkatteFUNN)
- [!] P.2  Innovasjon Norge / NATO DIANA applications

---

## ⚠️ FLOKINET OUTAGE (2026-06-11) — host unreachable, support contacted
Verified NOT our code: site was 200 same session, traceroute dies before FlokiNET (host down). DNS/internet fine.
BLOCKED until host returns: S1.2, S1.5, any redeploy, S5.6 VPS env.
DO-NOW (no deploy, localhost+GitHub only): S4 (Zod/CSP/user_id/ESLint), S2.1 (ReAct spike), S3.6/A15, A5.
All work done now ships in one batch when FlokiNET returns.

## DEGRADATION LADDER (protects Aug 2 if a hard block slips)
1. Router stays shadow-only (keyword scorer live — zero user impact)
2. MiniCheck Tier-2 deferred
3. Guard/router classifiers → the €4 CPU box (not 1GB VPS)
Launch-critical core = S0 + S1 + S2 + S4. S3 is reversible. S5 is buffer.

## DEFINITION OF FINISHED (Aug 2)
≤450 kB all 33 routes · real grounding meter live · ReAct executing visible real searches ·
learned router live-or-shadow · 0 crit/high held by CI · evals green per-commit ·
51/51 routes Zod · deploys ship own runtime · nav transitions instant · WEBNA ≥85.

## CHANGELOG
- 2026-06-29 (cont): SB block complete (SB.1/2/3/4) + Opus 4.8 bump + S2 complete (real ReAct agent live behind flag, sources→grounding). 101 tests. Live-verified on localhost: cost cascade routes direct→Haiku, ReAct agent fires real Brave searches with query reformulation, SC produces multi-path reasoning. Zero backend errors. Remaining for grounding score: provision €4 guard box (S1.1/S1.2).
- 2026-06-29: SB.1 (fact:0 stub killed), SB.2 (routing over-escalation fixed +regression test → 95 tests), SB.4 (labels fixed), then whole model stack bumped Opus 4.7→4.8 incl Legend Mode (21 sites, 16 files). All cc-executed + independently verified. SB.3 cascade is last substantive backend item. FlokiNET still down (host switch pending).
- 2026-06-11: sprint created from V6. Done before sprint: P0+P1, Block1, Block2 core, Block3 foundation (32e9c94).
- 2026-06-11: S0.1/S0.2 done — wallet-defer refactor committed (36200b4), bundle steady 299kB. S0.4 done — strays archived. S0.3 on localhost for eyes.
- 2026-06-11: S0.3 shipped to FlokiNET (Ready 534ms, TTFB 0.17s). S0 COMPLETE.
- 2026-06-11: S1.3 grounding meter built + committed (b846974), gates green, on localhost. Parametric mode renders box-free.
- 2026-06-11: FlokiNET host went unreachable (infra outage, not code). S1.2/S1.5/redeploy blocked.
- 2026-06-11: LIVE ENGINE TEST — works, correct high-quality answer, full pipeline populated, S1.3 grounding wired to stream. Found 4 backend refinements → new SB block (fact:0 stub conflict, routing over-escalation, no cost cascade, model label). Backend-perfection focus per user.

- 2026-07-01: FULL WEBNA-ALIGNED SPRINT COMPLETE + post-ban review. Gaps A(proven live)/B/C/D closed+measured on COGS · SC honesty relabel · 3 WEBNA ratchets→SHIELD · eval bar built+4 fixes → first live verdict floor 2/2 quality 100/100 PASS · cascade sweep (quick-query→Haiku proven ~10×, canvas-viz→budget, topic-suggestions right-sized) · E1.3 citations (147 tests). Post-ban code review found F1–F5 (autocache + quickharden pending). Fable 5 restored July 1 → Master Plan v2 adds F-track (optional frontier tier, eval-gated, flag-off). See LAUNCH_PLAN.md v2. 91→147 tests, HEAD ea6fe6b. Next: R1 quickharden → R2 autocache → sc-multipath → F1.
- 2026-07-02: REVIEW TRACK CLOSED — R1 quickharden (3b037ed: timeout/COGS/email-PII/narrowed fallback), R2 autocache (0a80ef8: resolved-methodology check, PROVEN LIVE 12.07s→0.32s, $0 CACHE HIT on 'auto'), totfix (2237944: tot out of allowlist + populate guarded on sideCanalContext). cc-on-Fable-5 adversarial verify corrected a false premise in the R2 spec (tot fallback DOES reach populate) — verify-everything working both directions. 148 tests. Next: sc-multipath, then F1 Fable plumbing.
