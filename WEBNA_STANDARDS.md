# AKHAI — WEBNA DEVELOPMENT STANDARDS
# READ THIS BEFORE EVERY SESSION. NO EXCEPTIONS.
# Last updated: 2026-03-28
# Authority: This file overrides ALL other prompt files, plans, and trackers.

## WHAT CHANGED

AkhAI has been operating without engineering discipline. The evidence:
- page.tsx is 3692 lines (max should be 500)
- 15+ scattered CC_PROMPT_*, CLI_PROMPT_*, PLAN files in root
- Fixes that break other things (no test gate)
- Uncommitted work lost between sessions
- No CI pipeline — broken code can deploy
- Security fixes applied ad-hoc, not systematically

This ends now. From this session forward, AkhAI follows WEBNA production standards.
The goal: ship-grade software that a senior developer or CTO would approve.

---

## THE 5 IRON RULES (memorize these)

### RULE 1: NEVER DEPLOY WITHOUT GREEN GATES
Before ANY commit:
```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
```
If any gate fails, FIX IT before committing. No exceptions. No "fix later."
Add this as a pre-commit hook (Husky + lint-staged).

### RULE 2: SURGICAL EDITS ONLY
- Read the file section BEFORE editing
- Change ONLY the lines that need changing
- If your diff touches >50 lines for a small fix, REVERT and retry
- Never run formatters on existing files
- One concern per commit. One fix per commit.

### RULE 3: COMMIT AFTER EVERY WORKING CHANGE
NOT after the session. NOT after multiple changes. AFTER EACH WORKING CHANGE.
```bash
git add -A && git commit -m "fix: description of what changed"
```
Use Conventional Commits: feat|fix|refactor|docs|test|chore
If you made 5 changes without committing, you've already broken this rule.

### RULE 4: UPDATE RESUME.md BEFORE CONTEXT FILLS
RESUME.md is the ONLY file the next session reads. Keep it under 100 lines.
- Move completed items from REMAINING to COMPLETED
- Update file line counts if changed
- Update timestamp
- If RESUME.md is stale, the next session wastes 40% of context re-discovering state.

### RULE 5: EVERY FILE UNDER 500 LINES
If a file exceeds 500 LOC, split it IMMEDIATELY. Not "later." Not "next session."
page.tsx at 3692 lines is a critical violation. Splitting it is priority #1.

---

## GIT DISCIPLINE

### Commit Convention
```
feat: add new feature
fix: fix bug (describe what was broken)
refactor: restructure without behavior change
docs: documentation only
test: add or fix tests
chore: dependencies, config, tooling
```

### Branch Protection
- main = production. NEVER force-push.
- Work on feature branches: `git checkout -b feat/split-page-tsx`
- Merge only after all 4 gates pass (type-check, lint, test, build)

### What NEVER Goes in Git
- .env files (use .env.example with dummy values)
- Database files (.db, .sqlite)
- Planning/prompt files (CC_PROMPT_*, CLI_PROMPT_*)
- Node modules, .next cache, build artifacts
- API keys, tokens, secrets of any kind

### Pre-Commit Hook (set up with Husky)
```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

---

## CODE QUALITY STANDARDS

### TypeScript
- `strict: true` — no exceptions
- Zero `as any` casts — use proper types or `unknown`
- Named exports only (no default exports except pages)
- Every function has explicit return types
- No unused variables, no unused imports

### File Organization
- Max 500 LOC per file — split when approaching
- One component per file
- Co-locate: component + its types + its tests
- Directory structure: feature-based, not type-based

### Error Handling
- Every API call wrapped in try/catch
- Every data path uses optional chaining (?.)
- Loading states for every async operation
- Error boundaries at route level (error.tsx)
- Never expose stack traces to users

---

## THE CLEANUP PROTOCOL (do this FIRST)

### Step 1: Archive Root Clutter
```bash
mkdir -p docs/archive/prompts docs/archive/plans
mv CC_PROMPT_*.md docs/archive/prompts/
mv CLI_PROMPT_*.md docs/archive/prompts/
mv GOD_VIEW_TRACKER.md docs/archive/plans/
mv TODO_MASTER_PLAN.md docs/archive/plans/
mv MILESTONE_PLAN.md docs/archive/plans/
mv SYSTEM_AUDIT_DAY36.md docs/archive/plans/
mv SESSION_RESUME_MAR17_2026.md docs/archive/plans/
mv IMPLEMENTATION_PLAN.md docs/archive/plans/
mv METHODOLOGIES.md docs/archive/plans/
```
Root should contain ONLY:
- CLAUDE.md (session instructions)
- WEBNA_STANDARDS.md (this file)
- RESUME.md (session continuity)
- README.md (public documentation)
- CONTRIBUTING.md
- LICENSE
- package.json, tsconfig.json, turbo.json
- Config files (.eslintrc, .prettierrc, .gitignore, .husky/)

### Step 2: Split page.tsx (CRITICAL — 3692 lines is unacceptable)
Target: page.tsx becomes a thin orchestrator (<200 lines) importing sections.
```
packages/web/app/page.tsx          — <200 lines, imports only
packages/web/components/sections/
  ChatHeader.tsx                   — nav bar + mode toggles
  ChatInput.tsx                    — input area + refinement buttons
  ChatMessages.tsx                 — message list + streaming
  MethodologyPanel.tsx             — methodology selector + depth
  SideCanal.tsx                    — left sidebar
  SefirotPanel.tsx                 — Tree of Life visualization
  MindMapPanel.tsx                 — knowledge graph
  GrimoirePanel.tsx                — grimoire CRUD
```
Each section: <500 lines, own types, own tests.

### Step 3: Set Up CI Gates
Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```
Nothing merges to main without all 4 passing.

### Step 4: Fix Tests
Current: 27/27 passing (per CLAUDE.md) but RESUME says 57/57.
Verify: `pnpm test` — document actual count.
Target: 80%+ coverage on critical paths (methodologies, guard, auth).

---

## WEBNA PRODUCTION PHASES (adapted for AkhAI)

AkhAI is past Phase 3 (core features built). But Phases 6-12 were SKIPPED.
You must go back and complete them before adding new features.

### Phase 6: ERROR HARDENING (DO THIS NOW)
- Eliminate every console error in production
- Add optional chaining on ALL data paths
- Guard null/undefined from every API response
- Handle network failures, timeouts, rate limits gracefully
- Target: ZERO errors in browser console

### Phase 7: SECURITY HEADERS
- CSP middleware with per-request nonces (partially done — verify)
- HSTS, X-Frame-Options, X-Content-Type-Options
- Test at securityheaders.com — target A+
- All API keys server-side only

### Phase 8: DEPLOYMENT HARDENED
- Auto-deploy from git push (Vercel or VPS)
- Environment variables validated at build time (t3-env)
- Health check endpoint: /api/health
- Zero 404s, all assets loading

### Phase 11: MONITORING
- UptimeRobot on /api/health (5-min checks)
- Sentry error tracking (already started — verify working)
- PostHog analytics (already implemented)

### Phase 13: DEPENDENCY SECURITY
- `pnpm audit` — zero high-severity
- Pin dependency versions in package.json
- Lock file committed

### Phase 18: TESTING PIPELINE
- Vitest unit tests: 80% coverage on core/
- Playwright E2E: auth flow, query flow, methodology switching
- Pre-commit hooks gate all commits

### Phase 19: STRUCTURED LOGGING
- Replace console.log with structured logging
- Redact sensitive fields (API keys, user data)
- Correlation IDs per request

---

## SESSION WORKFLOW (replace old workflow)

### On Session Start
1. `cat ~/akhai/RESUME.md` — read current state (1 tool call)
2. `cat ~/akhai/WEBNA_STANDARDS.md` — read standards (1 tool call)
3. Start building immediately. Do NOT re-read old prompts.

### During Work
4. One task at a time. Finish it. Test it. Commit it.
5. Run gates after every change: `pnpm type-check && pnpm build`
6. If build breaks, fix IMMEDIATELY — never continue with a broken build
7. Commit after each working change with Conventional Commit message
8. If fixing a bug creates a new bug, STOP — root-cause analyze before proceeding

### Before Session Ends
9. Run full gate: `pnpm type-check && pnpm lint && pnpm test && pnpm build`
10. `git add -A && git commit -m "type: description"` — commit everything
11. Update RESUME.md with current state, completed items, remaining items
12. `git push origin main` (or current branch)

### ANTI-PATTERNS (things that were happening — STOP doing these)
❌ Making 10 changes then committing once at the end
❌ Fixing something that breaks something else, then fixing that too
❌ Creating new CC_PROMPT or CLI_PROMPT files in root
❌ Reading 300+ lines of old logs/plans on session start
❌ Skipping type-check or build between changes
❌ Adding features before stabilizing existing code
❌ Editing page.tsx without reading the section first
❌ Running formatters on files you didn't write

### CORRECT PATTERNS
✅ Read RESUME.md → start building (2 tool calls max)
✅ One change → test → commit → next change
✅ Split large files BEFORE they become problems
✅ Fix the root cause, not the symptom
✅ When in doubt, run `pnpm build` — it catches everything
✅ Update RESUME.md continuously, not just at session end

---

## PRIORITY ORDER FOR NEXT SESSIONS

1. **CLEANUP**: Archive root clutter (Step 1 above) — 5 minutes
2. **SPLIT**: page.tsx into 8+ section components — 1-2 sessions
3. **GATES**: Set up Husky + lint-staged + CI workflow — 30 minutes
4. **TESTS**: Verify test count, add missing coverage — 1 session
5. **SECURITY**: Full headers audit, securityheaders.com A+ — 1 session
6. **DEPLOY**: Health endpoint, monitoring, error tracking verified — 1 session
7. THEN and ONLY THEN: resume feature work (Grimoire, mobile, etc.)

Stabilize before you build. Production-grade before new features.

---

*This document follows the WEBNA 24-Phase methodology.*
*Reference: ~/ship-website/How-To-Build-And-Ship-A-Website-Pro.docx*
*Created by Algoq | AkhAI | March 2026*
