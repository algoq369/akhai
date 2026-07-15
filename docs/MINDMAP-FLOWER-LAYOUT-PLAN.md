# Mindmap Inner-Bubble: Flower of Life Layout (PLAN)

> Planned 2026-07-15. Replaces the random-scatter cluster-detail view with a pertinence-ranked
> sacred-geometry arrangement. Self-contained to MindMapClusterDetail — the outer graph is untouched.

## PROBLEM
Drilling into a cluster (e.g. "other - 124 topics - 80 connections") shows dots in a random force-
scatter (MindMapClusterDetail renders positions from forceLayoutNodes at DiagramView:242). Chaotic,
no visual hierarchy. Should be: most-pertinent topic CENTER, less-pertinent radiating OUTWARD, in a
Flower-of-Life arrangement authentic to AkhAI's sacred-geometry identity + genuinely more usable.

## INJECTION POINT (verified)
- MindMapClusterDetail.tsx renders nodes at posMap.get(node.id) from forceLayoutNodes.positions.
- Each node ALREADY has: importance = connectionCounts[id] + min(queryCount, 8)  (line 222) — used
  today only for dot RADIUS. Reuse it for center-vs-ring RANK.
- SVG canvas: viewBox 0 0 svgW svgH (line 195) — center the flower at svgW/2, svgH/2.
- CHANGE ONLY the {x,y} each node gets in the drill view. Render loop, sizing, hover, click-analyse,
  dimming, labels, pan/zoom, outer graph = UNCHANGED.

## THE LAYOUT
New fn flowerOfLifeLayout(nodes, importanceOf, center, spacing) -> Map<id,{x,y}>:
- Rank nodes by importance DESC. #1 -> center.
- Concentric rings, each ring adds 6 slots (Flower of Life hex proportions): ring1=6, ring2=12,
  ring3=18... radius_r = r * spacing. Place at 60deg base intervals, offset per ring for the petal
  interlock. Within a ring, most-pertinent at top vertex (12 o'clock), fill clockwise -> pertinence
  decreases outward AND clockwise.
- RECOMMENDED HYBRID (handles 124 nodes cleanly): draw the Flower-of-Life GEOMETRY (overlapping-
  circle guide lines) as a faint backdrop at low opacity for the icon, but PLACE nodes on a
  pertinence-ranked golden-angle spiral scaled to the flower's proportions -> iconic look + zero
  overlap on dense clusters. (Pure-hex alternative: more geometrically rigid, but labels collide on
  big rings.) ALGOQ DECIDES: strict-flower vs hybrid-spiral.

## KEEP / TOUCHES
- KEEP: render loop, importance->radius, hover, click ("Tell me more about X"), connection dimming,
  labels, pan/zoom, connection lines (will form cleaner radial/petal patterns now).
- ADD: the faint Flower-of-Life backdrop geometry (low-opacity overlapping circles) behind the dots.
- ADD: subtle center-node emphasis (it's the cluster's heart).
- Connection lines still drawn between related nodes.

## GATES
SHIELD PASS; next build succeeds; drill into a cluster -> center = highest-importance topic, rings
radiate by decreasing pertinence, no overlap, hover/click still work, outer graph unchanged.

## OPEN DECISION (Algoq): strict Flower-of-Life hex vertices  vs  hybrid flower-backdrop + pertinence-spiral.
