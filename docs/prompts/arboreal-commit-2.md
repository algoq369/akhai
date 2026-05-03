# Arboreal — Commit 2 CLI Prompt

Paste into `cc` from `~/akhai`.

---

Arboreal commit 2 — bin response paragraphs by Sefirot layer and render them as colored blocks at tree positions. Sequential, STOP on any gate failure.

SCOPE GUARD: No DB changes, no API routes, no prompt changes, no block chat yet. This commit only:
- Creates lib/arboreal/bin-sections.ts (pure data transformation, no side effects)
- Creates components/arboreal/ParagraphBlock.tsx (collapsed block view)
- Creates components/arboreal/GhostBlock.tsx (dashed placeholder for empty layers)
- Creates components/arboreal/ParagraphTree.tsx (main tree renderer using TREE_POSITIONS at 2× scale)
- Replaces the emerald-dashed placeholder in ArborealView.tsx with the real <ParagraphTree />

Expand/collapse and inline sigils come in Commit 3. Per-block chat comes in Commit 5.

══════ STEP 0 — Pre-flight audit ══════

From packages/web, verify the pieces we'll reuse:

  grep -n "TREE_POSITIONS" components/god-view/GodViewTree.tsx | head -3
  grep -nE "splitIntoSections|detectLayerFromTitle" components/ResponseRenderer.tsx | head -5
  grep -n "LAYER_METADATA" lib/layer-metadata.ts | head -5

Expected: all 3 exports exist. If ANY fail, STOP and report — the plan depends on these being importable.

══════ STEP 1 — Create bin-sections.ts ══════

CREATE: packages/web/lib/arboreal/bin-sections.ts (~60 lines)

Requirements:
- Export `binSectionsByLayer(sections: Array<{title: string | null, body: string}>): Map<Layer, Section[]>`
- Reuse `detectLayerFromTitle` from components/ResponseRenderer.tsx (may need to export it if currently private)
- If a section has null title → bin it under Layer.EMBEDDING (default fallback)
- If detected layer has no entry yet in the Map, create empty array first
- Preserve original section order within each layer

File skeleton:

```ts
import { Layer } from '@/lib/layer-metadata';
import { detectLayerFromTitle } from '@/components/ResponseRenderer';

export interface ArborealSection {
  title: string | null;
  body: string;
  color: string;
  sigil: string;
  layer: Layer;
  originalIndex: number;
}

const LAYER_NAME_TO_ENUM: Record<string, Layer> = {
  'Meta-Core': Layer.META_CORE,
  'Reasoning': Layer.REASONING,
  'Encoder': Layer.ENCODER,
  'Synthesis': Layer.SYNTHESIS,
  'Expansion': Layer.EXPANSION,
  'Discriminator': Layer.DISCRIMINATOR,
  'Attention': Layer.ATTENTION,
  'Generative': Layer.GENERATIVE,
  'Classifier': Layer.CLASSIFIER,
  'Executor': Layer.EXECUTOR,
  'Embedding': Layer.EMBEDDING,
};

export function binSectionsByLayer(
  sections: Array<{ title: string | null; body: string }>
): Map<Layer, ArborealSection[]> {
  const result = new Map<Layer, ArborealSection[]>();
  sections.forEach((section, idx) => {
    const info = section.title
      ? detectLayerFromTitle(section.title, idx)
      : { layer: 'Embedding', color: '#F59E0B', sigil: '⊘' };
    const enumLayer = LAYER_NAME_TO_ENUM[info.layer] ?? Layer.EMBEDDING;
    const existing = result.get(enumLayer) ?? [];
    existing.push({
      title: section.title,
      body: section.body,
      color: info.color,
      sigil: info.sigil,
      layer: enumLayer,
      originalIndex: idx,
    });
    result.set(enumLayer, existing);
  });
  return result;
}
```

If `detectLayerFromTitle` is not currently exported from ResponseRenderer.tsx, add `export` keyword to it. Do NOT move it into a new file — keep it where it is to minimize diff.

══════ STEP 2 — Create GhostBlock.tsx ══════

CREATE: packages/web/components/arboreal/GhostBlock.tsx (~35 lines)

Dashed-outline placeholder for Sefirot positions that have no paragraph in this response. Small, muted, clearly visible-but-empty.

```tsx
'use client';

interface GhostBlockProps {
  layerName: string;
  sigil: string;
  color: string;
  x: number;
  y: number;
}

export default function GhostBlock({ layerName, sigil, color, x, y }: GhostBlockProps) {
  return (
    <div
      className="absolute flex items-center justify-center rounded-md border border-dashed"
      style={{
        left: x - 70,
        top: y - 24,
        width: 140,
        height: 48,
        borderColor: `${color}33`,
        color: `${color}55`,
      }}
    >
      <span className="text-[9px] font-mono tracking-wider">
        {sigil} {layerName.toLowerCase()}
      </span>
    </div>
  );
}
```

══════ STEP 3 — Create ParagraphBlock.tsx (collapsed state only for this commit) ══════

CREATE: packages/web/components/arboreal/ParagraphBlock.tsx (~90 lines)

Renders a single block at (x, y) showing: sigil, layer name, section title, first 3 lines of body, ▾ chevron. Click handler is present but expansion comes in Commit 3 — for now, clicks log to console only.

```tsx
'use client';

import type { ArborealSection } from '@/lib/arboreal/bin-sections';

interface ParagraphBlockProps {
  sections: ArborealSection[];
  layerName: string;
  x: number;
  y: number;
}

export default function ParagraphBlock({ sections, layerName, x, y }: ParagraphBlockProps) {
  if (sections.length === 0) return null;

  const primary = sections[0];
  const firstThreeLines = primary.body
    .split(/\n+/)
    .slice(0, 3)
    .join(' ')
    .slice(0, 160);
  const additionalCount = sections.length - 1;

  return (
    <div
      className="absolute rounded-md border shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
      style={{
        left: x - 90,
        top: y - 40,
        width: 180,
        minHeight: 80,
        backgroundColor: `${primary.color}14`,
        borderColor: `${primary.color}55`,
      }}
      onClick={() => {
        // Commit 3 will handle expansion.
        console.log('[arboreal] block clicked:', layerName, primary.title);
      }}
    >
      <div
        className="flex items-center justify-between px-2 py-1 border-b rounded-t-md"
        style={{
          backgroundColor: `${primary.color}26`,
          borderColor: `${primary.color}33`,
          color: primary.color,
        }}
      >
        <span className="text-[10px] font-mono tracking-wider flex items-center gap-1">
          <span className="text-[11px]">{primary.sigil}</span>
          <span className="uppercase">{layerName}</span>
        </span>
        {additionalCount > 0 && (
          <span className="text-[9px] font-mono opacity-70">+{additionalCount}</span>
        )}
      </div>
      {primary.title && (
        <div
          className="px-2 pt-1 text-[10px] font-medium leading-tight line-clamp-1"
          style={{ color: primary.color }}
        >
          {primary.title}
        </div>
      )}
      <div className="px-2 py-1 text-[9px] leading-snug text-relic-slate dark:text-relic-ghost line-clamp-3">
        {firstThreeLines}
      </div>
      <div
        className="absolute bottom-1 right-2 text-[10px] font-mono opacity-50"
        style={{ color: primary.color }}
      >
        ▾
      </div>
    </div>
  );
}
```

══════ STEP 4 — Create ParagraphTree.tsx ══════

CREATE: packages/web/components/arboreal/ParagraphTree.tsx (~140 lines)

Renders the full tree. Uses TREE_POSITIONS from GodViewTree at 2× scale (source positions are ~500px wide, we render at ~1000px wide so blocks fit).

Requirements:
- Import TREE_POSITIONS from '@/components/god-view/GodViewTree' (verify at STEP 0 that it's exported; if not, export it)
- Import LAYER_METADATA + Layer from '@/lib/layer-metadata'
- For each of the 11 layers, check if bin has sections → render ParagraphBlock, else render GhostBlock
- Container is position:relative with minHeight based on max y coord × 2

Rough layout math:
- Original TREE_POSITIONS has Meta-Core at (250, 80), Embedding at (250, 605). So height ≈ 605 + padding.
- At 2× scale: total height ≈ 1280px. Width ≈ 1000px.
- Each block centered on its scaled coord.

```tsx
'use client';

import { useMemo } from 'react';
import { Layer, LAYER_METADATA } from '@/lib/layer-metadata';
import { TREE_POSITIONS } from '@/components/god-view/GodViewTree';
import { binSectionsByLayer, type ArborealSection } from '@/lib/arboreal/bin-sections';
import ParagraphBlock from './ParagraphBlock';
import GhostBlock from './GhostBlock';

interface ParagraphTreeProps {
  sections: Array<{ title: string | null; body: string }>;
}

const SCALE = 1.8;
const PADDING = 40;

export default function ParagraphTree({ sections }: ParagraphTreeProps) {
  const bins = useMemo(() => binSectionsByLayer(sections), [sections]);

  const allLayers = Object.values(Layer).filter((v) => typeof v === 'number') as Layer[];
  const maxY = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.y ?? 0));
  const maxX = Math.max(...allLayers.map((l) => TREE_POSITIONS[l]?.x ?? 0));
  const containerHeight = maxY * SCALE + PADDING * 2;
  const containerWidth = maxX * SCALE + PADDING * 2;

  return (
    <div
      className="relative mx-auto"
      style={{
        width: Math.min(containerWidth, 1100),
        minHeight: containerHeight,
      }}
    >
      {allLayers.map((layer) => {
        const pos = TREE_POSITIONS[layer];
        if (!pos) return null;
        const x = pos.x * SCALE + PADDING;
        const y = pos.y * SCALE + PADDING;
        const meta = LAYER_METADATA[layer];
        const layerSections = bins.get(layer) ?? [];
        if (layerSections.length > 0) {
          return (
            <ParagraphBlock
              key={`block-${layer}`}
              sections={layerSections}
              layerName={meta.name}
              x={x}
              y={y}
            />
          );
        }
        return (
          <GhostBlock
            key={`ghost-${layer}`}
            layerName={meta.name}
            sigil={meta.sigil ?? '○'}
            color={meta.color ?? '#71717a'}
            x={x}
            y={y}
          />
        );
      })}
    </div>
  );
}
```

IMPORTANT: LAYER_METADATA may not have `sigil` and `color` fields under those exact names. Check lib/layer-metadata.ts structure. If the field names differ (e.g. `symbol` instead of `sigil`), adjust the GhostBlock props accordingly. If LAYER_METADATA has no color field, fall back to the color from the detected section's color when available, or use a muted gray.

══════ STEP 5 — Wire into ArborealView.tsx ══════

EDIT: packages/web/components/arboreal/ArborealView.tsx

5A) Add import at top (after the Message import):
  import ParagraphTree from './ParagraphTree';
  import { splitIntoSections } from '@/components/ResponseRenderer';

If splitIntoSections is not exported from ResponseRenderer.tsx, add `export` keyword to its declaration.

5B) Inside the component, before the return, derive sections from the last assistant message:

  const sections = useMemo(() => {
    if (!lastAssistant?.content) return [];
    return splitIntoSections(lastAssistant.content);
  }, [lastAssistant?.content]);

Add `useMemo` to the React import.

5C) Find the existing paragraph-tree placeholder (the dashed emerald box with text "◇ paragraph tree — NEW · sefirot-positioned colored blocks · commit 2"). Replace the entire div with:

  <div className="py-4">
    {sections.length > 0 ? (
      <ParagraphTree sections={sections} />
    ) : (
      <div className="h-40 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-emerald-500/30 rounded">
        no sections detected in response
      </div>
    )}
  </div>

══════ STEP 6 — Gates ══════

1. TypeCheck: npx tsc --noEmit
   Expected: exit 0. If complaints about missing exports (splitIntoSections, detectLayerFromTitle, TREE_POSITIONS), add `export` where needed. Do NOT use ts-ignore.

2. Vitest: npm run predev && npx vitest run --reporter=dot
   Expected: 63/63 passing.

3. Dev restart:
   lsof -ti:3000 | xargs kill -9 || true
   sleep 3
   rm -rf .next .turbo
   npm run predev
   nohup bash -c 'set -a && source .env.local && set +a && SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000' > /tmp/akhai-dev.log 2>&1 &
   sleep 14
   curl -sI http://localhost:3000 | head -1
   Expected: 200

4. File sizes:
   wc -l components/arboreal/ParagraphTree.tsx components/arboreal/ParagraphBlock.tsx components/arboreal/GhostBlock.tsx lib/arboreal/bin-sections.ts
   Expected: all ≤ 160 lines. Combined ≤ 360.

5. Dev log tail:
   tail -30 /tmp/akhai-dev.log | grep -iE 'error|warn' | head
   Expected: empty.

══════ COMMIT ══════

  git add packages/web/lib/arboreal/bin-sections.ts \
          packages/web/components/arboreal/ParagraphTree.tsx \
          packages/web/components/arboreal/ParagraphBlock.tsx \
          packages/web/components/arboreal/GhostBlock.tsx \
          packages/web/components/arboreal/ArborealView.tsx \
          packages/web/components/ResponseRenderer.tsx

  git commit -m "feat(arboreal): render paragraph blocks at sefirot positions with ghost placeholders

- lib/arboreal/bin-sections.ts: bins response sections by Sefirot layer
  via detectLayerFromTitle (reused from ResponseRenderer)
- components/arboreal/ParagraphBlock.tsx: colored collapsed block with
  sigil, layer name, section title, 3-line body preview, +N badge for
  multiple sections at same layer, ▾ chevron
- components/arboreal/GhostBlock.tsx: dashed outline placeholder for
  Sefirot positions with no matching paragraph in this response
- components/arboreal/ParagraphTree.tsx: tree renderer using
  TREE_POSITIONS from GodViewTree at 1.8x scale, 40px padding
- ArborealView: replaced emerald-dashed placeholder with real tree
- ResponseRenderer: exported splitIntoSections and detectLayerFromTitle
  (were private, now reused by arboreal)

No DB, no API, no prompts. Blocks click handler logs to console only —
expand/collapse comes in commit 3. Inline sigil depth annotations come
in commit 3. Per-block chat comes in commit 5."

══════ REPORT BACK ══════

- Commit hash
- tsc exit code
- vitest X/Y passing
- File sizes for the 4 new files
- lsof -ti:3000 PID count (should be 1)
- Any deviations (e.g. LAYER_METADATA field names didn't match — report and adjust)
- Browser verification for the user: open localhost:3000 in arboreal mode. Look for 11 total elements at Sefirot positions — colored blocks where the response has paragraphs for that layer, dashed ghosts where it doesn't. Click a colored block → should see a console log (no expansion yet — that's commit 3).

No push, no deploy, local only. Stop at commit 2.
