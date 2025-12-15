# AkhAI - Claude Code Context

## Project Overview
AkhAI is **The Unicorn AI Research Engine** - a multi-AI consensus system on track to $1B+ valuation.

**Vision:** Building the future of multi-AI collaboration with championship discipline, elite strategy, crypto capital, and world-class engineering.

## Team & Backing
- 🎓 **Philippe Haydarian** - Strategic Advisor (Former Deloitte | ENA Graduate)
- 💰 **Gregory Sankara** - Board Advisor (G&V Compagnie | +20% Valuation)
- 💻 **Andy** - Lead Technical Architect (AI Engineering Expert)
- 🥋 **Haidar** - Performance Advisor (BJJ World Champion | UFC Gym France)
- 🦄 **Status:** Unicorn Track | Backed by G&V Compagnie

**See [TEAM.md](TEAM.md) for full bios and unicorn trajectory**

## Architecture (4 Providers)

```
Mother Base: Anthropic Claude Sonnet 4
     │
     ▼
ADVISOR LAYER:
├── Slot 1: DeepSeek       (Technical brainstormer)
├── Slot 2: Grok/xAI       (Strategic brainstormer)
├── Slot 3: Mistral AI     (Diversity provider)
└── Slot 4: Claude         (Redactor = Mother Base)    [Auto-aligned]
     │
     ▼
Sub-Agents: Same as Mother Base
```

## THE 4 PROVIDERS ARE:
1. **anthropic** - Mother Base, Redactor (Slot 4), Sub-Agents
2. **deepseek** - Advisor Slot 1 (Technical brainstorming)
3. **xai** - Advisor Slot 2 (Strategic brainstorming)
4. **mistral** - Advisor Slot 3 (Diversity provider) ← Replaces OpenRouter

## Current Status: Phase 3 Complete! ✅ (v0.3.0)

### Phase 1 ✅ COMPLETE!
### Phase 2 ✅ COMPLETE! (Web Interface)
### Phase 3 ✅ COMPLETE! (GTP, Smart Selector, Minimalist UI, Dream Team)

### ✅ DONE (Phase 1 - Core Engine)
- AnthropicProvider (packages/core/src/providers/anthropic.ts)
- DeepSeekProvider (packages/core/src/providers/deepseek.ts)
- MistralProvider (packages/core/src/providers/mistral.ts) ← Replaces OpenRouter
- XAIProvider (packages/core/src/providers/xai.ts)
- BaseProvider with retry logic (3 attempts, exponential backoff, 30s timeout)
- CostTracker (packages/core/src/utils/CostTracker.ts)
- MCP Server (packages/mcp-server/)
- Flow A & Flow B implementation
- Integration tests (packages/core/tests/integration.test.ts)
- ModelFamily type: 'anthropic' | 'deepseek' | 'xai' | 'mistral'
- All configs updated for 4 providers
- Core package builds successfully ✅

### ✅ DONE (Phase 2 - Web Interface)
- Next.js 15 application with TypeScript
- Homepage with methodology selector (Direct, CoT, AoT, GTP, Auto)
- Live verification window with SSE streaming
- Real-time consensus visualization
- Dashboard with provider status and cost tracking
- History page with query archive
- Settings page with API key management
- Compare page for methodology benchmarking
- Responsive design with Tailwind CSS

### ✅ DONE (Phase 3 - GTP & Smart Features) (v0.3.0)
- **GTP Flash Architecture**: Parallel multi-AI consensus (~25s)
- **Smart Methodology Selector**: Auto-routing simple queries to direct mode
- **Interactive Round Pause**: Continue/Accept/Cancel buttons for consensus rounds
- **Minimalist UI**: Grey-only design with liquid ether background
- **Mistral Integration**: Replaced OpenRouter with Mistral AI (Slot 3)
- **Five Methodologies**: Direct, CoT, AoT, Flash (GTP), Auto
- **Round Pause UI**: User control over consensus flow
- **Dream Team Assembled**: Philippe (ENA), Gregory (G&V), Andy, Haidar
- **Unicorn Vision**: $5M seed → $20M Series A → $1B+ valuation trajectory

### ✅ DONE (Phase 2 - Web Interface - Detailed)
- Next.js 15.5.9 project with TypeScript (packages/web/)
- Homepage with search bar and Flow A/B toggle
- Query results page with real-time updates
- API routes (POST /api/query, GET /api/stream/[id])
- SSE (Server-Sent Events) streaming for live updates
- Components (SearchBar, FlowToggle, VerificationWindow)
- Event streaming wrapper (lib/akhai-executor.ts)
- Query store with event emitter (lib/query-store.ts)
- Full @akhai/core integration
- Real AI consensus execution (Flow A & B)
- Environment configuration (.env.example)
- Responsive design with Tailwind CSS
- Web package builds successfully ✅

## API Keys Required (4)
```
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
XAI_API_KEY=xai-...
OPENROUTER_API_KEY=sk-or-...
```

## XAI/Grok API Details
- Endpoint: https://api.x.ai/v1/chat/completions
- Model: grok-beta or grok-2-latest
- Uses OpenAI-compatible API format
- Auth: Bearer token in Authorization header

## Key Rules
- OpenRouter is ALWAYS Slot 3 (FIXED, cannot be changed)
- Redactor (Slot 4) ALWAYS matches Mother Base
- Sub-Agents ALWAYS match Mother Base
- Slots 1-2 are configurable but must differ from Mother Base

## Commands
```bash
# Build packages
cd packages/core && pnpm build
cd packages/mcp-server && pnpm build

# Run web interface
cd packages/web && pnpm dev
# Open http://localhost:3000
```


## Phase 3: GTP (Generative Thoughts Process) - IN PROGRESS 🚧

### What is GTP?
Bio-inspired parallel Flash architecture based on DARPA's Generative Optogenetics.
Instead of sequential advisor calls (90s), we "flash" to all advisors simultaneously (25-30s).

### Implementation Plan
**FULL DETAILS:** See `GTP_IMPLEMENTATION_PLAN.md` in project root

### 10 Implementation Phases:
1. **Types** - Core interfaces in `/packages/core/src/methodologies/types.ts`
2. **FlashContextBuilder** - Creates context frames for parallel broadcast
3. **FlashBroadcaster** - Uses `Promise.allSettled()` for TRUE parallelism
4. **LivingDatabase** - Real-time merge of advisor responses
5. **QuorumManager** - Consensus detection (don't wait for all, proceed when enough agree)
6. **GTPExecutor** - Main orchestrator in `/packages/core/src/methodologies/gtp/`
7. **Selector** - Auto-selects methodology based on query analysis
8. **Integration** - API routes, SSE events
9. **UI** - Methodology selector, parallel progress bars
10. **Testing** - E2E validation

### New Methodologies:
- `direct` - Simple factual queries (~5s)
- `cot` - Chain of Thought, sequential (~30s)
- `aot` - Atom of Thoughts, decompose→solve→contract (~60s)
- `gtp` - Flash/parallel multi-AI consensus (~25s) ← NEW!
- `auto` - Smart selection based on query

### Key Files to Create:
```
packages/core/src/methodologies/
├── types.ts
├── selector.ts
└── gtp/
    ├── index.ts
    ├── FlashContextBuilder.ts
    ├── FlashBroadcaster.ts
    ├── LivingDatabase.ts
    └── QuorumManager.ts
```

### Critical Implementation Rules:
1. Use `Promise.allSettled()` for TRUE parallelism (not sequential awaits!)
2. Each advisor gets unique role (technical/strategic/creative/critical)
3. Living Database merges responses in real-time
4. Quorum-based: proceed when 2+ advisors agree, don't wait for all
5. Backward compatible: existing Flow A/B still works
