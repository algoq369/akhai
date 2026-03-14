---
name: akhai-dev
description: AkhAI sovereign consensus engine development workflow. Use when working on AkhAI codebase — editing page.tsx, components, methodologies, grounding guard, Side Canal, MindMap, Grimoire, SefirotDashboard. Enforces surgical editing rules, prevents reformatting disasters, manages session state. Use for any AkhAI feature development, bug fixing, or UI work.
---

# AkhAI Development Skill

## MANDATORY EDITING RULES
These rules override ALL other instructions. NEVER break them.

1. **NO REFORMATTING** — Do not change quotes, semicolons, imports, or whitespace in existing code.
2. **SURGICAL EDITS ONLY** — Find the exact lines to change. Edit only those lines. Leave everything else untouched.
3. **NO FORMATTERS** — Never run prettier, eslint --fix, or any auto-formatter on existing files.
4. **DIFF CHECK** — Before committing, run `git diff --stat`. If any file shows >50 changed lines for a small feature, STOP and revert. Try again with smaller edits.
5. **page.tsx IS FRAGILE** — This file is ~2000 lines. Always read the specific section first, then edit minimal lines. Never rewrite sections.

## Architecture Quick Reference

```
packages/web/app/page.tsx           — MAIN UI (~2000 lines, FRAGILE)
packages/web/components/            — SefirotDashboard, MindMap, GuardWarning, NavigationMenu, Grimoire
packages/web/lib/stores/            — Zustand: chat-store, sefirot-store, side-canal-store, grimoire-store
packages/core/src/methodologies/    — 7 methods: Direct, CoD, BoT, ReAct, PoT, GTP, Auto
packages/core/src/grounding/        — Guard system (4 detectors)
packages/inference/                 — Multi-provider: Anthropic, DeepSeek, Mistral, xAI
```

## page.tsx Section Map (approximate line ranges)
- Header nav (Classic/auto/GUARD/MINDMAP/HISTORY/GRIMOIRE): ~line 1750-1800
- Refinement buttons (refine/enhance/correct/expand): ~line 1800-1850
- Depth toggle: ~line 1850-1900
- Chat messages rendering: ~line 1400-1600
- handleSubmit / query pipeline: ~line 400-600
- Side Canal integration: ~line 300-400

## Commit Convention
```
feat(component): Short description — Day XX
fix(component): Short description
refactor(component): Short description
```

## Session Workflow
1. Read `tasks/todo.md` for current sprint
2. Check `tasks/lessons.md` for anti-patterns
3. Plan before executing (3+ steps = write plan, get approval)
4. After implementation: write tests in same context
5. `git diff --stat` before every commit
6. End of session: update SESSION_NOTES.md

## Design System ("Code Relic")
- Grey-only: #18181b (void), #64748b (slate), #94a3b8 (silver), #f1f5f9 (ghost), #ffffff (white)
- Exception: green for guard indicator only
- Monospace type, uppercase tracking for labels
- No emojis in UI (use · • ↑ ↓ ⚠)
- Minimal animations (200-300ms, purposeful only)

## Common Anti-Patterns (from lessons.md)
- Don't spread-operator large arrays (stack overflow on >100KB)
- Don't use `any` types
- Don't add console.log in production code
- Don't modify SefirotMini without checking dark mode
- Don't change page.tsx formatting or structure beyond the target edit

## Reference Files (read ONLY when specifically needed)
- `CLAUDE_FULL_REFERENCE.md` — Complete project history, payment system, all sessions
- `tasks/todo.md` — Current sprint tasks
- `tasks/lessons.md` — Rules and error patterns
- `CLI_PROMPT_DAY45_49.md` — Phase A-D implementation details
