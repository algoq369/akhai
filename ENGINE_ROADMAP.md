# AKHAI ENGINE ROADMAP — pure engine development (hosting excluded)
> All tasks below are deploy-free: built + verified on localhost, pushed to GitHub.
> Hosting/server work is OUT OF SCOPE here (waiting on FlokiNET response).
> Updated 2026-06-29 · HEAD bb2d9a6 · 101 tests. Gate every commit: tsc 0 · vitest green · SHIELD pass · Node 24.

## ✅ DONE THIS ARC (engine refinement)
- SB.1 killed fake fact:0 stub · SB.2 routing over-escalation fixed · SB.4 labels · Opus 4.8 bump
- SB.3 cost cascade (direct→Haiku) + MODELS constant
- S2.1 real ReAct agent (AI SDK 6 + real search) · S2.2 wired live behind flag + sources→grounding
- Live-verified: cascade, real ReAct search w/ reformulation, SC multi-path. Zero errors.

═══════════════════════════════════════════════════════════════════
## E1 · GUARD / FACTUALITY — make the meter real (engine side)
The agent already captures sources; grounding-client is wired. These are the ENGINE pieces
that don't need the box (the box itself is hosting, excluded):
- [ ] E1.1  MiniCheck-style fallback factuality scorer that runs IN-PROCESS (no external box) —
            cheap NLI/entailment on answer-vs-sources, so a grounding score shows even without the box.
            (Pure lib + AI SDK; gives degraded-but-real score now, full LettuceDetect later.)
- [ ] E1.2  Self-consistency confidence: when methodology=sc, derive a real confidence number from
            cross-path agreement (the paths already exist in the SC output) → surface in meter.
- [ ] E1.3  Citation enforcement: when react sources exist, require/great answers to reference them;
            flag unsupported sentences inline (extends the existing span-highlight UI).

## E2 · ReAct AGENT — depth + polish (S2 follow-ups)
- [ ] E2.1  Stream each tool step to canvas as its own depth-annotated stage (search query → results →
            reasoning), not just the single "agent started" event. (Richer S2.4.)
- [ ] E2.2  Multi-tool agent: add a fetch/read-page tool (read full article, not just snippet) + a
            calculator tool. Gate tools per query type.
- [ ] E2.3  Agent cost/step telemetry surfaced (steps taken, searches run, tokens) in metadata tab.
- [ ] E2.4  Decide flag→default: once box live + verified, flip REACT_AGENT_LIVE on for react methodology.

## E3 · ROUTER — learned methodology selection (replaces keyword scorer)
- [ ] E3.1  Export ~1k labeled queries from Langfuse traces (methodology labels).
- [ ] E3.2  Fine-tune ModernBERT-base router (Apache-2.0); ONNX/CPU export, runs in-process or sidecar.
- [ ] E3.3  Shadow mode: log router vs keyword-scorer disagreement; no behavior change yet.
- [ ] E3.4  Promptfoo eval gate: flip to router ONLY if it beats keyword scorer on goldens.
- [ ] E3.5  A15 — make layer activation deterministic (seed or remove Math.random noise in
            intelligence-fusion-scoring.ts:50 / meta-core-protocol.ts:476 / retry jitter is fine).

## E4 · PIPELINE INTELLIGENCE — depth of reasoning
- [ ] E4.1  Real retrieval into the main path: wire Qdrant/BM25 hybrid retrieval so non-react queries
            also get grounded context (currently only react has sources). Feeds grounding meter broadly.
- [ ] E4.2  Cascade tuning: expand budget tier beyond `direct` (e.g. cod) with eval proof per step.
- [ ] E4.3  Redis-or-in-memory semantic cache: skip LLM on semantically-similar repeat queries
            (conservative threshold; engine-side, no infra dep if in-memory LRU first).
- [ ] E4.4  Prompt-cache coverage audit: ensure system+methodology+tool schemas all cached (TTFT/cost).
- [ ] E4.5  Per-methodology eval suite in promptfoo (each of the 7 gets golden cases) → CI quality gate.

## E5 · METHODOLOGY QUALITY — sharpen each of the 7
- [ ] E5.1  ToT consensus: verify the multi-AI advisor path actually calls multiple providers (audit;
            may be single-provider like react was). Fix if simulated.
- [ ] E5.2  PaS (plan-and-solve) + CoD (chain-of-draft): live-test each like we did sc/react; fix gaps.
- [ ] E5.3  Methodology prompt consistency pass: UNIVERSAL_STRUCTURE_INSTRUCTION audit across all 7.
- [ ] E5.4  De-stub sweep: grep the whole engine for placeholder/sim patterns like fact:0 was
            (returns 0, "simulated", TODO, hardcoded constants that should compute).

## E6 · OUT-OF-SCOPE-CLEANUP carried from SB.3
- [ ] E6.1  Fold remaining hardcoded model strings (sonnet-4-6, haiku in llm-extractor/god-view/
            side-canal/web-browse) into MODELS constant — finish the single-source-of-truth.

## E7 · CODE HEALTH (engine internals, deploy-free)
- [ ] E7.1  Ratchet down: console_log 323→ lower (gate behind NODE_ENV), any_types 291→ lower in touched files.
- [ ] E7.2  Large-file split for engine files ≥500 lines that we actively edit (query-pipeline,
            multi-provider-api) — only when touched, per V6 rule.
- [ ] E7.3  Sentry hooks (onRouterTransitionStart, captureRequestError) + silence arboreal migration warn.

═══════════════════════════════════════════════════════════════════
## RECOMMENDED ENGINE ORDER (no hosting needed for any of it)
1. E1.1  in-process factuality scorer  → grounding meter shows a REAL score TODAY, no box
2. E5.4 + E5.1  de-stub sweep + ToT audit  → find/fix any other fakes like fact:0
3. E3.5 (A15) + E3.1-E3.3  router shadow mode  → learned routing, reversible
4. E4.1  Qdrant retrieval into main path  → grounding applies to ALL queries, not just react
5. E2.1  per-step canvas streaming  → the visual payoff of the real agent
6. E6.1 + E7.x  cleanup as capacity allows

## NOTE
- E1.1 is the highest-leverage no-box move: it makes the grounding meter honest NOW using an
  in-process scorer, so you stop waiting on hosting to see real factuality. The external
  LettuceDetect box (hosting) becomes an upgrade, not a blocker.
- Everything here is gated, reversible, and shippable to GitHub independent of FlokiNET.
