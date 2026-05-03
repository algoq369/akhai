# Arboreal — Commit 1 CLI Prompt

Paste the block below into `cc` from `~/akhai`.

---

Arboreal view mode — scaffold commit 1. Sequential, STOP on any gate failure.

SCOPE GUARD: No DB changes, no API routes, no prompt changes, no paragraph tree logic, no block chat. This commit is PURELY ADDITIVE scaffolding. Only: extend ViewMode type, add header button, create empty ArborealView shell, wire it into app/page.tsx.

CONTEXT (before editing):
- ViewMode type lives at packages/web/components/sections/ChatHeader.tsx:3 — currently 'classic' | 'mini-canvas' | 'canvas'
- Local viewMode state lives at packages/web/hooks/useHomePageState.ts:108 with same 3-value union
- The toggle UI is 3 buttons in ChatHeader.tsx lines 32-49
- Classic view renders ChatMessages at app/page.tsx:241
- Existing tree to reuse later: components/god-view/GodViewTree.tsx
- Existing response splitter to reuse later: components/ResponseRenderer.tsx:198 splitIntoSections()

══════ STEP 1 — Extend ViewMode type ══════

FILE: packages/web/components/sections/ChatHeader.tsx

Line 3 — change:
  export type ViewMode = 'classic' | 'mini-canvas' | 'canvas';
To:
  export type ViewMode = 'classic' | 'mini-canvas' | 'canvas' | 'arboreal';

══════ STEP 2 — Extend local state type in hook ══════

FILE: packages/web/hooks/useHomePageState.ts

Line 108 — change:
  const [viewMode, setViewMode] = useState<'classic' | 'mini-canvas' | 'canvas'>('classic');
To:
  const [viewMode, setViewMode] = useState<'classic' | 'mini-canvas' | 'canvas' | 'arboreal'>('classic');

══════ STEP 3 — Add header toggle button ══════

FILE: packages/web/components/sections/ChatHeader.tsx

Find the '◇ canvas' button block (lines 44-49). After its closing </button> tag and BEFORE the next element (methodology span at line 50), insert:

            <button
              onClick={() => onSetViewMode('arboreal')}
              className={`text-[9px] uppercase tracking-wider transition-colors ${viewMode === 'arboreal' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-relic-silver/60 hover:text-relic-slate dark:hover:text-relic-ghost'}`}
            >
              ◇ arboreal
            </button>

Match the exact indentation of surrounding buttons. Emerald = tree/growth metaphor, distinct from amber (mini-canvas) and purple (canvas).

══════ STEP 4 — Create ArborealView shell ══════

CREATE new directory: packages/web/components/arboreal/

CREATE new file: packages/web/components/arboreal/ArborealView.tsx (~80 lines)

File contents:

```tsx
'use client';

/**
 * ARBOREAL VIEW
 *
 * Tree-layout view of the response. Same text as classic view, re-dispatched
 * visually into colored paragraph blocks positioned at Sefirot tree coordinates.
 *
 * Stack (top to bottom):
 *   1. Query metadata bar          (shared with classic)
 *   2. AI layers + mindmap panels  (shared with classic)
 *   3. Neural tree (compact)       (embedded GodViewTree)
 *   4. Paragraph tree              (NEW — commits 2-3)
 *   5. 5-line synthesis footer     (NEW — commit 6)
 *   6. Per-block chat              (NEW — commit 5)
 *
 * This commit is the empty shell only. Subsequent commits fill each slot.
 *
 * @module ArborealView
 */

import type { Message } from '@/lib/chat-store';

export interface ArborealViewProps {
  messages: Message[];
  isLoading: boolean;
}
```

```tsx
export default function ArborealView({ messages, isLoading }: ArborealViewProps) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');

  if (!lastAssistant && !isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] text-relic-silver/40 font-mono">
          ◇ arboreal view · awaiting response
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 space-y-6">
      {lastUser && (
        <div className="border-b border-relic-mist/20 dark:border-relic-slate/20 pb-3">
          <p className="text-sm text-relic-slate dark:text-relic-ghost font-mono">
            {lastUser.content}
          </p>
        </div>
      )}
      <div className="h-12 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-relic-mist/20 rounded">
        ai layers · mindmap · council — panels slot
      </div>
      <div className="h-40 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-relic-mist/20 rounded">
        neural tree (compact GodViewTree) — slot
      </div>
      <div className="h-96 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-emerald-500/30 rounded">
        ◇ paragraph tree — NEW · sefirot-positioned colored blocks · commit 2
      </div>
      <div className="h-24 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-relic-mist/20 rounded">
        5-line synthesis footer — commit 6
      </div>
    </div>
  );
}
```

══════ STEP 5 — Wire ArborealView into app/page.tsx ══════

FILE: packages/web/app/page.tsx

5A) Add import at the top next to the other view-mode imports. Find:
  import MiniCanvasView from '...';
Right after that line, add:
  import ArborealView from '@/components/arboreal/ArborealView';

5B) Find the 'mini-canvas' conditional block (around lines 226-238, starts with `{s.isExpanded && s.viewMode === 'mini-canvas' && (`). Immediately AFTER its closing `)}` and BEFORE the next block (`{/* Messages Area — only in Classic mode */}` comment at line 240), insert:

        {/* Arboreal — tree-layout view */}
        {s.isExpanded && s.viewMode === 'arboreal' && (
          <ArborealView
            messages={s.messages}
            isLoading={s.isLoading}
          />
        )}

Indentation must match surrounding conditional blocks.

5C) If any existing code uses viewMode in a type-narrowing way like `viewMode === 'canvas' ? ... : 'classic'`, leave it alone — 'arboreal' falls through to defaults. Do NOT proactively refactor.

══════ GATES ══════

From /Users/sheirraza/akhai/packages/web:

1. TypeCheck:
   npx tsc --noEmit
   Expected: exit 0. If ViewMode exhaustiveness errors appear in switch statements, add an `arboreal` case returning null or fall through to 'classic'. Do NOT use ts-ignore.

2. Vitest:
   npm run predev
   npx vitest run --reporter=dot
   Expected: 63/63 passing.

3. Dev server restart + smoke:
   lsof -ti:3000 | xargs kill -9 || true
   sleep 3
   rm -rf .next .turbo
   nohup bash -c 'set -a && source .env.local && set +a && SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000' > /tmp/akhai-dev.log 2>&1 &
   sleep 12
   curl -sI http://localhost:3000 | head -1
   Expected: HTTP/1.1 200 OK

4. Browser manual:
   Open http://localhost:3000. After an existing response loads, look for 4 toggle buttons in the header:
     ☰ classic   ◈ mini canvas   ◇ canvas   ◇ arboreal (new, emerald)
   Click ◇ arboreal. Expected: 5 dashed placeholder slots render. No console errors.
   Click ☰ classic to return. Expected: classic view returns intact.

5. File sizes:
   wc -l components/arboreal/ArborealView.tsx
   Expected: ~80 lines, must be ≤ 120.

══════ COMMIT ══════

After all gates pass:

  git add packages/web/components/sections/ChatHeader.tsx \
          packages/web/hooks/useHomePageState.ts \
          packages/web/app/page.tsx \
          packages/web/components/arboreal/ArborealView.tsx

  git commit -m "feat(arboreal): scaffold view mode toggle + empty ArborealView shell

Adds 'arboreal' as a 4th view mode alongside classic / mini-canvas / canvas.
This commit is purely additive scaffolding:
- ViewMode type extended in ChatHeader.tsx:3 and useHomePageState.ts:108
- Emerald-colored toggle button added to the header strip
- New components/arboreal/ArborealView.tsx shell with 5 placeholder slots
- Wired into app/page.tsx alongside the existing mini-canvas conditional

Zero behavior changes to classic / mini-canvas / canvas modes.
Arboreal mode currently renders placeholder boxes only.

Next: commit 2 wires the real paragraph tree via GodViewTree positions +
ResponseRenderer splitIntoSections + detectLayerFromTitle binning."

══════ REPORT BACK ══════

- Commit hash
- Final tsc exit code
- Final vitest result (X/Y passing)
- lsof -ti:3000 PID count (should be 1)
- Any deviations from spec
- Confirmation I should verify in browser: 4 toggle buttons visible, clicking arboreal shows 5 placeholder boxes

No push, no deploy, local only. Stop at commit 1. Do NOT start commit 2.
