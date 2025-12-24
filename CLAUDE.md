# CLAUDE.md

This file provides guidance to Claude Code when working with the AkhAI repository.

---

## 🎯 Project Overview

**AkhAI** is a **Sovereign AI Research Engine** combining 7 reasoning methodologies, real-time grounding verification (anti-hallucination), and autonomous context intelligence.

### Vision
- First truly sovereign AI system (no vendor lock-in)
- Zero hallucination tolerance through Grounding Guard
- Transparent reasoning with multiple methodologies
- Self-hosted capability with local LLM support

### Built by
**Algoq** - Solo Founder
*"AI should augment human thinking, not replace it"*

---

## 📦 Repository Structure

This is a **pnpm monorepo** with multiple packages:

```
akhai/
├── packages/
│   ├── web/              # Next.js 15 web interface (main UI)
│   ├── core/             # Core AI system (methodologies, grounding)
│   ├── inference/        # Inference engine (multi-provider support)
│   ├── tools/            # AI tools (web search, calculator, etc.)
│   ├── mcp-server/       # Model Context Protocol server
│   ├── api/              # API layer
│   └── cli/              # Command-line interface
├── docs/                 # Technical documentation
├── archive/              # Old documentation (preserved for reference)
└── README.md             # Investor-ready overview
```

---

## 🧠 Core Innovations

### 1. Seven Reasoning Methodologies

| Methodology | Purpose | Triggers On |
|-------------|---------|-------------|
| **Direct** | Fast single-pass | Simple factual questions |
| **CoD** (Chain of Draft) | Iterative refinement | "step by step", "explain" |
| **BoT** (Buffer of Thoughts) | Template-based reasoning | Structured analysis |
| **ReAct** | Thought-action cycles | Multi-step problems |
| **PoT** (Program of Thought) | Code-based solutions | Math, calculations |
| **GTP** (Generative Thoughts Process) | Multi-AI consensus | Complex research |
| **Auto** | Intelligent routing | Auto-selects best method |

**Implementation**: `packages/core/src/methodologies/`

### 2. Grounding Guard System

Four-layer verification system to prevent hallucinations:

1. **Hype Detection** - Flags exaggerated claims
2. **Echo Detection** - Catches repetitive content
3. **Drift Detection** - Ensures query relevance
4. **Factuality Check** - Verifies claims against sources

**Implementation**: `packages/core/src/grounding/`

### 3. Interactive Warning System

When Guard fails, user gets 3 options:
- **Refine** - AI suggests better questions
- **Continue** - Show response with warning badge
- **Pivot** - Alternative approaches

**Implementation**: `packages/web/components/GuardWarning.tsx`

### 4. Future Innovations (Planned)

- **Side Canal** - Context awareness panel
- **Mind Map** - Interactive reasoning visualization
- **Legend Mode** - Mastery-based progressive disclosure
- **Artifact System** - Generated code/charts/documents

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.9** - React framework
- **TypeScript 5.9+** - Type safety
- **Tailwind CSS** - Styling (grey-only "Code Relic" theme)
- **Zustand** - State management

### Backend/Core
- **TypeScript** - All packages
- **Anthropic API** - Primary LLM provider
- **Multi-provider support**:
  - DeepSeek
  - Mistral AI
  - xAI (Grok)
  - Future: Self-hosted (Ollama, LM Studio)

### Tools & Infrastructure
- **pnpm** - Package manager (workspaces)
- **Turbo** - Monorepo build system
- **Hono** - API framework
- **MCP (Model Context Protocol)** - Tool integration
- **Cheerio** - Web scraping
- **Better-SQLite3** - Local data persistence

---

## 🚀 Development Commands

### Install Dependencies
```bash
pnpm install
```

### Development (All Packages)
```bash
pnpm dev
```
Starts:
- Web UI: http://localhost:3000
- MCP Server
- Other services

### Build All Packages
```bash
pnpm build
```

### Web Interface (packages/web)
```bash
cd packages/web
pnpm dev          # Development server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm type-check   # TypeScript validation
```

### Core Package (packages/core)
```bash
cd packages/core
pnpm build        # Compile TypeScript
pnpm test         # Run tests
```

### Format Code
```bash
pnpm format              # Format all files
pnpm format:check        # Check formatting
```

---

## 📁 Key Files & Directories

### Web Interface (packages/web/)

#### Core UI
- `app/page.tsx` - Main chat interface
- `app/api/simple-query/route.ts` - Primary query endpoint
- `app/api/guard-suggestions/route.ts` - Suggestion generation

#### Components
- `components/MethodologyExplorer.tsx` - Circular methodology browser
- `components/GuardWarning.tsx` - Interactive warning system
- `components/grounding/` - Guard UI components
- `components/bot/` - BoT methodology visualizations

#### State & Utils
- `lib/chat-store.ts` - Message state management
- `lib/analytics.ts` - Query tracking
- `lib/realtime-data.ts` - Live data integration

#### Styling
- `app/globals.css` - Tailwind + custom styles
- "Code Relic" design: Grey-only palette, minimal, professional

### Core Package (packages/core/)

#### Methodologies
- `src/methodologies/direct.ts`
- `src/methodologies/cod.ts` - Chain of Draft
- `src/methodologies/bot.ts` - Buffer of Thoughts
- `src/methodologies/react.ts` - ReAct loops
- `src/methodologies/pot.ts` - Program of Thought
- `src/methodologies/gtp/` - GTP consensus
- `src/methodologies/selector.ts` - Auto-routing

#### Grounding System
- `src/grounding/GroundingGuard.ts` - Main guard orchestrator
- `src/grounding/detectors/HypeDetector.ts`
- `src/grounding/detectors/EchoDetector.ts`
- `src/grounding/detectors/DriftDetector.ts`
- `src/grounding/detectors/FactualityDetector.ts`

#### System
- `src/AkhAISystem.ts` - Main orchestrator
- `src/models/types.ts` - Type definitions
- `src/providers/` - LLM provider integrations

### Documentation (docs/)
- `METHODOLOGIES_EXPLAINED.md` - Complete methodology reference
- `GROUNDING_GUARD_SYSTEM.md` - Guard system details
- `ARCHITECTURE.md` - Technical architecture
- `MASTER_PLAN.md` - Vision and roadmap

---

## 🔑 Environment Variables

### Required
```bash
ANTHROPIC_API_KEY=sk-ant-...      # Primary provider
```

### Optional (Multi-provider)
```bash
DEEPSEEK_API_KEY=sk-...           # DeepSeek R1
MISTRAL_API_KEY=...               # Mistral AI
XAI_API_KEY=xai-...               # Grok
```

### Optional (Features)
```bash
COINGECKO_API_KEY=...             # Real-time crypto data
```

**Template**: See `packages/web/.env.example`

---

## 🧪 Testing

### Core Tests
```bash
cd packages/core
pnpm test                          # Run all tests
pnpm test:watch                    # Watch mode
```

### Methodology Testing
```bash
cd packages/web
./test-methodologies.sh            # Test all methodologies
```

### Manual Testing
- Use `app/debug/page.tsx` for debugging features
- Check browser console for detailed logs

---

## 📝 Code Conventions

### TypeScript
- Strict mode enabled
- Use explicit types (avoid `any`)
- Prefer interfaces over types for objects
- Use `const` over `let`

### Imports
```typescript
// Good
import { GroundingGuard } from '@/lib/grounding'
import type { Message } from '@/lib/chat-store'

// Avoid
import * as everything from 'somewhere'
```

### React Components
- Use `'use client'` directive for client components
- Prefer functional components
- Use TypeScript for props

### Naming
- **Files**: kebab-case (`grounding-guard.ts`)
- **Components**: PascalCase (`MethodologyExplorer.tsx`)
- **Functions**: camelCase (`generateSuggestions()`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)

### Comments
```typescript
// Single-line for brief explanations

/**
 * Multi-line JSDoc for functions/classes
 * @param query - User's input question
 * @returns AI response with methodology metadata
 */
```

---

## 🚦 Git Workflow

### Branch Strategy
- `main` - Production-ready code
- Feature branches: `feature/side-canal`, `fix/drift-detection`

### Commit Messages
Follow semantic format:
```
✨ feat: Add Side Canal context panel
🐛 fix: Drift detection for short queries
📝 docs: Update methodology guide
🎨 style: Refactor GroundingGuard UI
♻️ refactor: Simplify selector logic
✅ test: Add CoD methodology tests
```

### Before Committing
```bash
pnpm format              # Format code
pnpm lint                # Check linting
pnpm type-check          # TypeScript validation
pnpm test                # Run tests
```

---

## 🎨 UI Design System ("Code Relic")

### Colors
Grey-only palette with precise shades:
- `relic-void` - Dark text (#18181b)
- `relic-slate` - Medium grey (#64748b)
- `relic-silver` - Light grey (#94a3b8)
- `relic-ghost` - Subtle bg (#f1f5f9)
- `relic-white` - Clean white (#ffffff)

**Exception**: Green for guard indicator (active status)

### Typography
- Font: System fonts (no custom fonts)
- Uppercase tracking for labels
- Monospace for code/metrics

### Layout
- Minimal, clean, professional
- Generous whitespace
- Centered content (max-width constraints)
- Bottom-aligned input

### Animations
- Subtle, purposeful
- Fade-in for new content
- Smooth transitions (200-300ms)
- No distracting effects

---

## 🔒 Security Considerations

### API Keys
- **Never commit** `.env` files
- Use `.env.example` as template
- Store keys in environment variables only

### Input Validation
- Sanitize all user inputs
- Prevent XSS attacks
- Rate limit API endpoints

### Data Privacy
- No PII collection without consent
- Local-first data storage where possible
- Clear data retention policies

---

## 🐛 Known Issues & Quirks

### Drift Detection
- Skips queries <6 words (too short for meaningful overlap)
- Ignores math queries (they naturally drift from words)
- Threshold: 85% drift triggers warning

### Methodology Selection
- Auto mode analyzes query complexity (length, keywords)
- "step by step" → CoD
- Math symbols → PoT
- Multi-part questions → GTP

### Real-time Data
- CoinGecko API has rate limits (demo tier: 10-30 calls/min)
- Cached responses used when available

---

## 📊 Performance Guidelines

### Optimization Priorities
1. **Latency** - Sub-3s response for Direct mode
2. **Token efficiency** - Minimize unnecessary context
3. **Cost** - Use cheaper models for simple tasks
4. **Accuracy** - Never sacrifice quality for speed

### Methodology Performance
| Methodology | Avg Latency | Token Cost | Accuracy |
|-------------|-------------|------------|----------|
| Direct      | ~2s         | Low        | Good     |
| CoD         | ~8s         | Medium     | High     |
| BoT         | ~6s         | Medium     | High     |
| ReAct       | ~12s        | High       | Very High|
| PoT         | ~5s         | Low        | Perfect* |
| GTP         | ~25s        | Very High  | Consensus|
| Auto        | Varies      | Optimized  | Smart    |

*For math/code problems

---

## 🚀 Deployment

### Vercel (Recommended for Web)
```bash
cd packages/web
vercel deploy
```

Environment variables needed:
- `ANTHROPIC_API_KEY`
- Other optional provider keys

### Docker (Full Stack)
```bash
docker compose up --build
```

### Self-Hosted
Requires:
- Node.js 20+
- pnpm 8+
- LLM provider API keys OR local models (Ollama)

---

## 📚 Documentation References

### For Users
- `README.md` - Project overview & vision
- `CONTRIBUTING.md` - Contribution guidelines (closed development)
- `docs/METHODOLOGIES_EXPLAINED.md` - How each methodology works
- `docs/GROUNDING_GUARD_SYSTEM.md` - Anti-hallucination details

### For Developers
- This file (`CLAUDE.md`) - Development guide
- `docs/ARCHITECTURE.md` - Technical architecture
- `docs/MASTER_PLAN.md` - Vision & roadmap
- `packages/core/docs/METHODOLOGY_ARCHITECTURE.md` - Core system design

### For Investors
- `README.md` - Professional overview
- Roadmap section shows 6-phase plan
- Solo founder narrative (Algoq)
- Apache 2.0 license (open source)

---

## 💡 Development Tips

### Adding a New Methodology
1. Create file in `packages/core/src/methodologies/`
2. Implement `MethodologyExecutor` interface
3. Register in `packages/core/src/methodologies/registry.ts`
4. Add selector logic in `selector.ts`
5. Update UI in `packages/web/components/MethodologyExplorer.tsx`

### Adding a Guard Detector
1. Create file in `packages/core/src/grounding/detectors/`
2. Implement `Detector` interface
3. Register in `GroundingGuard.ts`
4. Add UI feedback in `GuardWarning.tsx`

### Adding Real-time Data Source
1. Create fetcher in `packages/web/lib/realtime-data.ts`
2. Add API key to `.env.example`
3. Integrate in query processing pipeline
4. Update documentation

---

## 🎯 Project Status

### ✅ Completed (Phase 1 & 2)
- 7 reasoning methodologies
- Grounding Guard system (4 detectors)
- Interactive warning system (Refine/Continue/Pivot)
- Methodology auto-selection
- Web interface with Next.js 15
- Multi-provider support (Anthropic, DeepSeek, Mistral, xAI)

### 🔄 In Progress (Phase 3)
- Side Canal (context awareness panel)
- Enhanced real-time data integration
- Performance optimizations

### 📋 Planned (Phase 4-6)
- Mind Map (interactive reasoning visualization)
- Legend Mode (progressive disclosure)
- Artifact System (generated content)
- Self-hosted LLM support (Ollama, LM Studio)
- Agent Marketplace
- Desktop application

---

## 📞 Support & Contact

- **Issues**: Use GitHub Issues for bugs/features
- **Discussions**: GitHub Discussions for questions
- **Investment/Partnership**: Contact info in README

---

## 📜 License

Apache 2.0 - See `LICENSE` file

Open source, but currently **closed development** (solo founder project).

---

**Remember**: This is about building trustworthy, sovereign AI that augments human thinking. Every feature should serve that mission.

*Built by Algoq • Sovereign AI • Zero Hallucination Tolerance*
