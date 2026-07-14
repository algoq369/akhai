# Mindmap-Shippable — Ship Plan & Audit

Baseline: HEAD `d4e6a90`. Evidence: 3 Explore agents + `npx knip` + full import tracing.
Goal: a launch-ready mindmap — simple, clear, every visible feature functional (not more wow; the
M4b tunnel + M4c curator stay deferred behind the working hover-rank).

**Decisions (Algoq):** keep both mindmap hosts (defer the overlay↔/mindmap merge); remove dead/
half-built paths now + file post-launch TODO chips; drop the dead `@xyflow/react` + `d3` + `@types/d3`
deps; the cluster-hover `/api/quick-query` spend is **removed** (no unguarded/wasteful paid path ships).

---

## 1. Live / Dead map

**Two live hosts** render the same sub-views: the `/mindmap` route (`app/mindmap/page.tsx`, tabs
graph/history/report) and the home overlay (`components/MindMap.tsx`, opened via `home/Overlays.tsx:75`,
tabs vision/graph/history/grimoire/predict). Both delegate the graph to
`MindMapDiagramView → MindMapSVG`. The graph is **one** component; the hosts duplicate (KEEP both;
merge deferred — touches the shared `Node` type in `MindMap.tsx:12` + the home ChatHeader).
`ResponseMindmap` and `InsightMindmap` are per-message response visualizations (distinct role — KEEP).

### DEAD — zero live importers (delete)
| File | LOC | Evidence |
|---|---|---|
| `components/MindMapTableView.tsx` | 299 | no importer; superseded by `MindMapHistoryView` |
| `components/TopicExpansionPanel.tsx` | 470 | no importer; `page.tsx:89` handler is `console.log`+TODO |
| `components/akhai-mindmap/TopicNode.tsx` | 106 | no importer; dead React-Flow (`@xyflow/react`) prototype |
| `components/akhai-mindmap/useForceLayout.ts` | 319 | no importer; `@xyflow/react`+`d3` (live graph uses `MindMapLayout.ts`) |
| `lib/topic-context-formatter.ts` | 58 | zero refs anywhere |
| `app/api/mindmap/re-extract/route.ts` | 80 | no client fetch anywhere |
| `app/api/mindmap/topic-suggestions/route.ts` | 205 | only caller is the dead `TopicExpansionPanel` |
| **Subtotal** | **1,537** | 7 files |

Plus dead export `formatTimeAgo` (`MindMapUtils.ts:71`, ~9 LOC). Plus deps `@xyflow/react`, `d3`,
`@types/d3` — used ONLY by the two dead React-Flow files (verified zero other importers). React Flow is
an abandoned earlier graph stack; the live graph is SVG (`MindMapSVG.tsx`).

### DEFERRED SEAMS — keep, not wired
- `app/api/mindmap/rank/deepen/route.ts` (52) — M4c click-to-deepen stub (`transformative:null`).
- `app/api/mindmap/topics/[id]/queries/route.ts` (103) — becomes caller-less once the discarded
  client fetch is removed (§3 F2); kept as the backend seam for the post-launch "discussions in
  analyse panel" enhancement.

### LIVE (keep)
Canonical graph chain `MindMapDiagramView → MindMapSVG → akhai-mindmap/TunnelOverlay(+Effects+theme)`;
support `MindMapUtils`/`MindMapLayout`/`MindMapClusterDetail`/`MindMapAnalysePanel`/`MindMapDiagramSVG`;
`MindMapHoverRank → /api/mindmap/rank → lib/mindmap-ranking` (M4a). Hosts: `MindMap.tsx` overlay
(+`MindMapMiniChat`, `VisionBoard`, `PredictView`); `MindMapHistoryView` +6 splits; `MindMapReportView`;
`ResponseMindmap` + `InsightMindmap` families. Side Canal (not mindmap, keep): `TopicsPanel`,
`api/mindmap/topics/[id]`.

---

## 2. Feature inventory (status)

| Feature | Status | Action |
|---|---|---|
| graph/history/report tabs; vision/predict (overlay) | WORKING | keep |
| search / filter / category / pinned / connections | WORKING | keep |
| zoom / pan / scroll-zoom / fit | WORKING | keep |
| node hover → hover card, M4a rank chips, M4b tunnel | WORKING (rank auth-gated) | keep |
| cluster click → cluster detail | WORKING | keep |
| history list / search / sort / filter; grimoire list/new/open; mini-chat (overlay) | WORKING | keep |
| **history cluster-hover → `/api/quick-query`** | BROKEN + wasteful spend (tooltip never renders) | **REMOVE** the paid hover feature |
| **node click → discarded `fetchDiscussions`** | wasted request (`void discussions`) | **REMOVE** call + dead state; keep route as seam |
| **"live" pill** | dead UI (poll early-returns under propNodes → always false) | **REMOVE** pill + `isLive` |
| grimoire relevance on `/mindmap` | always 0 (`selectedTopics={[]}`) | note + TODO chip |
| history "◇ analyse" on `/mindmap` | no-op (rendered propless) | note + TODO chip |
| topic expansion (`TopicExpansionPanel`) | dead UI | delete (§1) |

---

## 3. Ship actions (executed this pass)

**DELETE** — 7 dead files (§1, ~1,537 LOC) + trim `formatTimeAgo` + drop `@xyflow/react`/`d3`/
`@types/d3` from `packages/web/package.json` (+ lockfile). Effort S; risk low (import-verified dead).

**FIX** (remove dead paths + `TODO(post-launch)` markers, spawn task chips):
- **F1 — money/waste leak (HIGH):** remove the cluster-hover `/api/quick-query` feature end-to-end —
  delete `MindMapHistoryView.handlers.ts`, the `clusterInsight` state + `ClusterInsightTooltip` import,
  and the `onClusterHover`/`onClusterHoverLeave` wiring in `MindMapHistoryView.tsx` /
  `.sections.tsx` / `.cards.tsx`. Chip: rebuild cluster-insight tooltip as a free/guarded feature.
- **F2:** remove the discarded `fetchDiscussions` call + dead discussion state in
  `MindMapDiagramView.tsx` (`:256-273,:322,:380-383`). Keep `queries/route.ts` as the seam. Chip:
  surface topic discussions in the analyse panel.
- **F3:** remove the dead "live" pill + `isLive` from `MindMapDiagramSVG.tsx` + `MindMapDiagramView.tsx`.
  Chip: real-time live polling.
- **F4/F5:** `TODO(post-launch)` + chips for grimoire relevance-0 and history analyse no-op on `/mindmap`.

**KEEP-AS-IS:** the LIVE set (§1). **DEFER:** M4b tunnel wow, M4c curator, host consolidation.

---

## 4. Query-input fix

`components/home/InputSection.tsx:91` single-line `<input type="text" text-center>` → auto-growing
`<textarea>`. Blast radius (confirmed): single render site `app/page.tsx:261`; `inputRef`
`HTMLInputElement`→`HTMLTextAreaElement` threaded through `hooks/usePagePropBundles.ts` +
`hooks/useHomePageState.ts`. Reuse the `components/esoteric/MacroTab.tsx:138-165` pattern:
`onChange` sets `height='auto'` then `min(scrollHeight, CAP)`; Enter (no Shift) submits, Shift+Enter
newline; cap ~5–6 rows then scroll; keep transmit as the sole `type="submit"` (new in-form controls
`type="button"`, per `a84ae0f`); reset height on submit. Keep file-attach + relic-input styling.

---

## 5. Gates
SHIELD PASS; clean `next build` succeeds (deletes must not orphan an import); `/mindmap` loads all 3
tabs + hover works; DevTools Network shows NO `/api/quick-query` on history hover (F1 proof) and NO
`/topics/{id}/queries` on node click (F2 proof); textarea grows/caps + Enter/Shift+Enter. Commit; no push.

## 6. knip appendix
`npx knip` (no config; Next app-router auto-detected — all core mindmap files resolve live). Mindmap
files flagged unused: `akhai-mindmap/TopicNode.tsx`, `akhai-mindmap/useForceLayout.ts`,
`MindMapTableView.tsx`, `TopicExpansionPanel.tsx`, `lib/topic-context-formatter.ts` — matches the
import trace exactly. (Dead API routes are URL-reachable so knip doesn't flag them; classified dead by
absence of any shipped-UI caller.)
