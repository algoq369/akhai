# AkhAI — page.tsx Split Refactor

## Current State
- `app/page.tsx` is 3697 lines — too large, fragile, slow to edit
- Contains: state, handlers, effects, and ALL JSX for the main page

## Split Strategy
Extract JSX sections into components. Pass state via props.
Do NOT change behavior — pure extraction, no logic changes.

## Components to Extract (in order of impact)

### 1. `components/home/MessageArea.tsx` (~710 lines)
**Lines 2310-3020** — The message rendering loop with all view modes
- Layer view, insight mindmap, text view, mindmap view
- Guard warnings, condensed alerts
- Depth annotations, metadata stream
- Intelligence fusion badge, layers mini
- Gnostic sovereignty footer

### 2. `components/home/InputSection.tsx` (~200 lines)
**Lines 3028-3220** — Input box and controls
- Text input with file attachment
- Methodology dots selector
- Instinct mode console
- Console inline
- Submit button
- Horizontal dashboard (when not in conversation)

### 3. `components/home/LogoSection.tsx` (~190 lines)
**Lines 2112-2300** — Diamond logo + methodology explorer
- Diamond SVG with hover/click
- Inline methodology explorer panel
- Methodology details (METHODOLOGY_DETAILS array)

### 4. `components/home/FooterBar.tsx` (~65 lines)
**Lines 3357-3420** — Bottom bar
- "self aware" text
- Finance banner inline
- Instinct toggle, AI config toggle
- Navigation menu

### 5. `components/home/HeaderBar.tsx` (~70 lines)
**Lines 2013-2080** — Top bar (expanded mode)
- Canvas mode toggle
- Quick nav buttons

### 6. `components/home/Overlays.tsx` (~280 lines)
**Lines 3420-3700** — All modals and floating elements
- MindMap modal
- Auth modal
- Topic suggestions toast
- Side mini chat
- Methodology change prompt
- News notification
- Tree configuration modal

## Execution Rules
1. Create `components/home/` directory
2. Extract ONE component at a time
3. After each extraction, verify build: `AKHAI_FREE_MODE=true npx next build`
4. Commit after each successful extraction
5. Props interface at top of each new component
6. Keep ALL state in page.tsx — components receive via props
7. Move METHODOLOGY_DETAILS constant to a shared file

## After Split Target
- page.tsx: ~1500 lines (state + handlers + layout skeleton)
- 6 new components totaling ~1500 lines
- Same behavior, better maintainability
