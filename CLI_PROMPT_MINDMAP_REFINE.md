# CLI PROMPT — MindMapDiagramView Layout Refinement

## Context
File: `/Users/sheirraza/akhai/packages/web/components/MindMapDiagramView.tsx` (890 lines)
This is the GRAPH tab radial knowledge graph. The capping to 8 topics per category works.
Current problems: topic nodes overlap, adjacent big categories collide, connections barely visible.

Also modify: `/Users/sheirraza/akhai/packages/web/app/mindmap/page.tsx`

## Changes Required (6 steps)

### Step 1 — Default to GRAPH tab
File: `app/mindmap/page.tsx` line 55
Change: `useState<ViewMode>('simple')` → `useState<ViewMode>('graph')`

### Step 2 — Weighted category spacing on ring
File: `MindMapDiagramView.tsx`, inside the `positions` useMemo (starts ~line 210).

Currently categories are equally spaced: `angle = (i / categories.length) * PI * 2`

Replace with WEIGHTED spacing — categories with more topics get more angular space:
```
const totalTopics = Array.from(visibleGroups.values()).reduce((s, g) => s + g.total, 0)
// Each category gets angle proportional to its topic count, with a minimum
const MIN_ANGLE = 0.08 // ~4.5 degrees minimum per category
const availableAngle = Math.PI * 2 - categories.length * MIN_ANGLE
let currentAngle = -Math.PI / 2 // start at top

categories.forEach((cat, i) => {
  const weight = visibleGroups.get(cat)!.total / totalTopics
  const catAngle = MIN_ANGLE + weight * availableAngle
  const angle = currentAngle + catAngle / 2
  currentAngle += catAngle
  // ... rest uses angle for catX, catY
})
```

Also sort categories so large ones alternate with small ones to avoid clustering:
```
// Sort categories: largest, smallest, 2nd largest, 2nd smallest, etc.
const sorted = [...categories].sort((a, b) => 
  (visibleGroups.get(b)?.total || 0) - (visibleGroups.get(a)?.total || 0)
)
const interleaved: string[] = []
let lo = 0, hi = sorted.length - 1
while (lo <= hi) {
  interleaved.push(sorted[lo++])
  if (lo <= hi) interleaved.push(sorted[hi--])
}
// Use interleaved instead of categories for ring placement
```

### Step 3 — Fix topic fan layout (prevent overlap)
Still inside `positions` useMemo, the topic placement loop.

Key fixes:
- `topicRadius` should be larger: `120 + nodeCount * 15` (was `110 + nodeCount * 12`)
- Row stagger should be bigger: `row = j % 2 === 0 ? 0 : 45` (was 30)
- Spread angle should ensure min gap between adjacent topic nodes:
  - Each node is 120px wide. At radius R, angular gap for 120px = `120 / R`
  - Spread = `Math.max(nodeCount * (130 / topicRadius), 0.4)` capped at `maxSpread`
- DO NOT let spread exceed the category's allocated angle from step 2

Store each category's allocated angle so the topic fan can use it:
```
// During category loop, store allocated angles
const categoryAngles = new Map<string, { center: number; allocated: number }>()
// ... in forEach:
categoryAngles.set(cat, { center: angle, allocated: catAngle })

// Then for topic placement:
const { allocated } = categoryAngles.get(cat)!
const maxSpread = allocated * 0.85 // don't exceed 85% of allocated space
const minSpread = nodeCount * (130 / topicRadius) 
const spread = Math.min(Math.max(minSpread, 0.4), maxSpread)
```

### Step 4 — Overflow node placement
Position overflow "+N more" node FURTHER out from the topic fan:
```
if (overflow > 0) {
  // Place beyond all topics, at the end of the fan
  const overflowAngle = awayAngle  // same direction as category
  const overflowRadius = topicRadius + 70  // well beyond topic row
  result[`overflow-${cat}`] = {
    x: catX + Math.cos(overflowAngle) * overflowRadius,
    y: catY + Math.sin(overflowAngle) * overflowRadius
  }
}
```

### Step 5 — Visual refinements

#### 5a. Stronger root→category connections
Change the root-to-category path opacity from `0.35` to `0.55`
Change strokeWidth from `1.2` to `1.8`

#### 5b. Lighter dot grid
Change the background dot grid: `#cbd5e1 1px` → `#e2e8f0 0.8px`

#### 5c. Category pill shows visible/total
Line ~627, change:
```
{total} topics
```
to:
```
{visible.length}/{total}
```
(Need to pass `visible` too — the category node render already destructures `{ total }` from visibleGroups, change to `{ visible, total }`)

#### 5d. Topic node text: show category color dot instead of gradient noise
The topic nodes currently cycle through 12 random gradients. Instead, use a softened version of the CATEGORY gradient for all topics in that category. This creates visual grouping.

In the topic rendering loop, instead of:
```
const gradId = `topicGrad${idx % NODE_GRADIENTS.length}`
```
Use:
```
const gradId = `catGrad-${cat}`
```
And adjust the category gradient <stop> colors to be slightly lighter/more pastel for topics (or add separate topic-category gradients with 85% opacity versions of the category colors).

Actually, simplest approach: add per-category topic gradients in <defs>:
```
{Object.entries(CATEGORY_STYLES).map(([cat, style]) => (
  <linearGradient key={`topic-${cat}`} id={`topicCatGrad-${cat}`} x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stopColor={style.from} stopOpacity={0.85} />
    <stop offset="100%" stopColor={style.to} stopOpacity={0.85} />
  </linearGradient>
))}
```
Then in topic rendering: `fill={`url(#topicCatGrad-${node.category || 'other'})`}`

### Step 6 — Reduce MAX_VISIBLE_PER_CATEGORY
Change from 8 to 5. With 23 categories × 5 = 115 max visible topics. Much cleaner. The overflow node handles the rest.

## CRITICAL ARCHITECTURE RULES (DO NOT BREAK)
- Pan/zoom uses `<g transform="translate(${pan.x}, ${pan.y}) scale(${zoom})">` — DO NOT use viewBox
- Wheel listener uses native addEventListener with `{ passive: false }` in useEffect — DO NOT use React onWheel
- Resize handler only updates dims, never touches zoom/pan state
- Positions use container dims (dims.width, dims.height) not fixed virtual canvas
- All topic rendering iterates `visibleGroups` not `filteredNodes` directly
- The overflow node keys are `overflow-${cat}` and must have positions in the `positions` map
- Discussion panel, fetch logic, drag logic — DO NOT TOUCH any of these

## Files to modify
1. `packages/web/app/mindmap/page.tsx` — line 55 only (step 1)
2. `packages/web/components/MindMapDiagramView.tsx` — layout math + visuals (steps 2-6)

## Verification
After changes, run: `cd /Users/sheirraza/akhai/packages/web && npx tsc --noEmit`
Must compile with zero errors.
