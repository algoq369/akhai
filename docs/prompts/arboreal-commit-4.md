# Arboreal — Commit 4: Compact tree + live movable environment

Paste into `cc` from `~/akhai`.

---

Arboreal commit 4 — compact the paragraph tree and add live displacement so expanding a block pushes neighbors aside. STOP on any gate failure.

SCOPE GUARD: Only ParagraphTree.tsx + ParagraphBlock.tsx + GhostBlock.tsx. No DB, no API, no prompts.

CONTEXT:
- ParagraphTree.tsx (66 lines) renders 11 blocks at TREE_POSITIONS × SCALE with PADDING
- ParagraphBlock.tsx (107 lines) toggles between collapsed (180px) and expanded (340px)
- GhostBlock.tsx (29 lines) renders dashed placeholder
- TREE_POSITIONS has 3 columns: left (x=94), center (x=250), right (x=406)
- Current SCALE=1.8 — tree is ~810×1170px, too spread out

DESIGN DECISIONS (confirmed by user):
1. Scale 1.8 → 1.2, collapsed blocks 180→150px, expanded 340→280px (medium compact)
2. Expand direction: AWAY from center. Left-column blocks expand leftward (left edge moves left, right edge stays). Right-column blocks expand rightward. Center blocks expand centered.
3. Vertical displacement: when expanded block is taller than gap to next block below, push that block down. Tree grows taller dynamically.
4. Animation: CSS transition 200ms ease-out on position/size changes.


COLUMN CLASSIFICATION (derived from TREE_POSITIONS):
  Left column (x=94):   Encoder, Discriminator, Classifier
  Center column (x=250): Meta-Core, Synthesis, Attention, Executor, Embedding
  Right column (x=406):  Reasoning, Expansion, Generative

At SCALE=1.2:
  Left x:  94×1.2 + 40 = 152.8
  Center x: 250×1.2 + 40 = 340
  Right x:  406×1.2 + 40 = 527.2
  Max Y (Embedding): 605×1.2 + 40 = 766

Column gaps: center-left = 187px, right-center = 187px.
Collapsed block at 150px = 75px each side. Two adjacent collapsed: 187-75-75 = 37px gap. Tight but clean.
Expanded block at 280px = 140px each side IF centered. But since left/right expand AWAY from center, no collision possible.

══════ STEP 1 — Classify each layer's column ══════

EDIT: packages/web/components/arboreal/ParagraphTree.tsx

Add a column classification map ABOVE the component:

```ts
type ColumnSide = 'left' | 'center' | 'right';

const LAYER_COLUMN: Record<number, ColumnSide> = {
  [Layer.ENCODER]: 'left',
  [Layer.DISCRIMINATOR]: 'left',
  [Layer.CLASSIFIER]: 'left',
  [Layer.META_CORE]: 'center',
  [Layer.SYNTHESIS]: 'center',
  [Layer.ATTENTION]: 'center',
  [Layer.EXECUTOR]: 'center',
  [Layer.EMBEDDING]: 'center',
  [Layer.REASONING]: 'right',
  [Layer.EXPANSION]: 'right',
  [Layer.GENERATIVE]: 'right',
};
```


══════ STEP 2 — Update scale + pass column + expanded state to blocks ══════

EDIT: packages/web/components/arboreal/ParagraphTree.tsx

Major rewrite. The tree now:
1. Changes SCALE from 1.8 to 1.2
2. Tracks which layers are expanded via `expandedLayers: Set<Layer>` state
3. Computes Y-offsets: for each layer, checks if any layer ABOVE it in the same column is expanded. If so, adds that block's overflow height to this layer's Y position (push-down behavior).
4. Passes `column`, `expanded`, `onToggle`, and computed `adjustedY` to each ParagraphBlock/GhostBlock.

New ParagraphTree.tsx (~120 lines):

```tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Layer, LAYER_METADATA } from '@/lib/layer-metadata';
import { TREE_POSITIONS } from '@/components/god-view/GodViewTree';
import { binSectionsByLayer, type ArborealSection } from '@/lib/arboreal/bin-sections';
import { LAYER_VISUAL } from '@/lib/arboreal/bin-sections';
import ParagraphBlock from './ParagraphBlock';
import GhostBlock from './GhostBlock';

type ColumnSide = 'left' | 'center' | 'right';

const LAYER_COLUMN: Record<number, ColumnSide> = {
  [Layer.ENCODER]: 'left',
  [Layer.DISCRIMINATOR]: 'left',
  [Layer.CLASSIFIER]: 'left',
  [Layer.META_CORE]: 'center',
  [Layer.SYNTHESIS]: 'center',
  [Layer.ATTENTION]: 'center',
  [Layer.EXECUTOR]: 'center',
  [Layer.EMBEDDING]: 'center',
  [Layer.REASONING]: 'right',
  [Layer.EXPANSION]: 'right',
  [Layer.GENERATIVE]: 'right',
};

```tsx
// Layers sorted by Y position per column — used for push-down calculation
const COLUMN_ORDER: Record<ColumnSide, Layer[]> = {
  left: [Layer.ENCODER, Layer.DISCRIMINATOR, Layer.CLASSIFIER],
  center: [Layer.META_CORE, Layer.SYNTHESIS, Layer.ATTENTION, Layer.EXECUTOR, Layer.EMBEDDING],
  right: [Layer.REASONING, Layer.EXPANSION, Layer.GENERATIVE],
};

// Estimated expanded block height (used for push-down calculation)
const EXPANDED_OVERFLOW = 200; // px extra beyond collapsed height

interface ParagraphTreeProps {
  sections: Array<{ title: string | null; body: string }>;
}

const SCALE = 1.2;
const PADDING = 40;

export default function ParagraphTree({ sections }: ParagraphTreeProps) {
  const bins = useMemo(() => binSectionsByLayer(sections), [sections]);
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set());

  const toggleLayer = useCallback((layer: number) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

```
```tsx
  // Compute Y-offsets: for each layer, sum up overflow from expanded layers ABOVE it in same column
  const yOffsets = useMemo(() => {
    const offsets: Record<number, number> = {};
    for (const [col, layers] of Object.entries(COLUMN_ORDER)) {
      let cumulativeOffset = 0;
      for (const layer of layers as Layer[]) {
        offsets[layer] = cumulativeOffset;
        if (expandedLayers.has(layer)) {
          cumulativeOffset += EXPANDED_OVERFLOW;
        }
      }
    }
    return offsets;
  }, [expandedLayers]);

  const allLayers = Object.values(Layer).filter((v) => typeof v === 'number') as Layer[];
  const maxBaseY = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.y ?? 0));
  const maxOffset = Math.max(...Object.values(yOffsets), 0);
  const containerHeight = (maxBaseY * SCALE) + maxOffset + PADDING * 2 + 120;
  const maxX = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.x ?? 0));
  const containerWidth = maxX * SCALE + PADDING * 2;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: Math.min(containerWidth, 900),
        minHeight: containerHeight,
        transition: 'min-height 200ms ease-out',
      }}
    >
```
```tsx
      {allLayers.map((layer) => {
        const pos = TREE_POSITIONS[layer];
        if (!pos) return null;
        const baseX = pos.x * SCALE + PADDING;
        const baseY = pos.y * SCALE + PADDING + (yOffsets[layer] ?? 0);
        const column = LAYER_COLUMN[layer] ?? 'center';
        const meta = LAYER_METADATA[layer];
        const visual = LAYER_VISUAL[layer];
        const layerSections = bins.get(layer) ?? [];
        const isExpanded = expandedLayers.has(layer);

        if (layerSections.length > 0) {
          return (
            <ParagraphBlock
              key={`block-${layer}`}
              sections={layerSections}
              layerName={meta.name}
              x={baseX}
              y={baseY}
              column={column}
              expanded={isExpanded}
              onToggle={() => toggleLayer(layer)}
            />
          );
        }
        return (
          <GhostBlock
            key={`ghost-${layer}`}
            layerName={meta.name}
            sigil={visual?.sigil ?? '○'}
            color={visual?.color ?? '#71717a'}
            x={baseX}
            y={baseY}
          />
        );
      })}
    </div>
  );
}
```

NOTE: If LAYER_VISUAL is not exported from bin-sections.ts, export it. Check with:
  grep -n "LAYER_VISUAL" packages/web/lib/arboreal/bin-sections.ts
If it exists but is not exported, add `export` keyword.


══════ STEP 3 — Update ParagraphBlock to accept column + external expand state ══════

EDIT: packages/web/components/arboreal/ParagraphBlock.tsx

Major changes:
1. Remove internal `useState` for expanded — it's now controlled from parent via `expanded` + `onToggle` props
2. Accept `column: 'left' | 'center' | 'right'` prop
3. Collapsed width: 150px (was 180). Expanded width: 280px (was 340).
4. LEFT column: expanded block's RIGHT edge stays at x + 75 (half of collapsed width), grows leftward. So left = x - 280 + 75 = x - 205.
5. RIGHT column: expanded block's LEFT edge stays at x - 75, grows rightward. So left = x - 75, width = 280.
6. CENTER column: expands centered. left = x - 140.
7. All position changes use CSS transition: 200ms ease-out.

Updated ParagraphBlock.tsx (~115 lines):

```tsx
'use client';

import type { ArborealSection } from '@/lib/arboreal/bin-sections';

interface ParagraphBlockProps {
  sections: ArborealSection[];
  layerName: string;
  x: number;
  y: number;
  column: 'left' | 'center' | 'right';
  expanded: boolean;
  onToggle: () => void;
}

const COLLAPSED_W = 150;
const EXPANDED_W = 280;

```tsx
export default function ParagraphBlock({
  sections, layerName, x, y, column, expanded, onToggle,
}: ParagraphBlockProps) {
  if (sections.length === 0) return null;

  const primary = sections[0];
  const additionalCount = sections.length - 1;
  const collapsedPreview = primary.body
    .split(/\n+/)
    .slice(0, 3)
    .join(' ')
    .slice(0, 140);

  const w = expanded ? EXPANDED_W : COLLAPSED_W;

  // Compute left position based on column + expand direction
  let left: number;
  if (!expanded) {
    left = x - COLLAPSED_W / 2;
  } else if (column === 'left') {
    // Anchor right edge at where collapsed right edge was
    left = x + COLLAPSED_W / 2 - EXPANDED_W;
  } else if (column === 'right') {
    // Anchor left edge at where collapsed left edge was
    left = x - COLLAPSED_W / 2;
  } else {
    // Center: expand equally both sides
    left = x - EXPANDED_W / 2;
  }
```
```tsx
  return (
    <div
      className="absolute rounded-md border cursor-pointer"
      style={{
        left,
        top: y - 36,
        width: w,
        minHeight: expanded ? 'auto' : 72,
        maxHeight: expanded ? 500 : 90,
        overflowY: expanded ? 'auto' : 'hidden',
        backgroundColor: `${primary.color}14`,
        borderColor: expanded ? `${primary.color}88` : `${primary.color}55`,
        borderWidth: expanded ? 2 : 1,
        zIndex: expanded ? 20 : 1,
        boxShadow: expanded ? `0 4px 20px ${primary.color}22` : 'none',
        transition: 'left 200ms ease-out, width 200ms ease-out, top 200ms ease-out, min-height 200ms ease-out, border-color 150ms, box-shadow 150ms',
      }}
      onClick={onToggle}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-2 py-1 border-b rounded-t-md"
        style={{
          backgroundColor: `${primary.color}26`,
          borderColor: `${primary.color}33`,
          color: primary.color,
        }}
      >
```
```tsx
        <span className="text-[10px] font-mono tracking-wider flex items-center gap-1">
          <span className="text-[11px]">{primary.sigil}</span>
          <span className="uppercase">{layerName}</span>
        </span>
        <div className="flex items-center gap-2">
          {additionalCount > 0 && (
            <span className="text-[9px] font-mono opacity-70">+{additionalCount}</span>
          )}
          <span className="text-[10px] font-mono opacity-50">
            {expanded ? '▴' : '▾'}
          </span>
        </div>
      </div>

      {/* Title */}
      {primary.title && (
        <div
          className={`px-2 pt-1 text-[10px] font-medium leading-tight ${expanded ? '' : 'line-clamp-1'}`}
          style={{ color: primary.color }}
        >
          {primary.title}
        </div>
      )}

      {/* Body */}
      {!expanded ? (
        <div className="px-2 py-1 text-[9px] leading-snug text-relic-slate dark:text-relic-ghost line-clamp-3">
          {collapsedPreview}
        </div>
      ) : (
```
```tsx
        <div className="px-3 py-2 space-y-3" onClick={(e) => e.stopPropagation()}>
          {sections.map((section, idx) => (
            <div key={idx}>
              {idx > 0 && section.title && (
                <div
                  className="text-[10px] font-medium mt-2 pt-2 border-t"
                  style={{ color: section.color, borderColor: `${section.color}33` }}
                >
                  {section.sigil} {section.title}
                </div>
              )}
              <div className="text-[10px] leading-relaxed text-relic-slate dark:text-relic-ghost whitespace-pre-line">
                {section.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

══════ STEP 4 — Update GhostBlock sizing ══════

EDIT: packages/web/components/arboreal/GhostBlock.tsx

The ghost blocks should also be smaller to match the compact scale:
- Width: 140→120
- Height: 48→40
- left: x - 60 (was x - 70)

Also add transition on `top` for when neighbors push ghosts down:
  style={{ ... transition: 'top 200ms ease-out' }}


══════ GATES ══════

1. TypeCheck: npx tsc --noEmit
   Expected: exit 0. Watch for type errors on the new props (column, expanded, onToggle).

2. Vitest: npm run predev && npx vitest run --reporter=dot
   Expected: 63/63 passing.

3. Dev restart:
   lsof -ti:3000 | xargs kill -9 || true; sleep 3
   cd packages/web && rm -rf .next .turbo
   npm run predev
   nohup bash -c 'set -a && source .env.local && set +a && SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000' > /tmp/akhai-dev.log 2>&1 &
   sleep 14
   curl -sI http://localhost:3000 | head -1
   Expected: 200

4. File sizes:
   wc -l components/arboreal/ParagraphTree.tsx components/arboreal/ParagraphBlock.tsx components/arboreal/GhostBlock.tsx
   Expected: ParagraphTree ~100-130, ParagraphBlock ~100-120, GhostBlock ~30. All ≤ 150.

5. Dev log: tail -20 /tmp/akhai-dev.log | grep -iE 'error' | head
   Expected: empty.

══════ COMMIT ══════

  git add packages/web/components/arboreal/ParagraphTree.tsx \
          packages/web/components/arboreal/ParagraphBlock.tsx \
          packages/web/components/arboreal/GhostBlock.tsx \
          packages/web/lib/arboreal/bin-sections.ts

  git commit -m "feat(arboreal): compact tree (scale 1.2) + live displacement on expand

Tree is now 40% more compact (SCALE 1.8 → 1.2, blocks 180→150 / 340→280).

Live movable environment:
- Left-column blocks (Encoder, Discriminator, Classifier) expand LEFTWARD
  — right edge stays anchored, width grows left
- Right-column blocks (Reasoning, Expansion, Generative) expand RIGHTWARD
  — left edge stays anchored, width grows right
- Center-column blocks expand centered from their position
- When an expanded block overflows vertically, all blocks BELOW it in
  the same column push down by 200px (accordion-style)
- Container height grows dynamically to accommodate displaced blocks
- All position/size changes animate via CSS transition 200ms ease-out

Expand state lifted from ParagraphBlock to ParagraphTree parent so the
displacement calculation has access to all expanded layers at once."

══════ REPORT BACK ══════

- Commit hash
- tsc exit code
- vitest X/Y passing
- File sizes for 3 arboreal components
- Browser check for user:
  1. Tree is visually more compact (shorter, narrower)
  2. Click a RIGHT-side block (e.g. Expansion) → grows rightward, left edge stays
  3. Click a LEFT-side block (e.g. Classifier) → grows leftward, right edge stays
  4. Click a block with content below it in same column → neighbor pushes DOWN smoothly
  5. Collapse the block → neighbor slides back up
  6. All transitions are smooth 200ms animations

No push, no deploy, local only. Stop at commit 4. Do NOT start commit 5.
