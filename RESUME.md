# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: March 31, 2026 (Day 77/150) — 20:30

## PROJECT STATE
- **Day 77/150** | Launch: June 4, 2026 | **~88% features complete**
- **Repo:** `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **VPS:** `akhai@82.221.101.3` (FlokiNET Iceland) | **akhai.app** live
- **Provider:** Claude Opus 4.6 (AKHAI_FREE_MODE=false on both local + VPS)
- **Standards:** WEBNA_STANDARDS.md adopted — read before every session

## COMPLETED (Days 75-77, 32 commits)

### Pre-Dev Stabilization
- WEBNA standards adopted, root cleaned (6 MD files), CI workflow
- page.tsx: 3,028 → 222 lines (93% reduction)
- Hooks split: 2,062 lines → 7 files under 500 each

### Engine Fix Plan 9/9
- SSE: 9 stages fire with enriched narratives
- Layer names: all 11 correct AI computational names
- Methodology: honors user selection (no fusion override)
- MetadataStrip: live rendering with isStreaming prop

### VIEW Tabs + Depth Annotations
- VIEW tabs: guaranteed fallback renders (word count, key sentences, keyword chips)
- Depth annotations: position-based sigils + contextual sentence extraction
- Canvas: full toolbar (zoom/reset + generation buttons + goal/milestone)

### Phase A: Methodology Rename ✅
- bot → sc (Self-Consistency, Wang et al. ICLR 2023)
- pot → pas (Plan-and-Solve, Wang et al. ACL 2023)
- gtp → tot (Tree of Thoughts, Yao et al. NeurIPS 2023)
- API route renamed: gtp-consensus → tot-consensus
- All 7 methods verified via API: direct, cod, sc, react, pas, tot, auto

### UX Fixes (family feedback)
- Removed cursor:none global (native cursor visible as fallback)
- Methodology switch modal removed (switches silently)

## NEXT: PHASE B — Metadata Persist + Replay (~4h)
- B6: Persist SSE metadata to database per query
- B7: Replay metadata timeline when viewing past queries
- B8: Verify + deploy

## AFTER PHASE B
- Phase C: Methodology Pipelines (16h) — 7 real AI processes
- Phase D: God View Phase 2+3 (20h) — 5-agent Council
- Phase E: Feature Completion (16h) — Grimoire, DDG, refinement
- Phase F: UI Polish (13h) — split 43 bloated files, tests
- Phase G: Pre-Launch (20h) — landing, pricing, legal

## KNOWN DEBT
- 43 files over WEBNA 500-line limit (Phase F)
- 86 `as any` casts (Phase F)
- 8 high-severity dep vulnerabilities (transitive, waiting upstream)
