# AkhAI CLI Prompt — Day 45-49 Enhancements
# Execute sequentially with Claude Code CLI

## CONTEXT
- Repo: /Users/sheirraza/akhai
- App: packages/web (Next.js 14, TypeScript)
- Server: localhost:3000
- Latest commits: d74ff98 (nav fix), ffee070 (mindmap fix), 1e67c19 (search + header nav)
- Branch: main

---

## PHASE A: Depth Annotations Activation (2-3 hours)

### A1: Verify depthConfig default
Check `hooks/useDepthAnnotations.ts` — is `enabled` true or false by default?
If false, change default to `true` so annotations work out of the box.

### A2: Verify DepthText renders sigils
1. Open browser, submit query: "Explain quantum computing in simple terms"
2. Check if response shows inline sigils (ᶠ ᵐ ᶜ ᵈ ˢ) beneath key terms
3. If NOT rendering, debug the chain:
   - `useDepthAnnotations().processText(content)` → returns annotations?
   - `messageAnnotations[message.id]` → populated?
   - `DepthText` component at page.tsx:2120 → receives annotations?
   - Conditional at page.tsx:2118: `depthConfig.enabled && messageAnnotations[...]` → evaluates true?

### A3: Add depth toggle to response area
In page.tsx, add a small toggle near the response area:
```tsx
<button 
  onClick={() => updateDepthConfig({ enabled: !depthConfig.enabled })}
  className="text-[8px] font-mono text-relic-silver/50 hover:text-relic-slate"
>
  {depthConfig.enabled ? 'ᶠ depth on' : 'ᶠ depth off'}
</button>
```
Place it near the response header or inline with guard status.

### A4: Add density slider
The hook likely supports density levels (minimal/standard/maximum).
Add 3-option toggle: minimal | standard | maximum
Wire to `updateDepthConfig({ density: 'standard' })` or similar.

### VERIFY A:
- Submit 3 different queries
- Confirm sigils appear on each response
- Toggle depth off → sigils disappear
- Toggle back on → sigils reappear
- Commit: "feat(depth): Activate annotations, add toggle + density control — Day 45"

---

## PHASE B: Live Refinement Re-Query (2-3 hours)

### B1: Add response action buttons
In the message rendering section (around page.tsx:2120-2140), after the AI response content, add:

```tsx
{message.role === 'assistant' && !isLoading && (
  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-relic-mist/20 dark:border-relic-slate/20">
    {(['refine', 'enhance', 'correct', 'expand'] as const).map(action => (
      <button
        key={action}
        onClick={() => handleRefinement(action, message.content)}
        className="text-[8px] font-mono text-relic-silver/50 hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
      >
        {action}
      </button>
    ))}
  </div>
)}
```

### B2: Create handleRefinement function
In page.tsx, add:
```tsx
const handleRefinement = useCallback((type: string, originalContent: string) => {
  const { addRefinement } = useSideCanalStore.getState()
  
  // Add typed refinement to store
  const refinementText = type === 'refine' ? 'Please refine and improve this response'
    : type === 'enhance' ? 'Please enhance with more depth and detail'
    : type === 'correct' ? 'Please verify accuracy and correct any issues'
    : 'Please expand on the key points'
  
  addRefinement(refinementText)
  
  // Re-submit the original query (refinements auto-included via pipeline)
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()
  if (lastUserMessage) {
    setQuery(lastUserMessage.content)
    // Trigger submit
    setTimeout(() => handleSubmit(new Event('submit') as any), 100)
  }
}, [messages])
```

### B3: Show refinement badge
When response has been refined, show badge:
```tsx
{message.refinementCount && message.refinementCount > 0 && (
  <span className="text-[7px] font-mono text-indigo-400 ml-2">
    refined ×{message.refinementCount}
  </span>
)}
```

### VERIFY B:
- Submit query, get response
- Click "refine" → new query auto-submits with refinement context
- Response shows "refined ×1" badge
- Click "enhance" → "refined ×2"
- Commit: "feat(refinement): Response action buttons with re-query mechanism — Day 46"

---

## PHASE C: Canvas Data Wiring (3-4 hours)

### C1: Audit CanvasWorkspace.tsx
Read `components/canvas/CanvasWorkspace.tsx` (506 lines).
Identify:
- What props does it accept?
- Does it use React Flow?
- Does it fetch its own data or expect props?
- What node types does it support?

### C2: Wire query data to canvas
In page.tsx where CanvasWorkspace renders (line ~1772):
- Pass `messages` as props (query-response pairs become cards)
- Pass Side Canal topics as additional nodes
- Ensure new queries auto-add cards

### C3: Canvas ↔ chat navigation
- Click canvas card → scroll to that message in chat view
- Click "focus" on canvas node → zoom to that node
- Toggle back to Classic view preserves scroll position

### VERIFY C:
- Toggle to Canvas mode
- See query cards arranged as nodes
- Submit new query → card auto-appears
- Click card → switches to Classic, scrolled to message
- Commit: "feat(canvas): Wire live query data + bidirectional nav — Day 47"

---

## PHASE D: Grimoire Wiring (3-4 hours)

### D1: Test grimoire CRUD
- Navigate to /grimoires
- Try creating a new grimoire project
- Add objectives and deadline
- Verify data persists on page refresh

### D2: Add grimoire to navigation
In `components/NavigationMenu.tsx`, add grimoire link after history:
```tsx
...(user ? [{ id: 'grimoire', label: 'grimoire', href: '/grimoires', isLink: true }] : []),
```

Also add to chat header nav (page.tsx, after the history button we just added).

### D3: Grimoire context injection
In the query pipeline (page.tsx handleSubmit or simple-query route):
- Check if active grimoire exists
- If yes, prepend grimoire objectives as system context
- Add grimoire ID to query metadata for tracking

### VERIFY D:
- Create grimoire "Q1 Research"
- Set objective: "Analyze quantum computing market"
- Submit query → response informed by grimoire context
- History shows query linked to grimoire
- Commit: "feat(grimoire): CRUD, navigation, context injection — Day 48"

---

## POST-CLI: Browser Verification Checklist
After running all phases, verify in browser:
- [ ] Depth sigils visible on responses ✓/✗
- [ ] Depth toggle works ✓/✗
- [ ] Refinement buttons appear on responses ✓/✗
- [ ] Refinement triggers re-query ✓/✗
- [ ] Canvas shows query cards ✓/✗
- [ ] Grimoire CRUD works ✓/✗
- [ ] Grimoire in navigation ✓/✗
- [ ] Search returns results (with Brave key) ✓/✗
- [ ] All views accessible from chat header ✓/✗