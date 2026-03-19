Read /Users/sheirraza/akhai/GOD_VIEW_TRACKER.md and /Users/sheirraza/akhai/CLAUDE.md for context.

THIS SESSION: Build God View panel + fix all broken metadata/refinement features.
3 existing components are built but broken. Fix them while building God View.

## AUDIT FINDINGS (already verified)

1. MetadataStrip.tsx (8.4KB) — wired at page.tsx:2089, gated by pipelineEnabled + ◇ toggle
   SSE thought-stream connected at page.tsx:934-952
   Issue: May not render if SSE events arrive before component mounts

2. PipelineHistoryPanel.tsx (22KB) — DISABLED at Overlays.tsx:108
   `{false && <PipelineHistoryPanel` — hardcoded false, never renders
   Fix: Enable it

3. LiveRefinementCanal.tsx (5.7KB) — IMPORTED at page.tsx:55 but JSX NEVER MOUNTED
   The <LiveRefinementCanal /> tag doesn't exist in the render tree
   Fix: Mount it above the input area

4. god-view-store.ts (2KB) — EXISTS, Zustand store ready
5. GodViewTree.tsx (17KB) — EXISTS, extracted component with live mode props

## CRITICAL DESIGN RULE: METADATA SIDE PANEL

The metadata side panel (PipelineHistoryPanel or equivalent) is a PERSISTENT TOGGLEABLE
store of ALL engine metadata produced during the ENTIRE conversation. It is NOT per-message.

Requirements:
- EVERY piece of metadata the engine produces gets stored: layer activations, Guard scores,
  methodology selection + reasons, Side Canal topics, fusion confidence, provider used,
  tokens, latency, cost, depth annotations, path activations — EVERYTHING.
- The panel is TOGGLEABLE: user can expand (slide open) or collapse (retract) at any time.
  When collapsed, a small indicator shows metadata count. When expanded, full scrollable history.
- The panel ACCUMULATES across the entire conversation session. Query 1 metadata stays
  when query 2 arrives. All metadata is scrollable in chronological order.
- Each query's metadata block is visually separated with a header: "Query #1", "Query #2" etc.
- Within each block, show all pipeline stages in order: received → routing → layers →
  reasoning → generating → guard → analysis → complete
- The panel lives on the LEFT side (where the existing topic/insight sidebar is), or
  as an overlay — reuse the existing PipelineHistoryPanel component structure.
- Data source: side-canal-store.ts already has messageMetadata and metadataHistory arrays.
  Make sure ALL metadata from simple-query response is pushed into these stores.

This is a NOVEL feature — no other AI shows you the full transparent pipeline of how it
reasoned. This is AkhAI's "show your work" principle. Treat it as core, not optional.

## DO THESE 5 TASKS IN ORDER

=== TASK 1: Enable + enhance PipelineHistoryPanel (30 min) ===

In components/home/Overlays.tsx line 108:
Change: {false && <PipelineHistoryPanel
To: {<PipelineHistoryPanel
(Remove the `false &&` that disables it)

Then enhance PipelineHistoryPanel.tsx to be the PERSISTENT METADATA STORE:
- It must accumulate ALL metadata from every query in the conversation
- Toggle button visible at all times (collapsed state shows "◇ N events")
- When expanded: full-height scrollable panel showing all pipeline events
- Group by query: "QUERY #1 — check best open source..." / "QUERY #2 — ..."
- Each group shows all stages with sigil markers and timestamps
- Data: Read from side-canal-store.ts metadataHistory array
- IMPORTANT: This panel must PERSIST metadata. When user sends query #3,
  metadata from query #1 and #2 must still be visible by scrolling up.

Also ensure side-canal-store.ts STORES response metadata permanently:
- In pushMetadata(): append to metadataHistory (never clear it during session)
- Add pushResponseMetadata(queryId, responseData) action that stores the
  full response metadata (fusion, guard, layers, provider, cost, tokens)
- This gets called after every successful query response in page.tsx

=== TASK 2: Mount LiveRefinementCanal (10 min) ===

In app/page.tsx, find the area above the main text input (the "continue conversation..." area).
Look for the "LIVE REFINEMENT" text or the existing refine/enhance/correct/instruct buttons.
Mount the LiveRefinementCanal component:

<LiveRefinementCanal />

Place it BETWEEN the response area and the main input field.
It should show: refine · enhance · correct · instruct... actions
Plus accumulated metadata history from the side-canal-store.

=== TASK 3: Create GodViewPanel slide-in (2 hours) ===

Create components/god-view/GodViewPanel.tsx:
- Slide-in panel from right, 420px wide on desktop
- Top section (60%): GodViewTree component in compact + live mode
- Bottom section (40%): ActivityFeed (task 4)
- Close X button top-right
- Framer Motion AnimatePresence slide-in
- Semi-transparent dark backdrop
- Uses useGodViewStore for open/close state

Add toggle button in app/page.tsx:
- New "◊" icon button near the VIEW tabs (AI Layers / Insight / Mindmap)
- Or next to the existing ◇ pipeline toggle
- Calls useGodViewStore().togglePanel()
- Tooltip: "Neural Tree — watch AI reason in real-time"
- Render <GodViewPanel /> conditionally when panelOpen

=== TASK 4: Create ActivityFeed component (1 hour) ===

Create components/god-view/ActivityFeed.tsx:
- Scrolling monospace log in bottom section of GodViewPanel
- Auto-scrolls to bottom on new entries
- Max 30 visible entries
- Each line format — sigil markers, NO emojis:
  "[HH:MM:SS] ◊ Query initiated — auto methodology"
  "[HH:MM:SS] → Fusion: ReAct selected (92% confidence)"
  "[HH:MM:SS] △ Guard: hype 0 · echo 0 · drift 0 — PASS"
  "[HH:MM:SS] ⊕ Expansion dominant — weight 70%"
  "[HH:MM:SS] ◇ Side Canal: 3 topics extracted"
  "[HH:MM:SS] ○ Complete — 1247ms · $0.012"
- Design: bg-black/90, font-mono text-[9px], text-gray-400

Feed data: Watch god-view-store.activations changes via useEffect.
Each activation update generates 3-5 new log entries.
Also subscribe to the existing side-canal-store.currentMetadata for
thought-stream events (SSE stages: received, routing, layers, etc.)

=== TASK 5: Wire SSE data to God View store (1 hour) ===

In app/page.tsx, find the handleSubmit function (~line 920).
The SSE thought-stream is already connected (lines 934-952).
ALSO wire the response JSON data into god-view-store:

After the fetch to /api/simple-query succeeds and data is parsed:

1. Before fetch: godViewStore.setProcessing(true)
2. After successful response:
   - Map response.fusion.layerActivations to layerWeights
   - Map response.fusion.dominantLayers to dominantLayers  
   - Map response.guardResult to guardReasons
   - Map response.fusion.methodology + confidence
   - Call godViewStore.setActivations({...mapped data...})
3. After complete: godViewStore.setProcessing(false)

4. CRITICAL — Push ALL response metadata to persistent store:
   Call side-canal-store's pushResponseMetadata(queryId, {
     fusion: response.fusion,           // methodology, confidence, layerActivations, dominantLayers
     guardResult: response.guardResult,  // passed, scores, issues
     provider: response.provider,        // family, model, reasoning
     metrics: response.metrics,          // tokens, latency, cost
     sideCanal: response.sideCanal,      // topics extracted, suggestions
     gnostic: response.gnostic,          // ascent level, meta-core state
     query: original query text,
     timestamp: Date.now()
   })
   This ensures the PipelineHistoryPanel has the FULL metadata from every query.
   The panel accumulates this data and never clears it during the session.

Layer name mapping helper (create in god-view-store.ts):
The fusion response uses aiName format ("reception", "reasoning", etc).
Map to Layer enum using LAYER_METADATA lookup.

Also add animation support to GodViewTree.tsx:
- When isLive=true and weight > 0.3: node glows (opacity + subtle scale)
- Dominant layers: brighter glow
- Guard active: Discriminator node gets subtle red ring pulse
- Keep MONOCHROME. Subtle. No color circus.

== AFTER ALL TASKS ==

Restart dev server:
  lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 2
  cd /Users/sheirraza/akhai/packages/web && rm -rf .next
  NODE_ENV=development npx next dev --turbopack -p 3000

Verify ALL features work:
1. Submit a query on localhost:3000
2. See MetadataStrip under response (◇ toggle) — shows current stage live
3. See LiveRefinementCanal above input (refine/enhance/correct/instruct)
4. Click ◊ button → GodViewPanel slides in from right with Neural Tree + ActivityFeed
5. Check PipelineHistoryPanel (toggleable side panel):
   - Shows ALL metadata from query #1 (fusion, guard, layers, provider, cost)
   - Toggle collapse/expand works
6. Submit a SECOND query
7. Check PipelineHistoryPanel again:
   - Query #1 metadata STILL visible (scroll up)
   - Query #2 metadata appears below
   - Both queries' full pipeline data persisted
8. Neural Tree shows layer activations from query #2
9. ActivityFeed shows sigil-marked event log for query #2

This verifies the PERSISTENT metadata store works across multiple queries.

Commit:
  cd /Users/sheirraza/akhai && git add -A
  git commit -m "feat: God View Phase 1 + fix MetadataStrip, PipelineHistory, LiveRefinementCanal"
