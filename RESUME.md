# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: 2026-05-04 20:00 UTC (Day 115/150)

## PROJECT STATE
- **Day 115/150** | Launch: June 4, 2026 (**31 days**) | **~92% features complete**
- **Commits:** 637 total | All pushed to `origin/main` + deployed to `akhai.app`
- **Repo:** `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **VPS:** `akhai@82.221.101.3` (FlokiNET Iceland) | **akhai.app** live + healthy
- **Provider:** Claude Opus 4.7 primary | Opus 4.6 extended thinking | Haiku 4.5 enrichment | OpenRouter Llama 3.3 70B free fallback
- **Standards:** WEBNA V3 — 20 engineering principles, 8 gates, 19 checks
- **Master Plan:** `docs/plans/AKHAI_MASTER_PLAN_V5.md` (V5.5)

## LATEST SESSIONS (Days 101-115 — 71 commits: 566→637)

### Session May 4 (19 commits: 618→637) — Panel quality + Mindmap + WEBNA V3

**Content over statistics:**
- `f826001` Remove % badges, enrich with real findings
- `0325f2d` Remove all statistical metadata from Insight + AI Layers + Mindmap
- `f4585e8` AI Layers: real paragraph content + remove all remaining %
- `8ca5847` Insight: real paragraph content in expanded topics

**View mode refinements:**
- `d6e7893` Restore depth sigil glyphs, rename mini-canvas→metrics, fix arboreal overlap, enhance canvas viz prompts
- `c3f02f5` Depth sigils visible pill badges
- `3c10686` Mindmap: single hover popover (no double overlap)

**Infrastructure:**
- `d33c9e4` Permanent sqlite binding fix (npm rebuild, no more rm -rf build)
- `924d9d5` Predev auto-copies sqlite binding to pnpm path (ABI 137)

**Mindmap force-directed graph:**
- `bad9906` True force-directed layout replacing column grid
- `3a4aea3` Force spacing increase (repulsion 3500, minDist 45)
- `d8cc0d0` + `8cd5cd2` Scale up nodes + labels
- `a890018` Aggressive scale (nodes 10-35px, labels 16px, repulsion 8000)
- `4c1d56c` Cluster detail hierarchical sizing
- `ac9f610` Nodes more visible + hide SideMiniChat during mindmap

**UI polish:**
- `18ea59c` Condense left panel metacognition to single-line intent
- `f98a7d4` Hide intelligence & robot + temple from footer nav

**WEBNA V3 Security:**
- `07e5488` Replace ALL Math.random() IDs with crypto.randomUUID() (13 files, 65 replacements)

### Prior session May 3 (52 commits: 566→618) — Arboreal + Canvas + Classic views
See transcript: `/mnt/transcripts/2026-05-04-09-57-31-akhai-sprint-views-refinement-deploy.txt`

## SYSTEM HEALTH
| Check | Status |
|---|---|
| localhost:3000 | HTTP 200 ✅ |
| akhai.app | HTTP 200 ✅ |
| tsc | 0 errors ✅ |
| vitest | 69/69 passing ✅ |
| Git | clean, 637 commits ✅ |
| PM2 | online ✅ |
| SQLite binding | ABI 137 — permanently fixed ✅ |

## WEBNA V3 COMPLIANCE — MASTER PLAN

### Current Score: ~50/100 (Grade D+)

**Phase 1 — Critical Security** ✅ STEP 1 DONE
- [x] Replace Math.random() → crypto.randomUUID() (13 files, 65 replacements)
- [ ] Add Zod validation to top 5 API routes (simple-query, settings, enhanced-links, canvas-viz, depth-extract)
- [ ] Add server-only package + ESLint no-restricted-imports
- [ ] Audit all DB queries for OR user_id IS NULL patterns

**Phase 2 — Security Headers + Secrets**
- [ ] CSP nonce generation in middleware.ts
- [ ] Trusted Types + COOP + CORP headers
- [ ] Gitleaks pre-commit via lefthook
- [ ] Build-time secret scan (grep .next/static for AKIA/sk_live)
- [ ] .npmrc: ignore-scripts=true, minimumReleaseAge=1440

**Phase 3 — File Size Compliance (10 files over 500 lines)**
- [ ] CanvasHelpers.ts (695) → Helpers + Colors + Types
- [ ] simple-query/route.ts (656) → route + handler + streaming
- [ ] useCanvasState.ts (611) → State + Layout + Interaction
- [ ] content-classifier.ts (561) → classifier + extractors
- [ ] CanvasNodeContent.tsx (544) → NodeContent + NodeRenderers
- [ ] multi-provider-api.ts (532) → api + providers + types
- [ ] ChatMessages.tsx (524) → Messages + MessageItem + MessageActions
- [ ] + 3 more files near 500 lines

**Phase 4 — Resilience + Observability**
- [ ] withRetry() utility (3 retries, exponential backoff)
- [ ] Wrap all external API calls with withRetry()
- [ ] Structured logging replacing 557 console.log statements
- [ ] createContext().withTimeout() for LLM calls

**Phase 5 — UI/UX Quality**
- [ ] Text sizes: bump all <10px to 10px minimum
- [ ] Focus rings on all interactive elements
- [ ] Responsive test at 375/768/1024/1440px
- [ ] SEO: OG tags, meta description, structured data
- [ ] Lazy loading + code splitting for heavy views

**Phase 6 — Security Shield CI**
- [ ] shield-score.ts aggregator
- [ ] Mozilla Observatory check
- [ ] osv-scanner for dependency vulnerabilities
- [ ] Deploy gate: score < 75 = no ship

### Target: Score 85+ (Grade A) by June 4 launch


## KEY COMMANDS

```bash
# Local dev restart
cd ~/akhai/packages/web && lsof -ti:3000 | xargs kill -9; sleep 2
npm run predev && rm -rf .next .turbo
nohup bash -c 'set -a && source .env.local && set +a && SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000' > /tmp/akhai-dev.log 2>&1 &

# Deploy to VPS
cd ~/akhai/packages/web && rm -rf .next .turbo && npm run build
cd ~/akhai && git push origin main && bash deploy/quick-deploy.sh

# SSH VPS
ssh akhai@82.221.101.3

# Mindmap graph revert (if force-directed breaks)
git checkout pre-mindmap-enhancement -- packages/web/components/MindMapSVG.tsx packages/web/components/MindMapClusterDetail.tsx packages/web/components/MindMapLayout.ts
```

## KEY LEARNINGS (Days 101-115)

1. **SQLite ABI mismatch root cause:** Two Node versions (nvm v22 ABI 127 / homebrew v24 ABI 137). Old predev did `rm -rf build && node-gyp rebuild` which FAILED silently (Python 3.14 broken pyexpat). Fix: `npm rebuild better-sqlite3` + auto-copy to pnpm path.

2. **Content over statistics:** Users want knowledge, not metadata. Removed all confidence%, dataPercent%, metricsCount from AI Layers, Insight, Mindmap. Replaced with actual paragraph content extracted from response sections.

3. **Force-directed layout:** Replaced column/grid layout in MindMapClusterDetail with iterative physics simulation (repulsion + attraction + centering). 150 iterations, O(n²) per iteration, handles 300 nodes in <50ms.

4. **extractHighLevelInsights was shallow:** Only grabbed header text as fullContent. Fix: extract paragraph content BELOW each header (1-3 sentences). Same fix for extractInsights in insightMindmapTypes.

5. **.next cache corruption:** After `npm run build` (for deploy), the `.next` directory has production artifacts that break Turbopack dev server. Always `rm -rf .next .turbo` before starting dev server.

## SAFETY NETS
- **Mindmap backup:** `/tmp/akhai-mindmap-backup/` (5 files) + git tag `pre-mindmap-enhancement` at `f98a7d4`
- **Revert mindmap:** `git checkout pre-mindmap-enhancement -- packages/web/components/MindMapSVG.tsx packages/web/components/MindMapClusterDetail.tsx packages/web/components/MindMapLayout.ts`

## NEXT SESSION — START HERE
1. Read this file
2. Continue WEBNA V3 Phase 1 Step 2: Zod validation on top 5 API routes
3. Then Phase 2: Security headers + Gitleaks
4. Target: complete Phases 1-2 in next session (~75 min)

**Last commit:** `07e5488` security(WEBNA-3): replace Math.random() IDs with crypto.randomUUID()
