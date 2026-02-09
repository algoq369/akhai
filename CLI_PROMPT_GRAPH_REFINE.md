# CLI PROMPT — MindMapDiagramView Graph Layout Refinement

## FILE
`/Users/sheirraza/akhai/packages/web/components/MindMapDiagramView.tsx` (890 lines)

## WHAT THIS FILE IS
Radial knowledge graph: AKHAI root center → 23 category pills on ring → topic nodes fan outward from each category → overflow "+N more" nodes. Pan/zoom via `<g transform>`. Discussion panel slides from right on click.

## CURRENT PROBLEMS (from visual inspection)
1. **Topic nodes overlap each other** — 8 topics per category fan into tight arcs, node rects (120×34px) collide
2. **Adjacent big categories collide** — technology (296), business (179), science (143) are next to each other on the ring, their topic fans overlap
3. **Connections nearly invisible** — bezier curves at opacity 0.35 on light background
4. **Topics use random rainbow gradients** — no visual grouping by category
5. **Overflow nodes overlap topics** — "+N more" sits inside the topic cluster
6. **Category pills show raw total** — "296 topics" instead of "5/296" (visible/total)
7. **Dot grid too prominent** — competes with content
8. **8 topics per category is still too many** — with 23 categories that's 184 nodes

## ARCHITECTURE RULES (NEVER VIOLATE)
- Pan/zoom: `<g transform="translate(${pan.x}, ${pan.y}) scale(${zoom})">` — NO viewBox
- Wheel: native addEventListener with `{ passive: false }` in useEffect — NO React onWheel  
- Resize handler: only updates dims state, never zoom/pan
- Positions: use dims.width/dims.height (container), NOT hardcoded values
- All topic rendering: iterate `visibleGroups` entries, NOT `filteredNodes`

## DO NOT TOUCH (leave these exactly as-is)
- Lines 1-82: imports, interfaces, NODE_GRADIENTS, CATEGORY_STYLES, getCategoryStyle, formatTimeAgo
- Lines 83-110: component signature, refs, state declarations, auto-center effect
- Lines 111-185: node interaction state, discussion state, search state, fetch logic, resize handler, wheel handler, displayNodes, effectiveSearch, filter logic
- Lines 275-350: getPos, categoryGroups memo, fetchDiscussions, event handlers (mouse), zoom controls, fitView, stats
- Lines 735-890: Discussion panel (AnimatePresence block), bottom bar — LEAVE ALL OF THIS ALONE

## CHANGES REQUIRED

### Change 1: Reduce MAX_VISIBLE_PER_CATEGORY (line 187)
```
FROM: const MAX_VISIBLE_PER_CATEGORY = 8
TO:   const MAX_VISIBLE_PER_CATEGORY = 5
```

### Change 2: Rewrite the `positions` useMemo (lines 207-262)
Replace the ENTIRE positions useMemo with this logic:

```typescript
const positions = useMemo(() => {
  const cx = dims.width / 2
  const cy = dims.height / 2
  const result: Record<string, { x: number; y: number }> = {}
  result['root'] = { x: cx, y: cy }

  const categories = Array.from(visibleGroups.keys())
  if (categories.length === 0) return result

  // --- INTERLEAVE: alternate big/small categories around ring ---
  const sorted = [...categories].sort((a, b) =>
    (visibleGroups.get(b)?.total || 0) - (visibleGroups.get(a)?.total || 0)
  )
  const interleaved: string[] = []
  let lo = 0, hi = sorted.length - 1
  while (lo <= hi) {
    interleaved.push(sorted[lo++])
    if (lo <= hi) interleaved.push(sorted[hi--])
  }

  // --- WEIGHTED angular spacing ---
  const totalTopics = Array.from(visibleGroups.values()).reduce((s, g) => s + g.total, 0)
  const MIN_ANGLE = 0.12 // ~7 degrees minimum per category
  const availableAngle = Math.PI * 2 - interleaved.length * MIN_ANGLE

  // Category ring radius — large enough to give breathing room
  const catRadius = Math.min(dims.width, dims.height) * 0.32

  // Track allocated angles for topic spread capping
  const categoryMeta = new Map<string, { center: number; allocated: number }>()

  let currentAngle = -Math.PI / 2 // start at top
  interleaved.forEach((cat) => {
    const weight = (visibleGroups.get(cat)?.total || 1) / totalTopics
    const catAngle = MIN_ANGLE + weight * availableAngle
    const angle = currentAngle + catAngle / 2
    currentAngle += catAngle

    const catX = cx + Math.cos(angle) * catRadius
    const catY = cy + Math.sin(angle) * catRadius
    result[`cat-${cat}`] = { x: catX, y: catY }
    categoryMeta.set(cat, { center: angle, allocated: catAngle })

    // --- TOPIC FAN layout ---
    const { visible, overflow } = visibleGroups.get(cat)!
    const nodeCount = visible.length + (overflow > 0 ? 1 : 0)
    const awayAngle = Math.atan2(catY - cy, catX - cx)

    // Radius from category center to topics — big enough to avoid collision
    const topicRadius = 100 + nodeCount * 18

    // Angular spread: ensure min gap of 140px between adjacent nodes
    // At radius R, angular gap for W pixels = W / R
    const minGapAngle = 140 / topicRadius
    const neededSpread = nodeCount * minGapAngle
    const maxSpread = catAngle * 0.85 // never exceed 85% of allocated angle
    const spread = Math.min(neededSpread, maxSpread)

    visible.forEach((topic, j) => {
      const count = Math.max(nodeCount - 1, 1)
      const tAngle = awayAngle - spread / 2 + (j / count) * spread
      // Stagger into 2 rows: even indices at base radius, odd pushed 50px further out
      const rowOffset = j % 2 === 0 ? 0 : 50
      result[topic.id] = {
        x: catX + Math.cos(tAngle) * (topicRadius + rowOffset),
        y: catY + Math.sin(tAngle) * (topicRadius + rowOffset)
      }
    })

    // Overflow "+N more" node — placed beyond all topics, in the away direction
    if (overflow > 0) {
      result[`overflow-${cat}`] = {
        x: catX + Math.cos(awayAngle) * (topicRadius + 110),
        y: catY + Math.sin(awayAngle) * (topicRadius + 110)
      }
    }
  })

  return result
}, [visibleGroups, dims])
```

### Change 3: Visual refinements in the SVG rendering

#### 3a. Add per-category topic gradients (in <defs>, after the existing category gradients block ~line 455)
Add this block right after the `{/* Category gradients */}` map:
```tsx
{/* Topic gradients (softer version of category colors) */}
{Object.entries(CATEGORY_STYLES).map(([cat, style]) => (
  <linearGradient key={`topic-${cat}`} id={`topicCatGrad-${cat}`} x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stopColor={style.from} stopOpacity={0.82} />
    <stop offset="100%" stopColor={style.to} stopOpacity={0.82} />
  </linearGradient>
))}
```

#### 3b. Topic nodes: use category-colored gradients instead of random rainbow
In the topic node rendering (~line 643), change:
```
const gradId = `topicGrad${idx % NODE_GRADIENTS.length}`
```
to:
```
const gradId = `topicCatGrad-${node.category || 'other'}`
```

#### 3c. Stronger root→category connections
In the root-to-category path (~line 490), change these attributes:
```
FROM: strokeWidth={hoveredNode?.startsWith(`cat-${cat}`) ? 2.5 : 1.2}
TO:   strokeWidth={hoveredNode?.startsWith(`cat-${cat}`) ? 3 : 2}

FROM: opacity={hoveredNode?.startsWith(`cat-${cat}`) ? 0.8 : 0.35}
TO:   opacity={hoveredNode?.startsWith(`cat-${cat}`) ? 0.9 : 0.55}
```

Also change the default stroke color from `#d1d5db` to the category's own color at low opacity. Replace:
```
stroke={hoveredNode?.startsWith(`cat-${cat}`) ? style.from : '#d1d5db'}
```
with:
```
stroke={style.from}
```
(The opacity already handles the dim/bright states)

#### 3d. Stronger category→topic connections  
Same pattern for topic connection lines (~line 510):
```
FROM: strokeWidth={isActive ? 2.5 : 1.2}
TO:   strokeWidth={isActive ? 2.5 : 1.5}

FROM: opacity={isActive ? 0.8 : 0.35}
TO:   opacity={isActive ? 0.85 : 0.4}

FROM: stroke={isActive ? style.from : '#d1d5db'}
TO:   stroke={style.from}
```

#### 3e. Lighter dot grid background
In the dot grid div (~line 413), change:
```
FROM: backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
TO:   backgroundImage: 'radial-gradient(circle, #e2e8f0 0.7px, transparent 0.7px)',
```

#### 3f. Category pill shows visible/total count
The category node rendering destructures `{ total }` from visibleGroups (~line 586).
Change to `{ visible, total }` and update the label:
```
FROM: {total} topics
TO:   {visible.length}/{total}
```
This requires changing the destructuring. Find the line:
```
{Array.from(visibleGroups.entries()).map(([cat, { total }]) => {
```
Change to:
```
{Array.from(visibleGroups.entries()).map(([cat, { visible: catVisible, total }]) => {
```
Then find `{total} topics` and change to `{catVisible.length}/{total}`

### Change 4: Remove the NODE_GRADIENTS array (lines 27-39)
Since we're no longer using random topic gradients, the `NODE_GRADIENTS` array is dead code.
Delete the entire const from line 27 to 39.
Also remove the `{/* Topic gradients */}` block in <defs> that maps over NODE_GRADIENTS (~line 444-449):
```
{NODE_GRADIENTS.map((g, i) => (
  <linearGradient key={i} id={`topicGrad${i}`} ...>
    ...
  </linearGradient>
))}
```
Delete that block.

## VERIFICATION
After all changes:
```bash
cd /Users/sheirraza/akhai/packages/web && npx tsc --noEmit
```
Must compile with zero TypeScript errors.

## SUMMARY OF EXPECTED OUTCOME
- 23 categories on ring, interleaved large/small, weighted angular spacing
- 5 topics max per category (down from 8), sorted by queryCount
- Topics colored by their category (not random rainbow)
- Stronger, category-colored connection lines
- Overflow node clearly separated from topic fan
- Category pills show "5/296" format
- Subtle dot grid background
- ~115 visible nodes total (23 categories × 5) — clean and readable
