# AkhAI Lessons Learned

> Review this file at session start. Add new lessons after ANY correction.

---

## Critical Rules

### 1. Always Verify Before Done
- **Lesson**: Never mark complete without screenshot/test proof
- **Pattern**: Take screenshot → check logs → confirm visual
- **Trigger**: After ANY UI change

### 2. Localhost Must Be Running
- **Lesson**: Check `lsof -i :3000` before browser work
- **Pattern**: Start server → wait for "Ready" → then navigate
- **Command**: `cd /Users/sheirraza/akhai/packages/web && pnpm dev`

### 3. Read File Before Edit
- **Lesson**: Always read current state before modifying
- **Pattern**: `read_file` → understand → then `edit_block` or `write_file`
- **Why**: Prevents overwriting working code with assumptions

### 4. Plan Multi-Step Tasks
- **Lesson**: 3+ steps = write plan first, get approval
- **Pattern**: List steps → verify with user → execute → verify result
- **Why**: Prevents wasted work on wrong approach

### 5. Minimal Impact Changes
- **Lesson**: Touch only what's necessary
- **Pattern**: Small, focused edits > large rewrites
- **Why**: Less risk of breaking working features

---

## Project-Specific

### Philosophy Page
- Uses colorful orb trees (see screenshot Jan 29)
- Dark theme with purple/gold accents
- Must show AI layer names (meta-cognition, reasoning, etc.)

### Tree of Life Config
- Located at `/app/tree-of-life/page.tsx`
- Uses `AIConfigUnified.tsx` component
- Two tabs: Configuration + History

### Server Issues
- If blank page: check console errors first
- If port busy: `lsof -i :3000` then `kill -9 <PID>`
- Node version: v24.4.1 (rebuilt better-sqlite3)

---

## Anti-Patterns (Don't Do)

| Bad | Good |
|-----|------|
| Start coding without reading current file | Read first, then edit |
| Write 500+ line file in one go | Chunk into 30 line pieces |
| Assume server is running | Verify with `lsof` or curl |
| Mark done without testing | Screenshot + log check |
| Rush multiple changes | One change, verify, next |

---

## Session Checklist

```
□ Read tasks/lessons.md (this file)
□ Check tasks/todo.md for current sprint
□ Verify dev server status
□ Confirm which task to work on
□ Write plan if 3+ steps
□ Execute with verification
□ Update todo.md with results
```
