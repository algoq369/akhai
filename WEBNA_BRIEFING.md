# AkhAI — Briefing for WEBNA
> Purpose: bring WEBNA up to speed on AkhAI's current engine state, and specify exactly
> what we need from WEBNA (latest engine + coding rules + token-efficiency standards) so we
> can align AkhAI's intelligence to WEBNA's bar before commercial launch.
> Date: 2026-06-29 · Engine HEAD: bae8ae6 · 105 tests passing.

## 1. WHAT AKHAI IS
A sovereign, EU-jurisdiction, visual-first AI reasoning engine. Differentiator = HONEST
intelligence: it shows its reasoning, routes each query to the right method, executes real
tools, and fact-checks its own answers against real sources. Not a chat wrapper — a
transparent reasoning engine. Stack: Next.js 15.5, TypeScript, AI SDK 6, better-sqlite3,
multi-provider LLM layer (Claude Opus 4.8 primary, Haiku 4.5 budget tier, Llama free tier).

## 2. CURRENT ENGINE STATE (what's built + verified)
- 7 reasoning methodologies: direct, cod, sc, react, pas, tot, auto.
- Routing: scored fusion classifier (keyword/feature based) → methodology + model selection.
- Cost cascade: simple queries → Haiku 4.5 (~10x cheaper), reasoning → Opus 4.8. LIVE.
- Real ReAct agent: AI SDK 6 tool loop + real Brave/DDG search. Fires real searches with
  query reformulation. LIVE behind REACT_AGENT_LIVE flag.
- Grounding meter: tri-tier honest factuality — parametric (no sources) / heuristic
  (in-process lexical support) / grounded (external NLI). In-process tier works WITHOUT
  any external box.
- Prompt caching on system prompt; multi-provider with timeouts + retry.
- Quality gate (SHIELD): tsc + vitest + tripwires + ratchets + bundle budget on every push.
- Security: 0 critical/high vulns, crypto tokens, server-only walls.
- Test suite: 105 passing. All changes verified, all on origin/main.

## 3. KNOWN TOKEN-EFFICIENCY GAPS (where WEBNA's input is most valuable)
Found by inspecting the live engine:
- A) PROMPT CACHE DEFEATED BY PREFIX INSTABILITY: systemPrompt is assembled by concatenating
  dynamic content (current date, live web context, fusion modifications) AROUND the stable
  9KB methodology prompt. Because cache_control sits on a prefix that mutates per query,
  cache HITS are unlikely. The stable methodology block should be the cached prefix; dynamic
  content should follow it or move to the user turn.
- B) FLAT max_tokens: simple-query uses max_tokens 4096 regardless of methodology. A `direct`
  answer rarely needs 4096; per-methodology output budgets would cut waste.
- C) NO SEMANTIC CACHE: semantically-similar repeat queries re-run the full LLM.
- D) RETRIEVAL ONLY ON ReAct: only react queries carry source context; other methodologies
  have nothing to ground against (and no retrieval-side token reuse).

## 4. WHAT WE NEED FROM WEBNA
Please share, so we can fold into AkhAI:
1. LATEST ENGINE: WEBNA's current engine/architecture — routing, orchestration, and any
   patterns that outperform our scored-fusion classifier. We want to compare and adopt.
2. CODING RULES / STANDARDS: WEBNA's authoritative coding standards (the "WEBNA bar"). We
   will encode enforceable ones into our SHIELD gate (it already fails commits on tsc/test/
   tripwire/ratchet/bundle violations — WEBNA rules become new gates).
3. TOKEN-EFFICIENCY STANDARD: WEBNA's guidance on minimizing tokens per query without quality
   loss — prompt structuring for cache stability, output-budget policy, context-window
   discipline, caching strategy. Map directly onto gaps A–D above.
4. PROMPT ARCHITECTURE: how WEBNA structures system vs user content for cache efficiency and
   determinism. Our gap A is the priority.
5. EVAL/QUALITY METHOD: how WEBNA measures engine quality (we run promptfoo goldens + Langfuse
   traces; want to align metrics so "WEBNA ≥85" is a shared, measurable bar).

## 5. HOW WE'LL USE IT
- Standards → encoded into SHIELD (automatic enforcement per commit).
- Engine patterns → reviewed against our engine, adopted where they fit, behind shadow/flag.
- Token guidance → drives our optimization phase (see EFFICIENT_PLAN.md), measured before/after.
- All integration: deploy-free, gated, reversible, verified on localhost — same discipline
  that produced the current 105-test clean state.

## 6. CONSTRAINTS
- EU data sovereignty is non-negotiable (jurisdiction, no US-parent cloud for inference).
- Open-source core (Apache 2.0) — any WEBNA component must be license-compatible.
- WEBNA-the-tool merge is a planned future master-plan item; this briefing is about adopting
  WEBNA's standards + engine learnings NOW, ahead of that merge.

## 7. TIMELINE CONTEXT
Commercial launch target: mid-to-end August 2026, prime September. Commercial preparation
handled with a partner. Engine must be audit-clean, optimized, and refined before then.
This briefing kicks off the WEBNA-alignment workstream feeding that launch.
