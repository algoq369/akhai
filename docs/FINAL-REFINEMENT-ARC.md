# AkhAI - Final Refinement Arc (M1-M5)

> Planned 2026-07-13. Vision-locked, sequenced for correctness (not deadline).
> Precedes launch. Each milestone = its own verified `go` lane, in order.

## M1 - HONESTY: relabel sc/cod/pas to runtime truth  [S - READY]
Audit brand-existential finding. thought-stream.ts:161-165 (sc "voting" + dead bot/pot keys),
methodology-data.ts:58 (cod "92% savings" - false), MethodologyExplorer.tsx:178 (pas "runs code" - false).
FIX: copy matches runtime. sc -> "structured multi-angle single pass"; cod -> drop false metric, describe
real refine loop; pas -> "plans then solves step-by-step (no code execution)". Dead core impls stay dead.
LANE: go methodology-relabel

## M2 - SELECTOR PRECISION: keyword-lists -> embedding routing  [M - foundation]
Audit: selector ~55% accurate. Every "engine decides" feature depends on this.
FIX: embedding-similarity routing (query vs per-methodology exemplar centroids), confidence score,
local embeddings if feasible. Target >=85% on the audit's 20-query table + expanded set.
DEPENDENCY: unblocks M4a ranking + any smart-recommender. LANE: go selector-embeddings

## M3 - AKHAI VOICE: eloquent, precise, economical  [M - quality]
Less verbose, more deliberate. A STYLE CONTRACT injected into generateEnhancedSystemPrompt, tested vs a
voice golden set; must not harm correctness goldens. NEEDS: Algoq north-star (writer/sample sentence).
LANE: go voice-contract (blocked on anchor)

## M4 - LIVING MINDMAP: 3D light-tunnel + dual-model curation  [XL - flagship]
M4a RANK (intelligence): hover -> top-3 richest related queries. NEEDS: "rich" metric weights
  (connection-count x guard-quality x depth x substance). LANE: go mindmap-rank
M4b TUNNEL (visual): fly into the connection, dots linked by subject-colored light-strands
  (education/crypto/finance/esoteric-occult/society/holistic-medicine...). DECISION: full WebGL (Three.js)
  vs 2.5D depth+glow (recommend 2.5D first). Renders only the 3 paths, not full graph. LANE: go mindmap-tunnel
M4c CURATOR (living): Opus4.8 + Sonnet analyze history; 3/6/9-day audits grow the map (new dots/links/
  merges). DECISIONS: produces-what, scheduled (VPS cron) vs on-demand, cost model (owner/Legend-gated
  recommended). Append-only proposals the user accepts; idempotent; never corrupts graph. LANE: go mindmap-curator

## M5 - PHILOSOPHY PAGE: technology as instrument for consciousness  [M - content+design]
Reframe partner -> instrument for human consciousness development. Metaphysics of intelligence + mystery;
ancient knowledge, time/space correlation, cosmology, soul refinement, unicity, mindfulness. In M3 voice.
DECISIONS: authorship (Algoq-written + Claude-edited vs AkhAI-generated + approved); credibility stance
(document belief "these traditions held..." vs assert astrology/cosmology as truth - recommend documented,
sourced, mystery acknowledged without unfalsifiable claims). LANE: go philosophy-page (blocked on decisions)

## ORDER: M1 -> M2 -> M3 -> M4a -> M4b -> M4c -> M5
Honesty first; selector before anything that decides; voice before the page written in it; mindmap
intelligence -> visual -> curation; philosophy last (needs voice + stance).

## OPEN DECISIONS (Algoq)
M3 anchor, M4a metric, M4b 3D-vs-2.5D, M4c produces/schedule/cost, M5 authorship + stance
