# AkhAI
Sovereign multi-AI consensus research engine. Visual-first, gnostic approach.
TypeScript monorepo (pnpm). "Code Relic" grey-only design.

## ⚡ MANDATORY: Read WEBNA_STANDARDS.md BEFORE starting any work.
## It defines the engineering discipline this project now follows.
## If WEBNA_STANDARDS.md and this file conflict, WEBNA_STANDARDS.md wins.

## EDITING RULES (MANDATORY — NEVER IGNORE)
- DO NOT reformat existing code. No quote changes, no semicolons, no import reordering.
- DO NOT run prettier, eslint --fix, or any formatter on existing files.
- ONLY add or modify the specific lines needed for the task.
- Surgical edits only — find exact lines, change only those.
- Before committing: `git diff --stat` — if >50 lines changed for a small feature, REVERT and retry with smaller edits.
- When editing page.tsx: treat it as fragile. Read the section first, edit minimal lines.

## Stack
TypeScript strict, Next.js 15, React 19, Tailwind 4, Zustand, pnpm workspaces, Turbo

## Commands
- `pnpm dev` — web UI on localhost:3000
- `pnpm build` — production build all packages
- `pnpm test` — core tests (27/27 passing)
- `pnpm lint` — ESLint
- `pnpm type-check` — TypeScript validation
- `pnpm format` — Prettier (ONLY for new files you create)

## Architecture
```
packages/core/src/methodologies/ — 7 methods: Direct, CoD, BoT, ReAct, PoT, GTP, Auto
packages/core/src/grounding/     — Guard system (4 detectors, <1% hallucination)
packages/web/                    — Next.js dashboard
packages/web/app/page.tsx        — MAIN FILE (~2000 lines, edit surgically)
packages/web/components/         — UI (SefirotDashboard, MindMap, GuardWarning, NavigationMenu)
packages/web/lib/                — stores (chat-store, sefirot-store, side-canal-store, grimoire-store)
packages/inference/              — multi-provider (Anthropic, DeepSeek, Mistral, xAI)
packages/api/                    — Hono API layer
packages/mcp-server/             — MCP server
```

## Key APIs
- Claude Opus 4.5 = primary reasoning (ANTHROPIC_API_KEY)
- DeepSeek R1, Mistral Large 2, xAI Grok 3 = GTP consensus advisors
- CoinGecko = real-time crypto data

## 7 Methodologies
| Method | Triggers On |
|--------|------------|
| Direct | Simple factual questions |
| CoD | "step by step", "explain" |
| BoT | Structured analysis |
| ReAct | Multi-step problems |
| PoT | Math, calculations |
| GTP | Complex research (4 AIs debate) |
| Auto | AI-powered classification (96% accuracy) |

## UI Components (page.tsx sections)
- Chat header nav: Classic | auto | GUARD ACTIVE | MINDMAP | HISTORY | GRIMOIRE
- Refinement buttons: refine | enhance | correct | expand
- Depth toggle: minimal | standard | maximum
- Side Canal: left sidebar with topic extraction + suggestions
- Tree of Life: SefirotDashboard, SefirotConsole, SefirotMini
- MindMap: interactive knowledge graph with mini-chat

## CLI Tools
GitHub: `gh pr create`, `gh run list`
Deploy: `vercel --prod`

## Conventions
- Strict TS, no `any`. Named exports only.
- Conventional Commits (feat|fix|chore|refactor|docs|test)
- Files under 500 LOC — split when larger.
- "Code Relic" design: grey-only palette (#18181b, #64748b, #94a3b8, #f1f5f9, #ffffff)
- No emojis in UI. Green only for guard indicator.
- Monospace typography, uppercase tracking for labels.

## Current State (March 2026)
- Phase 3+ complete: 7 methodologies, Grounding Guard, extended thinking
- Side Canal 80% done, MindMap UI in progress
- Depth annotations + Live Refinement + Canvas wiring = DONE (Phase A-C)
- Phase D (Grimoire): IN PROGRESS — CRUD, navigation, context injection
- Crypto payments ready (NOWPayments + BTCPay)
- Next: finish Phase D, then production API + streaming

## Session Workflow
1. Read `tasks/todo.md` for current sprint
2. Check `tasks/lessons.md` for anti-patterns
3. Plan before executing (3+ steps = write plan first)
4. Test after implementing — screenshot + logs = proof
5. When done: update SESSION_NOTES.md via /save

## Writing Style
Lead with insight. No filler. No "Great question!" or "Let me explain."
Paragraphs over bullets. Every word earns its place.
Write concise responses. Min tokens.

## Reference
Full project history, payment system docs, Sefirot details, Side Canal API:
see CLAUDE_FULL_REFERENCE.md (do NOT read unless specifically needed)
