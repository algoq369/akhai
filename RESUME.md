# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: March 30, 2026 (Day 76/150) — 19:55

## PROJECT STATE
- **Day 76/150** | Launch: June 4, 2026 | **~85% features complete**
- **Repo:** `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **VPS:** `akhai@82.221.101.3` (FlokiNET Iceland) | **akhai.app** live
- **Provider:** Claude Opus 4.6 (AKHAI_FREE_MODE=false on both local + VPS)
- **Standards:** WEBNA_STANDARDS.md adopted — read before every session

## SESSION SUMMARY (Days 75-76, 25 commits)
- WEBNA standards adopted, root cleaned, CI workflow created
- page.tsx split: 3,028 → 222 lines (7 commits)
- Hooks split: 2,062 lines → 7 files under 500 each
- Engine Fix Plan 9/9 complete (SSE, layers, metadata, methodology, VIEW tabs)
- Depth annotations: position-based sigils + contextual sentence extraction
- Canvas toolbar: zoom/reset + generation buttons + goal/milestone tools
- VIEW tabs: guaranteed fallback renders (never empty)
- Claude Opus 4.6 set as primary on both environments
- All fixes deployed to akhai.app

## NEXT: PHASE A — Methodology Rename (~3h)
Rename 3 fabricated method names to real academic ones:
- bot → sc (Self-Consistency, Wang et al. ICLR 2023)
- pot → pas (Plan-and-Solve, Wang et al. ACL 2023)
- gtp → tot (Tree of Thoughts, Yao et al. NeurIPS 2023)
Files: MethodologyFrame.tsx, provider-selector.ts, intelligence-fusion.ts, route.ts, DB

## KNOWN DEBT (Phase F)
6 files over WEBNA 500-line limit from CLI expansion — split before launch
