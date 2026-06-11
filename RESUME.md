# AkhAI — RESUME.md
> Session continuity file. Read this FIRST when resuming work.
> Last updated: 2026-06-10 (Day 157 — post Day-150 plan)

## PROJECT STATE
- **Day 157** | akhai.app **live + healthy** | post Day-150 plan window | **~95% features complete**
- **Commits:** 654 total | All pushed to `origin/main` | VPS redeploy PENDING for security sprint commits
- **Repo:** `/Users/sheirraza/akhai` | GitHub: `algoq369/akhai`
- **VPS:** `akhai@82.221.101.3` (FlokiNET Iceland) | **akhai.app** live + healthy
- **Provider:** Claude Opus 4.7 primary | Opus 4.6 extended thinking | Haiku 4.5 enrichment | OpenRouter Llama 3.3 70B free fallback
- **Standards:** WEBNA V3 — 20 engineering principles, 8 gates, 19 checks
- **Master Plan:** `docs/plans/AKHAI_MASTER_PLAN_V5.md` (V5.5)

## LATEST SESSIONS (Days 101-115 — 71 commits: 566→637)

### Session Jun 11 (2 commits: 654→656) — V6 BLOCKS 1+2 CORE
- `e5cd2db` Block 1: output standalone + SHIELD gate (pre-push hook, tripwires, ratchets, 450kB budget) + 15 promptfoo goldens + standalone deploy script. Prod cutover: VPS now runs Next 15.5.19 runtime (gap closed), boot 5.6s→0.7s, zero installs on VPS ever again. A15 logged: activation noise = non-deterministic routing.
- `d7956d4` Block 2: home First Load **887→299 kB (−66%)** — depth dictionaries (94kB), 6 response-render components, classifier → split chunks. All 33 routes ≤450. DEPLOYED, TTFB 0.20s.
- Deploys now via `deploy/quick-deploy-standalone.sh` (self-gating). Legacy tree = rollback for 1 week.
- Block 2 remaining: Anthropic prompt caching + nav fluidity (loading.tsx sweep, prefetch, View Transitions).

### Session Jun 9-10 (17 commits: 637→654) — FABLE 5 DEEP AUDIT + SECURITY SPRINT

**Audit:** `docs/audits/FABLE5_DEEP_AUDIT_2026-06-09.md` — 24 findings P0→P3, engine intelligence check.

**P0 closed:**
- `1e62fea` email auth codes → crypto.randomInt (was predictable Math.random — ATO vector)
- `89c5081` X OAuth → crypto state + RFC 7636 PKCE S256
- `8b6ab2f` + `99d0298` dependency pins + next 15.5.19 — **113→23 vulns, 0 critical, 0 high**

**P1 closed:**
- `7d6c1f3` AbortSignal.timeout on all 6 provider calls (180s env-tunable) + CoinGecko 10s
- `80dabe4` fallback selector dead-branch fix; renamed selectMethodologyFallback (SSOT vs fusion scorer)
- `2faa4e2` last 7 Math.random API ids → crypto.randomUUID
- `a760868` server-only guards (database/auth/multi-provider) + vitest jsdom stub — prod build verified BUILD_EXIT:0

Gates green at every commit: tsc 0 · vitest 91/91.

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
| vitest | 91/91 passing ✅ |
| pnpm audit --prod | 0 critical / 0 high (23 moderate) ✅ |
| Git | clean, 654 commits ✅ |
| PM2 | online ✅ |
| SQLite binding | ABI 137 — permanently fixed ✅ |

## WEBNA V3 COMPLIANCE — MASTER PLAN

### Current Score: ~70/100 (Grade B-) — post Jun 9-10 security sprint

**Phase 1 — Critical Security** ✅ STEP 1 DONE
- [x] Replace Math.random() → crypto.randomUUID() (13 files, 65 replacements)
- [ ] Add Zod validation to top 5 API routes (simple-query, settings, enhanced-links, canvas-viz, depth-extract)
- [x] server-only guards on database/auth/multi-provider (`a760868`) — ESLint no-restricted-imports still TODO
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
- [x] withRetry() utility (3 retries, exponential backoff) — lib/retry.ts, wired in simple-query
- [ ] Wrap all external API calls with withRetry()
- [ ] Structured logging replacing 557 console.log statements
- [x] Timeouts for LLM calls — AbortSignal.timeout on all 6 providers (`7d6c1f3`)

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

5. **zsh paste blocks:** interactive zsh ignores `#` comments — a comment after a pipe feeds words to the command (tail EPIPE crash). Never put comments in paste blocks.

6. **DC + pnpm = hang:** Desktop Commander-spawned pnpm queues silently behind store locks (zombie installs from killed sessions). pnpm ONLY via user terminal; everything else (git/npx/tsc/vitest/python) fine via DC.

7. **node 22 vs 24 after pnpm relink:** pnpm install re-links better-sqlite3 — user shells on node22 (conda/nvm) lose the ABI-137 binding and 2 db test files fail to LOAD (tests ≠ broken). Canonical env = homebrew node 24.

8. **.next cache corruption:** After `npm run build` (for deploy), the `.next` directory has production artifacts that break Turbopack dev server. Always `rm -rf .next .turbo` before starting dev server.

## SAFETY NETS
- **Mindmap backup:** `/tmp/akhai-mindmap-backup/` (5 files) + git tag `pre-mindmap-enhancement` at `f98a7d4`
- **Revert mindmap:** `git checkout pre-mindmap-enhancement -- packages/web/components/MindMapSVG.tsx packages/web/components/MindMapClusterDetail.tsx packages/web/components/MindMapLayout.ts`

## NEXT SESSION — START HERE
1. Read this file + `docs/audits/FABLE5_DEEP_AUDIT_2026-06-09.md`
2. DEPLOY security sprint to VPS if not done: build is fresh — `bash deploy/quick-deploy.sh`
3. P2: Zod on settings/enhanced-links/depth-extract · CSP single-source + nonce (kill next.config duplicate)
4. P2 Guard substance: real factuality (Qdrant cross-check) + wire ReAct to real search (kill "even if simulated")
5. Audit 20× `user_id IS NULL` queries for cross-user scope

**Last commit:** `a760868` security(P1.7): server-only guards — client imports fail at build
