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


---

## DECISIONS LOCKED 2026-07-13 (Algoq)
- M2: embedding routing. LOCKED.
- M3 VOICE ANCHOR (verbatim): "Precision in words, manifestation, and alignment for fluid mind
  expression. Mathematically the order of words matters, and with our words we create; so it shall
  always be with wisdom, high consciousness, and compassion." OPERATIONAL: economy (every word earns
  place), deliberate ordering (sequence as structure), grounded-wisdom register, never verbose/hollow/
  cold. "Mathematical depth" = structured delivery, strongest idea placed with intent, rhythm that
  builds, nothing decorative. GUARDRAIL: eloquence stays GROUNDED — luminous + precise, never vague
  mysticism (precision IS the spirituality; protects brand credibility). Applies to ALL engine output.
- M4a METRIC: ranked by AkhAI intelligence (Opus+Sonnet), NOT raw counts. Signals: cross-subject
  connectivity, holistic resonance, pertinence/substance + PROPOSED: (1) generative fertility (spawned
  follow-ups), (2) bridge centrality (connects distant clusters), (3) depth-of-engagement (returned to
  across sessions), (4) contrarian tension (holds opposing views productively), (5) transformative
  potential (Opus judgment: "does this change how you think"). Claude's lean: bridge-centrality +
  transformative-potential weighted highest. FINAL WEIGHTS: pending Algoq tune.
- M4b: 2.5D FIRST (Claude high-confidence call — depth+glow+animated subject-colored strands+parallax
  on existing SVG, renders only the 3 paths). Full WebGL 3D = future upgrade on the proven base. LOCKED.
- M4c CADENCE: auto-run 3 days -> wait -> 6 days -> wait -> 9 days -> repeat (3/6/9 rhythm). LOCKED.
- M4c TIER: Claude rec = owner-only at launch (validate + measure true daily dual-model cost) -> expose
  as LEGEND-tier perk post-launch. Algoq confirms on cost numbers. PENDING cost.
- M5 STANCE: FACTUAL/OBSERVABLE correlations across civilizations, time, space — what we can OBSERVE
  across cultures, NOT unfalsifiable assertion. Grounded, sourced, mystery honored without claims.
  LOCKED. Authorship: TBD (Algoq-written+edited vs AkhAI-generated+approved).
- ENGINE SIGNATURE WRITING = the M3 voice, everywhere: eloquent, precise, mathematical depth in word
  order and delivery.

## STILL PENDING: M4a final weights - M4c tier cost-confirm - M5 authorship
