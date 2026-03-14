# Fix: Mindmap Rendering Chain — Remaining Issues After Bug 1-5

## Context
Bugs 1-5 (auth gates, data key mismatches) are already fixed. The API returns 124 nodes, 302 links, 35 clusters. Server is healthy. These are the **remaining client-side issues** found via deep audit.

---

## HIGH PRIORITY — Functional Bugs

### Fix 6: Connections prop not passed to MindMapDiagramView
**File:** `packages/web/components/MindMap.tsx` (~line 310-316)
- Parent computes `connections` (with `from/to` fields) but never passes them to `<MindMapDiagramView>`
- Child fetches `/api/mindmap/data` AGAIN independently — double fetch, wasteful
- **Fix:** Add `topicLinks` prop to MindMapDiagramView interface, pass `connections` from parent mapped back to `source/target` format (what the SVG rendering expects), eliminate the child's redundant fetch when props are provided

### Fix 7: Standardize field names across the chain
**File:** `packages/web/components/MindMapDiagramView.tsx`
- API returns `{ source, target }` in links
- MindMap.tsx transforms to `{ from, to }` for connections state
- MindMapDiagramView internally uses `topicLinks` with `{ source, target }` for SVG line rendering
- **Fix:** Keep `source/target` throughout. Don't transform in MindMap.tsx — just store the raw API links. Pass them directly to the diagram view.

### Fix 8: Dead `connections` state in mindmap/page.tsx
**File:** `packages/web/app/mindmap/page.tsx` (line 48, 76-81)
- `connections` state is computed but never passed to any child component
- MindMapDiagramView does its own fetch internally
- **Fix:** Either pass connections to child OR remove the dead state + transformation code

---

## MEDIUM PRIORITY — Robustness

### Fix 9: SSE thought-stream errors silently swallowed
**File:** `packages/web/app/page.tsx` (~lines 992-1005)
- `catch { /* SSE not critical */ }` — no logging at all
- If thought-stream breaks, zero visibility
- **Fix:** Add `console.warn('Thought stream connection failed:', err)` in the catch block

### Fix 10: Query polling silent failure
**File:** `packages/web/app/page.tsx` (~line 1178)
- `if (!res.ok) return` — polling stops silently
- **Fix:** Add `console.warn('Poll failed:', res.status)` before the return

---

## LOW PRIORITY — UX Enhancement (Skip unless requested)

- No "collapse to landing" button (isExpanded is one-way) — intentional design choice, not a bug
- History tab's `onTopicExpand` callback not wired — optional prop, renders fine without it

---

## Execution Order
1. Fix 7 first (standardize field names) — this simplifies Fix 6
2. Fix 6 (pass topicLinks prop, eliminate double-fetch)
3. Fix 8 (clean dead code in page.tsx)
4. Fix 9 + 10 (add warning logs)
5. Verify build passes
6. Test mindmap modal renders nodes AND connection lines
