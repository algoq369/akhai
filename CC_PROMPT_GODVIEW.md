Read /Users/sheirraza/akhai/GOD_VIEW_TRACKER.md and /Users/sheirraza/akhai/CLAUDE.md for full context.

CRITICAL CONTEXT:
- Anthropic API credits are depleted. Set AKHAI_FREE_MODE=true when restarting dev server.
- components/god-view/GodViewTree.tsx already exists (17KB) — audit it, don't recreate.
- The tree currently displays Kabbalistic names (Kether, Chokmah, Binah etc) — must switch to AI computational names.

DO THESE 3 TASKS IN ORDER:

TASK 1 — Rename Kabbalistic → AI Computational names in layer-registry.ts
In lib/layer-registry.ts, for each of the 11 layers:
- Move current `name` value to a new `kabbalisticName` field
- Set `name` to the AI computational name:
  Kether → Meta-Core
  Chokmah → Reasoning  
  Binah → Encoder
  Da'at → Synthesis
  Chesed → Expansion
  Gevurah → Discriminator
  Tiferet → Attention
  Netzach → Generative
  Hod → Classifier
  Yesod → Executor
  Malkuth → Embedding
- Add `kabbalisticName: string` to the LayerMeta interface
- Keep hebrewName, meaning, aiRole unchanged
- Verify all references to .name still work (tree-of-life/page.tsx, LayerTreeFull.tsx, etc)

TASK 2 — Audit components/god-view/GodViewTree.tsx
- Check it compiles and renders correctly
- Verify it uses LAYER_METADATA[layer].name (which will now show AI names after Task 1)
- Verify it's properly imported in tree-of-life/page.tsx
- Fix any issues

TASK 3 — Restart dev server with free mode + test
Run:
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  sleep 2
  cd /Users/sheirraza/akhai/packages/web
  AKHAI_FREE_MODE=true NODE_ENV=development npx next dev --turbopack -p 3000

Then verify:
  curl -s http://localhost:3000/api/auth/session
  curl -s -X POST http://localhost:3000/api/auth/dev-login -c /tmp/akhai-cookie
  curl -s -b /tmp/akhai-cookie -X POST http://localhost:3000/api/simple-query -H "Content-Type: application/json" -d '{"query":"What is AI?","methodology":"auto"}' | head -50

After all 3 tasks, commit:
  git add -A && git commit -m "fix: rename layers to AI computational names, audit GodViewTree, enable free mode fallback"
