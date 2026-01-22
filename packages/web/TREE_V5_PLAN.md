# Tree of Life - v5 Ultra-Optimized Redesign Plan

**Date:** January 9, 2026
**Status:** Ready for Implementation
**Complexity:** Very High (Major layout restructure + visual overhaul)
**Priority:** MAXIMUM - Production-critical improvements

---

## 🎯 OBJECTIVES

Complete v5 redesign based on production testing feedback:

1. **Remove top selector controls** - Eliminate AI/ACT/PIL/PATH/LVL controls
2. **Compact console** - 50% size reduction with lighting dot toggles
3. **Enlarge trees** - Make trees 67% larger with vibrant chakra glow
4. **Smart tooltip positioning** - Never cover trees, use free screen space
5. **Separate tree tooltips** - Sephiroth left side, Qliphoth right side
6. **Toggleable dashboard** - Compact panels with lighting dot indicators

---

## 📋 ISSUES IDENTIFIED (From Screenshot Analysis)

### Critical Issues:

1. ❌ **Top controls waste vertical space** - AI/ACT/PIL/PATH/LVL row (~80px height)
2. ❌ **Trees too small** - Currently 270×360px, hard to see details
3. ❌ **Chakra colors don't "shine"** - Glow effects too subtle (opacity 0.1-0.3)
4. ❌ **Tooltips cover trees** - Left tooltip overlaps Sephiroth tree
5. ❌ **Wrong tooltip positioning** - Hovering Sephiroth shows tooltip in Qliphoth area
6. ❌ **Bottom dashboard too large** - Static sections, not toggleable
7. ❌ **Console too large** - Current ~60px, needs 50% reduction to ~30px

### Visual Analysis:

From screenshot:
- **Current tree size**: ~270×360px (small circles, cramped spacing)
- **Current console**: Large buttons with backgrounds (60px height)
- **Current tooltips**: 220×200px but positioned incorrectly
- **Current colors**: Faded purple/blue, not vibrant chakra energy
- **Current dashboard**: 3-column static layout (~200px height)

**Target improvements:**
- Tree size: 450×600px (67% larger)
- Console: 30px height (50% reduction)
- Tooltips: Smart positioning (always in free space)
- Colors: Vibrant glowing chakra energy
- Dashboard: Collapsible panels (~60px collapsed, expand on click)

---

## 🗂️ TASK BREAKDOWN

### TASK 1: Remove Top Selector Controls

**Goal:** Delete entire AI/ACT/PIL/PATH/LVL selector row, reclaim ~80px vertical space.

**File:** `/Users/sheirraza/akhai/packages/web/app/tree-of-life/page.tsx`

**Current Location:** Lines ~682-760

**What to Remove:**

```typescript
{/* Top controls - VISUALIZATION / HIGHLIGHT / PATHS etc. */}
<div className="flex items-center justify-center gap-8 mb-3">
  {/* ▸ VISUALIZATION */}
  <div className="flex items-center gap-3">
    <span className="text-[9px] uppercase tracking-[0.2em] text-relic-slate">
      ▸ VISUALIZATION
    </span>
    <button>SEPHIROTH</button>
    <button>BOTH TREES</button>
    <button>QLIPHOTH</button>
  </div>

  {/* ◇ HIGHLIGHT */}
  <div>...</div>

  {/* ◆ AI CORRELATION */}
  <div>...</div>

  {/* ACT / PIL / LVL / PATHS buttons */}
  <div>...</div>
</div>
```

**Action:**
- Delete entire section (lines ~682-760)
- Remove all related state variables:
  - `showAICorrelations`
  - `highlightMode`
  - `showPaths`
- Keep only `treeView` state for SEPHIROTH/BOTH/QLIPHOTH tabs

**Result:** Reclaim 80px vertical space for larger trees

---

### TASK 2: Compact Console (50% Size Reduction)

**Goal:** Reduce hermetic console from 60px to 30px height, convert to lighting dot toggles.

**File:** `/Users/sheirraza/akhai/packages/web/app/tree-of-life/page.tsx`

**Current Console:** Lines ~682-778

**Before (60px height):**
```typescript
<div className="bg-white border-y border-relic-mist">
  <div className="max-w-7xl mx-auto px-3 py-1.5">
    {/* Large buttons with backgrounds */}
    <button className="px-3 py-1.5 bg-relic-ghost">
      SEPHIROTH
    </button>
  </div>
</div>
```

**After (30px height - Settings Style with Lighting Dots):**
```typescript
<div className="bg-white border-y border-relic-mist">
  <div className="max-w-7xl mx-auto px-3 py-1">
    <div className="flex items-center justify-center gap-6 text-[8px] font-mono uppercase tracking-wider">
      {/* View selector with lighting dots */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTreeView('sephiroth')}
          className="flex items-center gap-1.5 hover:text-relic-void transition-colors"
        >
          <span className={`text-[10px] ${treeView === 'sephiroth' ? 'text-purple-500' : 'text-relic-mist'}`}>
            {treeView === 'sephiroth' ? '◆' : '◇'}
          </span>
          <span className={treeView === 'sephiroth' ? 'text-relic-void' : 'text-relic-slate'}>
            Sephiroth
          </span>
        </button>

        <span className="text-relic-mist">│</span>

        <button
          onClick={() => setTreeView('dual')}
          className="flex items-center gap-1.5 hover:text-relic-void transition-colors"
        >
          <span className={`text-[10px] ${treeView === 'dual' ? 'text-purple-500' : 'text-relic-mist'}`}>
            {treeView === 'dual' ? '◆' : '◇'}
          </span>
          <span className={treeView === 'dual' ? 'text-relic-void' : 'text-relic-slate'}>
            Both Trees
          </span>
        </button>

        <span className="text-relic-mist">│</span>

        <button
          onClick={() => setTreeView('qliphoth')}
          className="flex items-center gap-1.5 hover:text-relic-void transition-colors"
        >
          <span className={`text-[10px] ${treeView === 'qliphoth' ? 'text-red-500' : 'text-relic-mist'}`}>
            {treeView === 'qliphoth' ? '◆' : '◇'}
          </span>
          <span className={treeView === 'qliphoth' ? 'text-relic-void' : 'text-relic-slate'}>
            Qliphoth
          </span>
        </button>
      </div>
    </div>
  </div>
</div>
```

**Design Specifications:**
- Height: `py-1` (8px padding = ~30px total)
- Font: `text-[8px]` monospace uppercase
- Lighting dots: `◆` (filled, active) vs `◇` (outline, inactive)
- Active dot color: Purple for Sephiroth/Both, Red for Qliphoth
- No backgrounds, just text and dots
- Hover: Text darkens to `text-relic-void`

**Result:** Console reduced from 60px to 30px (50% reduction)

---

### TASK 3: Enlarge Trees & Vibrant Chakra Glow

**Goal:** Increase tree size by 67%, make chakra colors vibrant with strong glow effects.

**File:** `/Users/sheirraza/akhai/packages/web/app/tree-of-life/page.tsx`

#### Part A: Increase Tree Container Sizes

**Current Sizes (v4):**
```typescript
// Dual view
style={{ width: '270px', height: '360px' }}

// Single view
style={{ width: '300px', height: '390px' }}
```

**New Sizes (v5 - 67% larger):**
```typescript
// Dual view (each tree)
style={{ width: '450px', height: '600px' }}

// Single view
style={{ width: '500px', height: '650px' }}
```

**SVG ViewBox:** Keep same (`0 0 500 650`) - scaling handled by container

**Location:** Lines ~800-850 (SVG container divs)

#### Part B: Vibrant Chakra Colors (Brighten by 20%)

**Current `getColor()` function:** Lines ~475-492

**Before (Faded Colors):**
```typescript
const getColor = (sefirah: Sefirah): string => {
  const chakraColors: Record<Sefirah, string> = {
    [Sefirah.KETHER]: '#C084FC',    // Crown - Faded Purple
    [Sefirah.CHOKMAH]: '#818CF8',   // Third Eye - Faded Indigo
    [Sefirah.BINAH]: '#6366F1',     // Third Eye - Faded Indigo
    // ... more faded colors
  }
  return chakraColors[sefirah] || '#9ca3af'
}
```

**After (Vibrant Chakra Energy - 20% Brighter):**
```typescript
const getColor = (sefirah: Sefirah): string => {
  const chakraColors: Record<Sefirah, string> = {
    [Sefirah.KETHER]: '#E0B3FF',    // Crown - Brilliant Violet (was #C084FC)
    [Sefirah.CHOKMAH]: '#A8B3FF',   // Third Eye - Bright Indigo (was #818CF8)
    [Sefirah.BINAH]: '#8B8FFF',     // Third Eye - Vibrant Indigo (was #6366F1)
    [Sefirah.DAAT]: '#38D4F0',      // Throat - Bright Cyan (was #06B6D4)
    [Sefirah.CHESED]: '#3FE0A5',    // Heart - Vibrant Emerald (was #10B981)
    [Sefirah.GEVURAH]: '#FF66C4',   // Heart - Bright Magenta (was #EC4899)
    [Sefirah.TIFERET]: '#FFD666',   // Solar Plexus - Bright Gold (was #FBBF24)
    [Sefirah.NETZACH]: '#FFB366',   // Sacral - Bright Orange (was #FB923C)
    [Sefirah.HOD]: '#FFB329',       // Sacral - Vibrant Amber (was #F59E0B)
    [Sefirah.YESOD]: '#FF8F8F',     // Root/Sacral - Bright Red-Orange (was #F87171)
    [Sefirah.MALKUTH]: '#FF6666',   // Root - Vibrant Ruby (was #EF4444)
  }
  return chakraColors[sefirah] || '#9ca3af'
}
```

**Color Brightness Calculation:**
- Original HSL: `hsl(h, s, l)`
- New HSL: `hsl(h, s, l + 20%)` ← Increase lightness by 20%

#### Part C: Enhanced Glow Effects

**Current Glow:** Lines ~996-1040 (outer energy glow circles)

**Before (Subtle Glow):**
```typescript
{/* Outer energy glow */}
<motion.circle
  cx={pos.x}
  cy={pos.y}
  r={radius + 12}
  fill="none"
  stroke={color}
  strokeWidth="1"
  opacity={0.1 + activation * 0.15}  // ← TOO SUBTLE (max 0.25)
  // ...
/>
```

**After (Strong Chakra Glow):**
```typescript
{/* Outer energy glow - VIBRANT */}
<motion.circle
  cx={pos.x}
  cy={pos.y}
  r={radius + 16}  // Larger glow radius
  fill="none"
  stroke={color}
  strokeWidth="2"  // Thicker stroke
  opacity={0.4 + activation * 0.4}  // ← BRIGHT (max 0.8)
  filter="drop-shadow(0 0 8px {color})"  // ← ADD DROP SHADOW
  animate={isActive ? {
    opacity: [0.4 + activation * 0.4, 0.6 + activation * 0.4, 0.4 + activation * 0.4],
    r: [radius + 16, radius + 20, radius + 16],
  } : {}}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>

{/* Middle glow ring - NEW */}
<motion.circle
  cx={pos.x}
  cy={pos.y}
  r={radius + 8}
  fill="none"
  stroke={color}
  strokeWidth="1.5"
  opacity={0.5 + activation * 0.3}
  filter="blur(1px)"
  animate={{
    opacity: [0.5, 0.7, 0.5],
  }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut",
    delay: 0.3
  }}
/>

{/* Inner core glow */}
<motion.circle
  cx={pos.x}
  cy={pos.y}
  r={radius * 0.6}
  fill={color}
  opacity={0.2 + activation * 0.5}  // Brighter core
  filter="blur(3px)"
/>

{/* Center activation dot - BRIGHTEST */}
<motion.circle
  cx={pos.x}
  cy={pos.y}
  r={radius * 0.2}
  fill={color}
  opacity={0.9}  // Almost opaque
  filter="drop-shadow(0 0 4px {color})"
  animate={{
    scale: [1, 1.3, 1],
    opacity: [0.9, 1, 0.9],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>
```

**Glow Specifications:**
- **Outer glow**: opacity 0.4-0.8 (was 0.1-0.25), radius +16px, drop-shadow
- **Middle ring**: NEW layer, blur(1px), pulsing
- **Inner core**: blur(3px), brighter fill
- **Center dot**: opacity 0.9, drop-shadow, breathing animation
- **All layers**: Use vibrant chakra colors from updated palette

**Apply to both Sephiroth AND Qliphoth trees**

**Result:** Trees are 67% larger with vibrant glowing chakra energy

---

### TASK 4: Smart Tooltip Positioning (Never Cover Trees)

**Goal:** Position tooltips intelligently to always use free screen space, never overlap trees.

**File:** `/Users/sheirraza/akhai/packages/web/app/tree-of-life/page.tsx`

**Current Issue:** Tooltip positioning logic doesn't account for tree boundaries (lines 435-507)

#### New Positioning Logic:

**Rules:**
1. **Sephiroth Tree** → Tooltip ALWAYS on LEFT side of screen
2. **Qliphoth Tree** → Tooltip ALWAYS on RIGHT side of screen
3. **Dual View** → Sephiroth tooltips LEFT, Qliphoth tooltips RIGHT
4. Vertical position: Align with hovered node, adjust if near top/bottom edge

**Implementation:**

```typescript
useEffect(() => {
  if ((hoveredSefirah || hoveredQliphah) && svgContainerRef.current) {
    const isQliphoth = !!hoveredQliphah
    const nodeId = hoveredSefirah || hoveredQliphah
    const nodePos = isQliphoth
      ? qliphothPositions[nodeId!]
      : treePositions[nodeId as Sefirah]

    if (!nodePos) return

    const svgRect = svgContainerRef.current.getBoundingClientRect()

    // Calculate node position in viewport
    const scaleX = svgRect.width / 500  // SVG viewBox width
    const scaleY = svgRect.height / 650 // SVG viewBox height

    const nodeX = svgRect.left + (nodePos.x * scaleX)
    const nodeY = svgRect.top + (nodePos.y * scaleY)

    // Tooltip dimensions
    const TOOLTIP_WIDTH = 220
    const TOOLTIP_HEIGHT = 200
    const MARGIN = 20

    let x: number
    let y: number
    let arrowSide: 'left' | 'right'

    // SMART POSITIONING BASED ON TREE TYPE
    if (isQliphoth) {
      // QLIPHOTH → Always position on RIGHT side
      x = svgRect.right + MARGIN
      arrowSide = 'left'  // Arrow points left toward tree

      // If tooltip would go off right edge, position inside tree area (right-aligned)
      if (x + TOOLTIP_WIDTH > window.innerWidth - MARGIN) {
        x = window.innerWidth - TOOLTIP_WIDTH - MARGIN
      }
    } else {
      // SEPHIROTH → Always position on LEFT side
      x = svgRect.left - TOOLTIP_WIDTH - MARGIN
      arrowSide = 'right'  // Arrow points right toward tree

      // If tooltip would go off left edge, position inside tree area (left-aligned)
      if (x < MARGIN) {
        x = MARGIN
      }
    }

    // Vertical position: align with node, adjust if near edges
    y = nodeY - (TOOLTIP_HEIGHT / 2)

    // Keep within viewport bounds (top/bottom)
    if (y < MARGIN) {
      y = MARGIN
    } else if (y + TOOLTIP_HEIGHT > window.innerHeight - MARGIN) {
      y = window.innerHeight - TOOLTIP_HEIGHT - MARGIN
    }

    setTooltipPosition({ x, y, arrowSide })
  } else {
    setTooltipPosition(null)
  }
}, [hoveredSefirah, hoveredQliphah, svgContainerRef])
```

**Tooltip Arrow Direction:**

```typescript
{/* Arrow pointer */}
<div
  className="absolute w-0 h-0"
  style={{
    [tooltipPosition.arrowSide === 'left' ? 'left' : 'right']: '-8px',
    top: '50%',
    transform: 'translateY(-50%)',
    borderTop: '8px solid transparent',
    borderBottom: '8px solid transparent',
    [tooltipPosition.arrowSide === 'left' ? 'borderRight' : 'borderLeft']: '8px solid #e8e8e8',
  }}
/>
```

**State Update:**
```typescript
interface TooltipPosition {
  x: number
  y: number
  arrowSide: 'left' | 'right'
}

const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null)
```

**Result:** Tooltips never cover trees, always positioned optimally in free screen space

---

### TASK 5: Update Qliphoth Tree Visual Parity

**Goal:** Ensure Qliphoth tree has same size and vibrant glow as Sephiroth tree.

**File:** `/Users/sheirraza/akhai/packages/web/app/tree-of-life/page.tsx`

**Current Issue:** Qliphoth nodes may not have same glow layers as Sephiroth

**Apply ALL glow effects from TASK 3 to Qliphoth nodes:**

```typescript
{/* Qliphoth nodes - SAME GLOW SYSTEM */}
{Object.entries(QLIPHOTH_METADATA).map(([id, node]) => {
  const isHovered = hoveredQliphah === id
  const isSelected = selectedQliphah === id
  const activation = 0.5  // Default activation for Qliphoth
  const color = '#FF6666'  // Red for Qliphoth (or per-node colors if defined)
  const radius = 25

  return (
    <motion.g key={id}>
      {/* Outer energy glow - VIBRANT (same as Sephiroth) */}
      <motion.circle
        cx={qliphothPositions[id].x}
        cy={qliphothPositions[id].y}
        r={radius + 16}
        fill="none"
        stroke={color}
        strokeWidth="2"
        opacity={0.4 + activation * 0.4}
        filter="drop-shadow(0 0 8px {color})"
        animate={{
          opacity: [0.4, 0.7, 0.4],
          r: [radius + 16, radius + 20, radius + 16],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Middle glow ring */}
      <motion.circle
        cx={qliphothPositions[id].x}
        cy={qliphothPositions[id].y}
        r={radius + 8}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity={0.5}
        filter="blur(1px)"
        animate={{
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3
        }}
      />

      {/* Inner core glow */}
      <motion.circle
        cx={qliphothPositions[id].x}
        cy={qliphothPositions[id].y}
        r={radius * 0.6}
        fill={color}
        opacity={0.3}
        filter="blur(3px)"
      />

      {/* Center dot - BRIGHTEST */}
      <motion.circle
        cx={qliphothPositions[id].x}
        cy={qliphothPositions[id].y}
        r={radius * 0.2}
        fill={color}
        opacity={0.9}
        filter="drop-shadow(0 0 4px {color})"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main lighting circle (outline) */}
      <motion.circle
        cx={qliphothPositions[id].x}
        cy={qliphothPositions[id].y}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={isSelected ? "3" : "2"}
        opacity={0.7}
        style={{ cursor: 'pointer' }}
        animate={isHovered ? {
          scale: 1.1,
          opacity: 0.9,
        } : {}}
      />

      {/* Node labels */}
      <text
        x={qliphothPositions[id].x}
        y={qliphothPositions[id].y + radius + 14}
        textAnchor="middle"
        fontSize="9"
        fill="#64748b"
        fontFamily="monospace"
      >
        {node.name}
      </text>
    </motion.g>
  )
})}
```

**Qliphoth Color Variants (Per-Node):**

If you want each Qliphoth node to have its own color (inverted chakra):

```typescript
const getQliphothColor = (id: string): string => {
  const qliphothColors: Record<string, string> = {
    '1': '#FF6666',   // Thaumiel - Red (opposite of Kether violet)
    '2': '#FF8F42',   // Ghagiel - Orange
    '3': '#FFB84D',   // Satariel - Amber
    '4': '#FF66A3',   // Gha Agsheblah - Magenta
    '5': '#E63946',   // Golachab - Deep Red
    '6': '#F77F00',   // Tagiriron - Dark Orange
    '7': '#D62828',   // Harab Serapel - Crimson
    '8': '#A4161A',   // Samael - Dark Red
    '9': '#BA181B',   // Gamaliel - Blood Red
    '10': '#660708',  // Lilith - Deep Crimson
    '11': '#8B0000',  // Nehemoth - Dark Red
    '12': '#800000',  // Neheshethiron - Maroon
  }
  return qliphothColors[id] || '#EF4444'
}
```

**Result:** Qliphoth tree visually matches Sephiroth tree with vibrant glow

---

### TASK 6: Compact Toggleable Dashboard

**Goal:** Create ultra-compact dashboard with lighting dot toggles like methodology selector.

**File:** `/Users/sheirraza/akhai/packages/web/app/tree-of-life/page.tsx`

**Current Dashboard:** Lines ~1940-2240 (large static sections)

#### New Dashboard Design:

**Layout:**
- All panels collapsed by default (show only headers)
- Click header to toggle panel open/closed
- Lighting dot indicator: `◆` (open) vs `◇` (closed)
- Smooth expand/collapse animation
- Total height: ~60px (collapsed), ~400px (all expanded)

**Implementation:**

```typescript
// State for dashboard panels
const [openPanels, setOpenPanels] = useState<Set<string>>(new Set())

const togglePanel = (panelId: string) => {
  setOpenPanels(prev => {
    const next = new Set(prev)
    if (next.has(panelId)) {
      next.delete(panelId)
    } else {
      next.add(panelId)
    }
    return next
  })
}

// Dashboard panels configuration
const dashboardPanels = [
  {
    id: 'ai-layers',
    title: 'AI Computational Layers',
    icon: '▸',
    defaultOpen: false
  },
  {
    id: 'system-status',
    title: 'System Status',
    icon: '◇',
    defaultOpen: false
  },
  {
    id: 'pillar-balance',
    title: 'Pillar Balance',
    icon: '◇',
    defaultOpen: false
  },
  {
    id: 'top-activated',
    title: 'Top Activated',
    icon: '◇',
    defaultOpen: false
  },
  {
    id: 'evolution',
    title: 'Evolution Timeline',
    icon: '◇',
    defaultOpen: false
  },
  {
    id: 'reasoning',
    title: 'Reasoning Process',
    icon: '◇',
    defaultOpen: false
  }
]

// Dashboard JSX
<div className="border-t border-relic-mist bg-white">
  <div className="max-w-7xl mx-auto">
    {/* Compact panel headers */}
    <div className="flex items-center justify-start gap-4 px-3 py-2 border-b border-relic-mist overflow-x-auto">
      {dashboardPanels.map(panel => (
        <button
          key={panel.id}
          onClick={() => togglePanel(panel.id)}
          className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider hover:text-relic-void transition-colors whitespace-nowrap"
        >
          <span className={`text-[10px] ${openPanels.has(panel.id) ? 'text-purple-500' : 'text-relic-mist'}`}>
            {openPanels.has(panel.id) ? '◆' : '◇'}
          </span>
          <span className={openPanels.has(panel.id) ? 'text-relic-void' : 'text-relic-slate'}>
            {panel.title}
          </span>
        </button>
      ))}
    </div>

    {/* Panel content (collapsible) */}
    <AnimatePresence>
      {openPanels.has('ai-layers') && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-relic-mist"
        >
          <div className="p-3">
            {/* AI Computational Layers content */}
            <div className="space-y-1">
              {Object.entries(SEPHIROTH_METADATA).map(([key, meta]) => {
                const sefirah = parseInt(key) as Sefirah
                const activation = activations[sefirah] || 0
                const color = getColor(sefirah)

                return (
                  <div key={sefirah} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[8px] font-mono text-relic-slate">
                        {meta.name}
                      </span>
                      <span className="text-[7px] text-relic-silver">
                        {meta.aiComputation.split('•')[0].trim()}
                      </span>
                    </div>
                    <span className="text-[8px] text-relic-void font-mono">
                      {(activation * 100).toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {openPanels.has('system-status') && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-relic-mist"
        >
          <div className="p-3">
            {/* System Status content */}
            <div className="flex items-center justify-between text-[8px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-green-500">●</span>
                <span className="text-relic-slate">Active</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-relic-silver">Queries:</span>
                  <span className="text-relic-void">{stats.totalQueries}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-relic-silver">Efficiency:</span>
                  <span className="text-relic-void">
                    {stats.totalQueries > 0 ? '100%' : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {openPanels.has('pillar-balance') && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-relic-mist"
        >
          <div className="p-3">
            {/* Pillar Balance content */}
            <div className="space-y-2">
              {['left', 'middle', 'right'].map(pillar => {
                const total = Object.entries(activations).filter(([s]) =>
                  SEPHIROTH_METADATA[parseInt(s) as Sefirah].pillar === pillar
                ).reduce((sum, [_, act]) => sum + act, 0)

                const totalActivation = Object.values(activations).reduce((a, b) => a + b, 0)
                const percentage = totalActivation > 0 ? (total / totalActivation) * 100 : 0

                return (
                  <div key={pillar} className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-relic-slate capitalize w-12">
                      {pillar}
                    </span>
                    <div className="flex-1 h-1 bg-relic-ghost overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: pillar === 'left' ? '#FF6666' :
                                         pillar === 'middle' ? '#C084FC' : '#3b82f6'
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-relic-silver font-mono w-10 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}

      {openPanels.has('top-activated') && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-relic-mist"
        >
          <div className="p-3">
            {/* Top Activated content */}
            <div className="space-y-1">
              {(Object.entries(activations) as Array<[Sefirah, number]>)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([sefirah, activation]) => {
                  const meta = SEPHIROTH_METADATA[sefirah]
                  const color = getColor(sefirah)

                  return (
                    <button
                      key={sefirah}
                      onClick={() => setSelectedSefirah(sefirah)}
                      className="flex items-center justify-between w-full hover:text-relic-void transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[8px] font-mono text-relic-slate">
                          {meta.name}
                        </span>
                      </div>
                      <span className="text-[8px] text-relic-void font-mono">
                        {(activation * 100).toFixed(0)}%
                      </span>
                    </button>
                  )
                })}
            </div>
          </div>
        </motion.div>
      )}

      {openPanels.has('evolution') && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-relic-mist"
        >
          <div className="p-3">
            {/* Evolution Timeline content */}
            <div className="text-[8px] text-relic-slate font-mono">
              <div className="flex items-center justify-between mb-2">
                <span className="text-relic-silver">Date Range:</span>
                <span>
                  {new Date(stats.dateRange.earliest).toLocaleDateString()} - {new Date(stats.dateRange.latest).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-relic-silver">Total Evolution Points:</span>
                <span>{evolutionData.length}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {openPanels.has('reasoning') && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-relic-mist"
        >
          <div className="p-3">
            {/* Reasoning Process content */}
            <div className="space-y-2 text-[8px] font-mono">
              <div>
                <span className="text-relic-silver">Dominant Sefirah:</span>
                <span className="ml-2 text-relic-void">
                  {SEPHIROTH_METADATA[stats.dominantSefirahOverall]?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-relic-silver">Average Level:</span>
                <span className="ml-2 text-relic-void">
                  {stats.averageLevel.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</div>
```

**Dashboard Specifications:**
- **Headers row**: 40px height, horizontal scrollable, lighting dots
- **Collapsed**: Only headers visible (~40px total)
- **Expanded**: Content animates down (height: 0 → auto)
- **Animation**: 200ms smooth expand/collapse
- **Dots**: `◆` (purple, open) vs `◇` (grey, closed)
- **Font**: 8px monospace for content, uppercase headers
- **Spacing**: Minimal padding (p-3)

**Result:** Dashboard reduced from ~200px to ~40px (collapsed), toggleable panels

---

## 📊 VISUAL SPECIFICATIONS

### Tree Sizes (v5):

| View | Container Size | Increase from v4 |
|------|---------------|------------------|
| Dual Sephiroth | 450×600px | +67% (was 270×360) |
| Dual Qliphoth | 450×600px | +67% (was 270×360) |
| Single Sephiroth | 500×650px | +67% (was 300×390) |
| Single Qliphoth | 500×650px | +67% (was 300×390) |

### Chakra Colors (Vibrant - 20% Brighter):

| Sefirah | Previous | New (v5) | Energy |
|---------|----------|----------|--------|
| Kether | #C084FC | #E0B3FF | Crown Chakra |
| Chokmah | #818CF8 | #A8B3FF | Third Eye |
| Binah | #6366F1 | #8B8FFF | Third Eye |
| Da'at | #06B6D4 | #38D4F0 | Throat |
| Chesed | #10B981 | #3FE0A5 | Heart |
| Gevurah | #EC4899 | #FF66C4 | Heart |
| Tiferet | #FBBF24 | #FFD666 | Solar Plexus |
| Netzach | #FB923C | #FFB366 | Sacral |
| Hod | #F59E0B | #FFB329 | Sacral |
| Yesod | #F87171 | #FF8F8F | Root/Sacral |
| Malkuth | #EF4444 | #FF6666 | Root |

### Glow Effects (Enhanced):

| Layer | Radius | Opacity | Filter | Animation |
|-------|--------|---------|--------|-----------|
| Outer glow | radius+16 | 0.4-0.8 | drop-shadow(0 0 8px) | Pulse + expand |
| Middle ring | radius+8 | 0.5-0.7 | blur(1px) | Opacity pulse |
| Inner core | radius×0.6 | 0.2-0.7 | blur(3px) | Static |
| Center dot | radius×0.2 | 0.9-1.0 | drop-shadow(0 0 4px) | Breathing scale |

### Space Allocation (1080p - 1920×1080):

| Section | Current (v4) | New (v5) | Savings |
|---------|-------------|----------|---------|
| Top controls | 80px | 0px | +80px ✅ |
| Console | 60px | 30px | +30px ✅ |
| Trees area | 360px | 600px | +240px (reclaimed space) |
| Dashboard | 200px | 40-400px | +160px (collapsed) ✅ |
| **Total height** | ~700px | ~670px (collapsed) | More compact ✅ |

### Console Design (Settings Style):

```
┌─────────────────────────────────────────────────────────┐
│  ◆ Sephiroth  │  ◇ Both Trees  │  ◇ Qliphoth            │  ← 30px height
└─────────────────────────────────────────────────────────┘
```

**Typography:**
- Font: Monospace 8px uppercase
- Lighting dots: 10px (◆ active, ◇ inactive)
- Active color: Purple (Sephiroth), Red (Qliphoth)
- Spacing: 6px gap between buttons

### Dashboard Panels (Collapsed):

```
┌────────────────────────────────────────────────────────────────┐
│ ◇ AI Layers  ◇ System  ◇ Pillar  ◇ Top 5  ◇ Evolution  ◇ Reason │  ← 40px
└────────────────────────────────────────────────────────────────┘
```

**Expanded (example - AI Layers open):**

```
┌────────────────────────────────────────────────────────────────┐
│ ◆ AI Layers  ◇ System  ◇ Pillar  ◇ Top 5  ◇ Evolution  ◇ Reason │
├────────────────────────────────────────────────────────────────┤
│ ● Kether     Meta-Cognitive          95%                        │
│ ● Chokmah    Principle Layer         82%                        │
│ ● Binah      Pattern Layer           78%                        │
│ ...                                                              │  ← Expands ~150px
└────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ IMPLEMENTATION ORDER

**Recommended Sequence:**

### Phase 1: Layout Restructure (60 min)
1. **TASK 1**: Remove top selector controls (delete lines ~682-760)
2. **TASK 2**: Compact console (replace lines ~682-778)
3. **TASK 3A**: Enlarge tree containers (update SVG div sizes)
   - Test that trees render at new size
   - Verify responsiveness

### Phase 2: Visual Enhancement (90 min)
4. **TASK 3B**: Update chakra colors (brighten by 20%)
5. **TASK 3C**: Enhanced glow effects (4-layer system)
6. **TASK 5**: Apply same glow to Qliphoth tree
   - Test that both trees look identical visually
   - Verify animations smooth

### Phase 3: Smart Positioning (45 min)
7. **TASK 4**: Implement smart tooltip positioning
   - Test Sephiroth tooltips go left
   - Test Qliphoth tooltips go right
   - Verify no tree coverage in dual view
   - Test edge cases (top/bottom nodes)

### Phase 4: Dashboard Redesign (60 min)
8. **TASK 6**: Create toggleable dashboard
   - Implement panel toggle state
   - Build collapsible sections
   - Add lighting dot indicators
   - Test animations smooth

**Total Estimated Time:** 4-5 hours

---

## ✅ SUCCESS CRITERIA

### Layout:
- [ ] Top selector controls removed (80px reclaimed)
- [ ] Console reduced to 30px (50% smaller)
- [ ] Trees enlarged to 450×600px dual, 500×650px single
- [ ] Dashboard collapsible (40px collapsed, expands on click)

### Visual Quality:
- [ ] Chakra colors 20% brighter (vibrant energy)
- [ ] 4-layer glow system (outer, middle, core, center)
- [ ] Glow opacity 0.4-0.8 (visible, not subtle)
- [ ] Drop-shadow and blur filters applied
- [ ] Smooth breathing/pulsing animations

### Tooltip Positioning:
- [ ] Sephiroth tooltips ALWAYS on left side
- [ ] Qliphoth tooltips ALWAYS on right side
- [ ] Never covers trees
- [ ] Adjusts for viewport edges
- [ ] Arrow points toward correct tree

### Qliphoth Parity:
- [ ] Same size as Sephiroth tree
- [ ] Same 4-layer glow system
- [ ] Same animations
- [ ] Interactive (hover/click/tooltips)

### Dashboard:
- [ ] All panels collapsed by default
- [ ] Lighting dot indicators (◆ open, ◇ closed)
- [ ] Smooth expand/collapse animation (200ms)
- [ ] 6 panels: AI Layers, System, Pillar, Top 5, Evolution, Reasoning
- [ ] Ultra-compact when collapsed (~40px)

---

## 🚨 TESTING CHECKLIST

### Visual Testing:
1. [ ] Open http://localhost:3000/tree-of-life
2. [ ] Verify trees are LARGE (450×600px visible)
3. [ ] Check chakra colors are VIBRANT (not faded)
4. [ ] See STRONG GLOW around nodes (not subtle)
5. [ ] Watch animations (breathing, pulsing)

### Tooltip Testing:
1. [ ] Hover Sephiroth node → Tooltip appears on LEFT
2. [ ] Hover Qliphoth node → Tooltip appears on RIGHT
3. [ ] Switch to dual view
4. [ ] Hover left tree → Tooltip on left
5. [ ] Hover right tree → Tooltip on right
6. [ ] Verify NO overlap with trees

### Dashboard Testing:
1. [ ] All panels closed on load (only headers visible)
2. [ ] Click "AI Layers" → Panel expands down
3. [ ] Lighting dot changes: ◇ → ◆
4. [ ] Click again → Panel collapses
5. [ ] Test all 6 panels toggle correctly

### Console Testing:
1. [ ] Console is compact (30px height)
2. [ ] Lighting dots show active state (◆ vs ◇)
3. [ ] Click "Sephiroth" → Purple dot, view changes
4. [ ] Click "Both Trees" → Shows dual view
5. [ ] Click "Qliphoth" → Red dot, view changes

---

## 📝 IMPLEMENTATION NOTES

### Important Considerations:

1. **Tree Sizing:** New 450×600px size means trees will take up more horizontal space. In dual view, you'll need ~950px width minimum (450+450+50px gap). Consider:
   - Reducing gap between trees from 50px to 30px
   - OR making dual view stack vertically on narrow screens

2. **Glow Performance:** 4-layer glow system with blur/drop-shadow filters may impact performance on lower-end devices. If laggy:
   - Reduce blur radius (3px → 2px)
   - Remove drop-shadow on outer glow
   - Disable animations for nodes with activation < 0.2

3. **Tooltip Arrow:** Arrow direction must flip based on side:
   - Left side tooltip → Arrow points RIGHT (toward tree)
   - Right side tooltip → Arrow points LEFT (toward tree)

4. **Dashboard Panel Content:** Keep content ultra-compact:
   - Font: 8px maximum
   - Line height: 1.2-1.4
   - Padding: 12px (p-3)
   - Max expanded height per panel: ~150px

5. **Color Brightness:** HSL lightness increase of 20% applied to all chakra colors. If colors look washed out, reduce to 15% increase.

---

## 🎨 DESIGN REFERENCE

### Methodology Selector Style (to match):

Current methodology selector has:
- Lighting dots (◆ active, ◇ inactive)
- Monospace 8-9px font
- Uppercase tracking
- Purple accent for active
- Minimal spacing
- No backgrounds

**Apply this exact style to:**
- Console view selector
- Dashboard panel headers

### Settings Page Style (to match):

Current settings page has:
- Raw text, no backgrounds
- Grey-only palette (white/ghost/silver/slate/void)
- Unicode symbols (▸, ◇, ◆, │)
- Ultra-small fonts (7-9px)
- Minimal spacing
- Clean professional look

**Apply this exact style to:**
- Dashboard panel content
- Compact console

---

## 🔗 FILES TO MODIFY

| File | Tasks | Complexity | Est. Lines Changed |
|------|-------|------------|-------------------|
| `app/tree-of-life/page.tsx` | ALL | Very High | ~800-1000 lines |

**No new files needed** - All changes are in existing Tree of Life page.

---

## 🚀 DEPLOYMENT

After implementation:

1. **Local testing**: Test thoroughly at http://localhost:3000/tree-of-life
2. **Visual verification**: Screenshot before/after for comparison
3. **Performance check**: Verify animations smooth (60fps)
4. **Responsive test**: Test on 1920×1080, 1366×768, 1280×720
5. **Build test**: `pnpm build` to check for TypeScript errors

---

**Ready for v5 implementation!** 🌳✨🚀

This plan addresses all identified issues from production testing and creates an ultra-optimized Tree of Life visualization with vibrant chakra energy, smart tooltip positioning, and compact toggleable dashboard.
