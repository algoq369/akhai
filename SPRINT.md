# AKHAI FINISH-LINE SPRINT — living todolist
> Updated after EVERY step. Target: fully refined, functional, fast+secure before Aug 2, 2026.
> Legend: [ ] todo · [~] in progress · [x] done · [!] blocked/needs-you · [-] deferred (logged)
> Rule: UI-touching → localhost → your eyes → FlokiNET. Backend-only → gates → :3001 → cutover.
> Gate every commit: tsc 0 · vitest 91/91 · SHIELD pass.

LAST UPDATED: 2026-06-11 (S0 COMPLETE) · HEAD 575be40

---

## S0 · BANK AT-RISK WORK (do first — uncommitted, one `git checkout` from gone)
- [x] S0.1  Build-verify orphaned Block 2 wallet-defer (wallet-bus + render-predicates + wallet/) — confirm home ≤299 kB
- [x] S0.2  Commit it as proper Block 2 commit (6 mod + 4 new files)
- [x] S0.3  Deploy to FlokiNET (UI-touching → localhost eyes first)
- [x] S0.4  Archive strays: AUDIT.md + docs/AUDIT_CLI_PROMPTS.md + docs/FINAL_AUDIT_CHECKLIST.md → docs/archive/

## S1 · BLOCK 3 — REAL GUARD (finish; foundation already pushed 32e9c94)
- [!] S1.1  Provision EU CPU box (Hetzner CX22 ~€4/mo) — YOU (10 min, guard-service/README.md is copy-paste)
- [ ] S1.2  Deploy guard-service to that box; set GUARD_NLI_URL + GUARD_NLI_TOKEN on FlokiNET .env.local
- [ ] S1.3  Grounding meter UI in Side Canal (consume `grounding` stage event; show supported %, mode badge) — localhost eyes
- [ ] S1.4  Highlight unsupported spans in answer (from spans payload)
- [ ] S1.5  Verify end-to-end: real score appears on a grounded query in prod
- [-] S1.6  Async MiniCheck Tier-2 (high-stakes only) — deferred to post-launch unless time in buffer

## S2 · BLOCK 4 — REAL ReAct (also unlocks S1 context feed)
- [ ] S2.1  Adopt Vercel AI SDK ToolLoopAgent in a server route (spike, one tool)
- [ ] S2.2  SearXNG self-hosted on the guard box (EU search) + Brave API fallback wired
- [ ] S2.3  Replace simulated ReAct prompt with real tool loop; kill "even if simulated"
- [ ] S2.4  Stream tool steps to canvas over existing SSE (depth-annotated stages)
- [ ] S2.5  Cost/latency caps: stepCountIs + per-query token budget
- [ ] S2.6  Feed retrieved tool context into scoreGroundingAsync (closes S1 grounded-mode loop)
- [ ] S2.7  Gates + localhost eyes + deploy

## S3 · BLOCK 5 — LEARNED ROUTER (+ fixes A15 non-determinism)
- [ ] S3.1  Export ~1k labeled queries from Langfuse traces (methodology labels)
- [ ] S3.2  Fine-tune ModernBERT-base router (Apache-2.0); ONNX/CPU export
- [ ] S3.3  Deploy as CPU sidecar (guard box or VPS if RAM allows)
- [ ] S3.4  Shadow mode: log router vs keyword scorer disagreement to Langfuse
- [ ] S3.5  Promptfoo eval: flip ONLY if router beats keyword scorer
- [ ] S3.6  A15: make layer activation deterministic (seed or remove Math.random noise)

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
- 2026-06-11: sprint created from V6. Done before sprint: P0+P1, Block1, Block2 core, Block3 foundation (32e9c94).
- 2026-06-11: S0.1/S0.2 done — wallet-defer refactor committed (36200b4), bundle steady 299kB. S0.4 done — strays archived. S0.3 on localhost for eyes.
- 2026-06-11: S0.3 shipped to FlokiNET (Ready 534ms, TTFB 0.17s). S0 COMPLETE. Next: S1 (guard) — S1.3 grounding meter UI is local/no-box, S1.1 box provision = you.
