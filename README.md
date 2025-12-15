# 🧠 AkhAI

**The Unicorn AI Research Engine** - Building the Future of Multi-AI Consensus

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.3.0-orange.svg)](package.json)
[![Phase](https://img.shields.io/badge/Phase-3%20Complete-brightgreen.svg)](README.md#roadmap)
[![Status](https://img.shields.io/badge/Status-Unicorn%20Track-gold.svg)](README.md#vision--team)

---

## Vision & Team

AkhAI is not just a research engine—it's a **unicorn-track venture** backed by world-class expertise across technology, finance, strategy, and discipline. Our mission is to revolutionize how AI systems collaborate to deliver unprecedented research quality and business intelligence.

### 🏆 The Dream Team

**Philippe Haydarian** - Strategic Advisor
- Former Deloitte Senior Consultant
- **ENA Graduate** (École Nationale d'Administration - France's most prestigious administrative school)
- Elite strategic vision and institutional expertise
- Brings Fortune 500 operational excellence to AkhAI's architecture

**Gregory Sankara** - Board Advisor & Investment Partner
- Partner at **G&V Compagnie** (Leading Crypto Fund)
- **+20% valuation enhancement** through strategic partnerships
- Deep expertise in crypto markets and Web3 ecosystems
- Connecting AkhAI to institutional capital and DeFi infrastructure

**Andy** - Lead Technical Architect
- Expert software engineer and full-stack developer
- Architect of AkhAI's core multi-AI consensus engine
- Built GTP Flash architecture, smart methodology selector, and minimalist UI
- Production-grade TypeScript/Next.js expertise

**Haidar** - Performance & Discipline Advisor
- **BJJ World Games Champion**
- **UFC Gym France Representative**
- Brings elite athlete discipline, focus, and high-performance mindset
- Vision architect: translating competition excellence into product strategy

### 🦄 Unicorn Trajectory

With this powerhouse team combining **elite French education (ENA)**, **Big 4 consulting experience**, **crypto fund backing (+20% valuation)**, **world-class technical execution**, and **championship-level discipline**, AkhAI is positioned as a **veritable unicorn project**.

**Our Competitive Edge:**
- 🎓 **Institutional Credibility**: ENA + Deloitte pedigree
- 💰 **Strategic Capital**: G&V Compagnie partnership + 20% valuation boost
- 🔧 **Technical Excellence**: Production-ready AI consensus engine
- 🥋 **Execution Discipline**: Champion mindset driving product velocity

---

## What is AkhAI?

AkhAI is a powerful research engine that uses **multiple AI models** to reach consensus through **automated verification loops**. It orchestrates 4 AI providers (Anthropic, DeepSeek, xAI Grok, Mistral) to provide well-reasoned, multi-perspective answers.

### Key Features

- 🔬 **Multi-AI Consensus**: 4 advisors + Mother Base with automated verification
- ⚡ **Smart Methodology Selector**: Auto-routes simple queries to instant direct mode
- 🧬 **GTP Flash Architecture**: Parallel multi-AI consensus in ~25s
- 🎨 **Minimalist Web UI**: Clean grey-only design with liquid ether background
- 🔄 **Interactive Round Pause**: Continue/Accept/Cancel consensus rounds
- 🤖 **4 AI Providers**: Anthropic (Claude), DeepSeek, xAI (Grok), Mistral
- 🎯 **Five Methodologies**:
  - **Direct**: Simple factual queries (~5s)
  - **Chain of Thought**: Sequential reasoning (~30s)
  - **Atom of Thoughts**: Complex decomposition (~60s)
  - **Flash (GTP)**: Parallel multi-AI consensus (~25s)
  - **Auto**: Smart methodology selection
- 🔌 **MCP Integration**: Works with Claude Code CLI
- 💻 **TypeScript**: Fully typed, modern codebase
- 💰 **Cost Tracking**: Automatic token usage and cost calculation

---

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure API Keys

Create a `.env` file:

```bash
# Mother Base: Anthropic Claude Sonnet 4
ANTHROPIC_API_KEY=sk-ant-...

# Advisor Layer: DeepSeek (Slot 1 - Technical)
DEEPSEEK_API_KEY=sk-...

# Advisor Layer: xAI Grok (Slot 2 - Strategic)
XAI_API_KEY=xai-...

# Advisor Layer: Mistral AI (Slot 3 - Diversity)
MISTRAL_API_KEY=...
```

### 3. Build

```bash
# Build core engine
cd packages/core && pnpm build

# Build MCP server
cd packages/mcp-server && pnpm build
```

### 4. Use with Claude Code

The MCP server is automatically loaded by Claude Code. Use it with:

```
Use akhai.query to analyze: "What's the best database for real-time chat?"
```

---

## Architecture

```
Mother Base: Anthropic Claude Sonnet 4
     │
     ▼
Advisor Layer (4 AIs)
├── Slot 1: DeepSeek (Technical brainstorming)
├── Slot 2: xAI Grok (Strategic brainstorming)
├── Slot 3: Mistral AI (Diversity provider)
└── Slot 4: Redactor (= Mother Base)
     │
     ▼
Sub-Agents (= Mother Base)
```

### Flow A: Mother Base Decision

**Path:** User → Mother Base → Layer(1-3) → Redactor → Mother Base

Best for strategic decisions, architecture choices, high-level planning.

```typescript
import { createAkhAI } from '@akhai/core';

const akhai = createAkhAI('anthropic');
akhai.setApiKeys({ /* ... */ });
akhai.setupMotherBase();
akhai.setupAdvisorLayer('deepseek', 'xai');

const result = await akhai.executeMotherBaseFlow(
  'Should we use microservices or monolith architecture?'
);
```

### Flow B: Sub-Agent Execution

**Path:** User → Sub-Agent → Layer(1-3) → Redactor → Sub-Agent → Mother Base

Best for task execution, code generation, research, analysis.

```typescript
akhai.registerSubAgent('CodingAgent');

const result = await akhai.executeSubAgentFlow(
  'Build a REST API endpoint for user authentication',
  'CodingAgent'
);
```

---

## Package Structure

This is a monorepo with two main packages:

### `@akhai/core`

Core consensus engine with multi-AI orchestration.

```bash
cd packages/core
pnpm install
pnpm build
```

**Exports:**
- `createAkhAI()` - Factory function
- `AkhAISystem` - Main class
- All type definitions
- Model alignment utilities
- Provider factory

### `@akhai/mcp-server`

MCP server that exposes AkhAI via Model Context Protocol.

```bash
cd packages/mcp-server
pnpm install
pnpm build
```

**MCP Tools:**
- `akhai.query` - Execute queries (Flow A or B)
- `akhai.status` - Get system status
- `akhai.agents` - Manage sub-agents

---

## Usage Examples

### Example 1: Strategic Decision (Flow A)

```typescript
import { createAkhAI } from '@akhai/core';

const akhai = createAkhAI('anthropic');

akhai.setApiKeys({
  anthropic: process.env.ANTHROPIC_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
  xai: process.env.XAI_API_KEY,
  mistral: process.env.MISTRAL_API_KEY,
});

akhai.setupMotherBase('claude-sonnet-4-20250514');
akhai.setupAdvisorLayer('deepseek', 'xai');

// Execute Flow A
const result = await akhai.executeMotherBaseFlow(
  'Should we migrate to Kubernetes or stick with traditional VMs?'
);

console.log('Decision:', result.finalDecision);
console.log('Approved:', result.approvedAt !== null);
console.log('Consensus rounds:', result.layerConsensus.totalRounds);
```

### Example 2: Code Generation (Flow B)

```typescript
akhai.registerSubAgent('CodingAgent');

const result = await akhai.executeSubAgentFlow(
  'Create a TypeScript function to validate email addresses with proper regex',
  'CodingAgent'
);

console.log('Generated code:', result.finalOutput);
console.log('Sub-agent completed:', result.subAgentCompletedAt !== null);
console.log('Mother Base approved:', result.motherBaseApproval.approvedAt !== null);
```

### Example 3: Research Task (Flow B)

```typescript
akhai.registerSubAgent('ResearchAgent');

const result = await akhai.executeSubAgentFlow(
  'Research the latest trends in edge computing and summarize key findings',
  'ResearchAgent'
);

console.log('Research findings:', result.finalOutput);
```

### Example 4: Using MCP Tools (Claude Code)

In Claude Code CLI:

```
Use akhai.status to check what's configured
```

```
Use akhai.agents with action "list" to see available agents
```

```
Use akhai.query with these parameters:
- query: "Analyze the security implications of using JWT vs sessions"
- flow: "A"
- motherBase: "anthropic"
```

---

## Supported Model Families

| Family | Default Model | API Key Required | Pricing (per 1M tokens) | Notes |
|--------|---------------|------------------|------------------------|-------|
| **anthropic** | claude-sonnet-4-20250514 | ✅ Yes | $3 / $15 | Mother Base, Slot 4 (Redactor), Sub-Agents |
| **deepseek** | deepseek-chat | ✅ Yes | $0.14 / $0.28 | Slot 1 - Technical brainstorming |
| **xai** | grok-beta | ✅ Yes | $5 / $15 | Slot 2 - Strategic brainstorming |
| **mistral** | mistral-small-latest | ✅ Yes | $0.20 / $0.60 | Slot 3 - Diversity provider |

---

## API Reference

### Core API

```typescript
// Factory function (recommended)
const akhai = createAkhAI(motherBaseFamily: ModelFamily);

// Setup
akhai.setApiKeys(keys: Partial<Record<ModelFamily, string>>);
akhai.setupMotherBase(model?: string);
akhai.setupAdvisorLayer(slot1: ModelFamily, slot2: ModelFamily);
akhai.registerSubAgent(name: string);

// Execution
akhai.executeMotherBaseFlow(query: string): Promise<FlowAResult>;
akhai.executeSubAgentFlow(query: string, agentName: string): Promise<FlowBResult>;

// Utilities
akhai.listSubAgents(): string[];
akhai.getStatus(): StatusObject;
akhai.printSummary(): void;
```

### MCP Tools API

**akhai.query**
```typescript
{
  query: string;           // Required: The query/task
  flow?: 'A' | 'B';       // Default: 'A'
  agentName?: string;      // Required for Flow B
  motherBase?: string;     // Default: 'anthropic'
  advisorSlot1?: string;   // Default: 'deepseek'
  advisorSlot2?: string;   // Default: 'xai'
}
```

**akhai.status**
```typescript
{} // No arguments
```

**akhai.agents**
```typescript
{
  action: 'list' | 'register';  // Required
  agentName?: string;            // Required for 'register'
}
```

---

## Configuration

### Default Configuration

- **Mother Base:** anthropic (claude-sonnet-4-20250514)
- **Advisor Slot 1:** deepseek (Technical brainstorming)
- **Advisor Slot 2:** xai (Strategic brainstorming)
- **Advisor Slot 3:** mistral (Diversity provider)
- **Advisor Slot 4:** anthropic (Redactor, same as Mother Base)
- **Max Consensus Rounds:** 3 (2 min each)
- **Max Flow Exchanges:** 3

### Customization

You can customize Slots 1-2 per query:

```typescript
akhai.setupMotherBase('claude-sonnet-4-20250514');
akhai.setupAdvisorLayer('deepseek', 'deepseek');  // Both slots use DeepSeek
```

Or via MCP tools:

```
Use akhai.query with:
- motherBase: "anthropic"
- advisorSlot1: "deepseek"
- advisorSlot2: "xai"
```

---

## Development

### Prerequisites

- Node.js >= 18
- PNPM (package manager)
- TypeScript 5.3+

### Setup

```bash
# Clone repository
git clone https://github.com/algoq369/akhai.git
cd akhai

# Install dependencies
pnpm install

# Build packages
cd packages/core && pnpm build
cd ../mcp-server && pnpm build
```

### Project Structure

```
akhai/
├── packages/
│   ├── core/              # Core consensus engine
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── AkhAISystem.ts
│   │   │   └── models/
│   │   └── dist/          # Compiled output
│   └── mcp-server/        # MCP protocol wrapper
│       ├── src/
│       │   ├── index.ts
│       │   └── tools/     # MCP tool implementations
│       └── dist/          # Compiled output
├── docs/                  # Documentation
├── .cursor/               # Claude Code MCP config
└── pnpm-workspace.yaml    # Monorepo config
```

---

## Documentation

- **[Team & Vision](TEAM.md)** - Dream team bios and unicorn trajectory
- [Master Plan](docs/MASTER_PLAN.md) - Vision and roadmap
- [Architecture](docs/ARCHITECTURE.md) - Technical architecture
- [Website UI](docs/WEBSITE_UI.md) - Future web interface plans
- [MCP Setup](.cursor/README.md) - Claude Code integration

---

## Roadmap

### Phase 0: Foundation ✅ **COMPLETE**
- Core engine implementation
- MCP server integration
- Multi-AI consensus
- Flow A & B implementation

### Phase 1: Core Engine ✅ **COMPLETE**
- Real API implementations (4 providers: Anthropic, DeepSeek, xAI, Mistral)
- Token usage tracking & cost calculation
- Retry logic with exponential backoff
- Integration tests with Jest
- Provider-specific error handling

### Phase 2: Web Interface ✅ **COMPLETE**
- Next.js 15 web application
- Search engine UI with methodology selector
- Live verification window with SSE streaming
- Real-time consensus visualization
- Responsive dashboard and settings

### Phase 3: GTP & Smart Features ✅ **COMPLETE** (v0.3.0 - Dec 2024)
- **GTP Flash Architecture**: Parallel multi-AI consensus (~25s)
- **Smart Methodology Selector**: Auto-routing for simple queries
- **Interactive Round Pause**: Continue/Accept/Cancel consensus rounds
- **Minimalist UI**: Grey-only design with liquid ether background
- **Mistral Integration**: Replaced OpenRouter with Mistral AI
- **Five Methodologies**: Direct, CoT, AoT, Flash (GTP), Auto
- **Dream Team Assembled**: Philippe (ENA), Gregory (G&V), Andy, Haidar

### Phase 4: Series A Preparation 🎯 **Q1 2025**
- **$5M Seed Round** led by G&V Compagnie
- 10,000+ active users milestone
- Enterprise pilots with Fortune 500 companies
- Tokenomics whitepaper for $AKHAI governance token
- Team expansion: 5 engineers, 2 sales/BD
- Strategic partnerships with AI providers

### Phase 5: Series A & Scale 🚀 **Q2-Q3 2025**
- **$20M Series A** at $100M valuation
- 100,000+ users
- $1M ARR from enterprise contracts
- Agent marketplace launch (buy/sell/trade AI agents)
- Revenue sharing for agent creators
- DeFi integration via Gregory's crypto network

### Phase 6: Unicorn Status 🦄 **2026**
- **$100M ARR** from enterprise + marketplace
- 1M+ active users
- **$1B+ valuation** (unicorn achieved)
- IPO preparation or strategic acquisition
- Global expansion: US, Europe, Asia markets

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow existing code conventions
- Add JSDoc comments for public APIs
- Write tests for new features

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## The Team

**AkhAI is a unicorn-track venture backed by world-class expertise:**

### Leadership
- 🎓 **Philippe Haydarian** - Strategic Advisor (Former Deloitte | ENA Graduate)
- 💰 **Gregory Sankara** - Board Advisor & Investment Partner (G&V Compagnie | +20% Valuation)
- 💻 **Andy** - Lead Technical Architect (AI Engineering Expert)
- 🥋 **Haidar** - Performance & Discipline Advisor (BJJ World Champion | UFC Gym France)

**[Read Full Team Bios →](TEAM.md)**

### AI Partners
- [Anthropic Claude](https://www.anthropic.com/) - Mother Base, Redactor, Sub-Agents
- [DeepSeek](https://www.deepseek.com/) - Technical brainstorming (Slot 1)
- [xAI Grok](https://x.ai/) - Strategic brainstorming (Slot 2)
- [Mistral AI](https://mistral.ai/) - Diversity provider (Slot 3)

---

## Support

- 📧 Email: [Your email]
- 💬 GitHub Issues: [Issues](https://github.com/algoq369/akhai/issues)
- 📖 Documentation: [Docs](docs/)

---

## Funding & Investment

**Backed by G&V Compagnie** - Leading cryptocurrency investment fund
**Valuation Boost:** +20% through strategic partnerships
**Trajectory:** Seed → Series A ($20M) → Unicorn ($1B+)

**For Investment Inquiries:** Contact Gregory Sankara via [TEAM.md](TEAM.md)

---

**AkhAI - The Unicorn AI Research Engine** 🦄

*Building the future of multi-AI consensus with championship discipline, elite strategy, crypto capital, and world-class engineering.*

**Powered by:** ENA Excellence • Deloitte Strategy • G&V Capital • BJJ Champion Discipline • AI Engineering Mastery
