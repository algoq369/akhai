# Arboreal — Commit 3 CLI Prompt

Paste into `cc` from `~/akhai`.

---

Arboreal commit 3 — expand/collapse paragraph blocks + inline sigils via DepthText. STOP on any gate failure.

SCOPE GUARD: No DB, no API routes, no prompt changes, no per-block chat yet. This commit only adds expand/collapse toggle to ParagraphBlock and renders body text through DepthText so inline sigils open depth annotations on click.

CONTEXT:
- ParagraphBlock.tsx (70 lines) currently renders collapsed-only with a console.log onClick
- DepthText component at components/DepthAnnotation.tsx:95 renders text with clickable inline sigils
- DepthText accepts: text (string), annotations (AnnotationType[]), config (optional), onExpand (optional)
- Annotations for a response are computed by depth-extract API and stored alongside messages
- For this commit we render DepthText WITHOUT pre-computed annotations first (sigil rendering from text markers like ⊕ ⊘ △ etc. that already exist in the response body) — annotation hydration can come later
- ArborealView has access to messages[] which contain the response content


══════ STEP 1 — Add expand/collapse state to ParagraphBlock ══════

EDIT: packages/web/components/arboreal/ParagraphBlock.tsx

Replace the entire component with an expanded version that:
1. Adds `const [expanded, setExpanded] = useState(false)` state
2. onClick toggles expanded (replaces console.log)
3. When collapsed: shows sigil + layer name + title + first 3 lines + ▾ chevron (same as now)
4. When expanded:
   a. Block width grows from 180 → 320 (or wider if content demands)
   b. Full body text renders (all lines, not just 3)
   c. If multiple sections at same layer (sections.length > 1), render ALL of them stacked with small dividers
   d. Chevron becomes ▴ (pointing up)
   e. z-index raises to 20 so expanded block floats above neighbors
   f. Block gets a subtle stronger border

Import useState from react at top.

The body text should render as plain text for now — NOT through DepthText yet. We wire DepthText in step 2.

Updated component (~120 lines):

```tsx
'use client';

import { useState } from 'react';
import type { ArborealSection } from '@/lib/arboreal/bin-sections';

interface ParagraphBlockProps {
  sections: ArborealSection[];
  layerName: string;
  x: number;
  y: number;
}

export default function ParagraphBlock({ sections, layerName, x, y }: ParagraphBlockProps) {
  const [expanded, setExpanded] = useState(false);
  if (sections.length === 0) return null;

  const primary = sections[0];
  const additionalCount = sections.length - 1;
  const collapsedPreview = primary.body
    .split(/\n+/)
    .slice(0, 3)
    .join(' ')
    .slice(0, 160);

  const w = expanded ? 340 : 180;

  return (
    <div
      className="absolute rounded-md border transition-all duration-200 cursor-pointer"
      style={{
        left: x - w / 2,
        top: y - 40,
        width: w,
        minHeight: expanded ? 'auto' : 80,
        maxHeight: expanded ? 600 : 100,
        overflowY: expanded ? 'auto' : 'hidden',
        backgroundColor: `${primary.color}14`,
        borderColor: expanded ? `${primary.color}88` : `${primary.color}55`,
        borderWidth: expanded ? 2 : 1,
        zIndex: expanded ? 20 : 1,
        boxShadow: expanded ? `0 4px 20px ${primary.color}22` : 'none',
      }}
      onClick={() => setExpanded(!expanded)}
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

      {/* Body — collapsed or expanded */}
      {!expanded ? (
        <div className="px-2 py-1 text-[9px] leading-snug text-relic-slate dark:text-relic-ghost line-clamp-3">
          {collapsedPreview}
        </div>
      ) : (
        <div className="px-3 py-2 space-y-3">
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
              <div
                className="text-[10px] leading-relaxed text-relic-slate dark:text-relic-ghost whitespace-pre-line"
                onClick={(e) => e.stopPropagation()}
              >
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

Note the onClick stopPropagation on the body text div — this prevents text selection from toggling the block closed. The outer div's onClick handles expand/collapse via the header area effectively; clicking inside the body when expanded won't close it.


══════ STEP 2 — Wire DepthText for inline sigil annotations ══════

The response body already contains inline sigils like ArduPilot⊕, ROS 2⊕, MAVLink▽ etc. The existing DepthText component renders these as clickable colored pills that open depth annotation popovers.

However, DepthText requires pre-computed `annotations: AnnotationType[]` to work. Without annotations, it renders plain text (no sigils highlighted).

For this commit, we take a SIMPLE approach: render the body text as-is (the sigil unicode characters are already visible in the text). The DepthText integration with full annotation hydration is deferred to when we wire the depth-extract API into arboreal view (a follow-up enhancement).

What we DO now: ensure the response text preserves its inline sigil characters (◇ △ ⊕ ○ ⬢ ▽ □ ⊘ ⊙ ✦) so they're visible in the expanded blocks. The whitespace-pre-line CSS class already handles this.

NO CHANGES needed for Step 2 in this commit — the sigil characters render natively. Mark this as "deferred to depth-annotation integration sprint" in the commit message.

══════ STEP 3 — Verify collapsed blocks still render correctly ══════

The width change from 180→340 on expand means blocks at adjacent Sefirot positions might overlap when expanded. This is ACCEPTABLE — expanded blocks have z-index:20 and float above. Collapsed blocks return to 180px and z-index:1.

Verify: grep the TREE_POSITIONS from GodViewTree to check spacing between adjacent nodes:
  grep -A 1 "x:" components/god-view/GodViewTree.tsx | head -25

The closest horizontal neighbors are typically 150+ px apart at 1.8× scale = 270px gap. Collapsed block width is 180px (90px each side of center). Two adjacent collapsed blocks: 270 - 90 - 90 = 90px gap. Fine.

Expanded block at 340px (170px each side): 270 - 170 - 90 = 10px — tight but acceptable. The z-index handles overlap gracefully.

══════ GATES ══════

1. TypeCheck: npx tsc --noEmit
   Expected: exit 0.

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
   wc -l components/arboreal/ParagraphBlock.tsx
   Expected: ~110-130 lines, ≤ 150.

5. Dev log: tail -20 /tmp/akhai-dev.log | grep -iE 'error' | head
   Expected: empty.

══════ COMMIT ══════

  git add packages/web/components/arboreal/ParagraphBlock.tsx

  git commit -m "feat(arboreal): expand/collapse paragraph blocks with full text + sigil preservation

ParagraphBlock now toggles between collapsed (180px, 3-line preview)
and expanded (340px, full body text, scrollable to 600px max-height).

Expanded state features:
- z-index:20 so expanded block floats above neighbors
- Stronger border + subtle box-shadow for visual lift
- stopPropagation on body text prevents accidental collapse
- Multiple sections at same layer render stacked with dividers
- Chevron flips ▾/▴ to indicate state

Inline sigil characters (◇ △ ⊕ ○ ⬢ ▽ □ ⊘ ⊙ ✦) render natively in
the text via whitespace-pre-line. Full DepthText annotation integration
(clickable sigils opening depth popovers) deferred to depth-annotation
sprint — requires wiring depth-extract API output into ArborealView.

No DB, no API, no prompts. Next: commit 4 (DB table for per-block
chat persistence), then commit 5 (scoped chat UI + API route)."

══════ REPORT BACK ══════

- Commit hash
- tsc exit code
- vitest X/Y passing
- ParagraphBlock.tsx line count
- Browser check for the user: click ◇ arboreal, click a colored block → it expands showing full text. Click again → collapses. Multiple blocks can be expanded simultaneously. Expanded block floats above neighbors.

No push, no deploy, local only. Stop at commit 3. Do NOT start commit 4.
