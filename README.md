# 🧠 AkhAI

**Super Research Engine** with Multi-AI Consensus System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-orange.svg)](package.json)

---

## What is AkhAI?

AkhAI is a powerful research engine that uses **multiple AI models** to reach consensus through **automated verification loops**. It orchestrates 4 AI providers (Anthropic, DeepSeek, xAI Grok, OpenRouter) to provide well-reasoned, multi-perspective answers.

### Key Features

- 🔬 **Multi-AI Consensus**: 4 advisors + Mother Base with automated verification
- 🔄 **Verification Loops**: Max 3 rounds (2 min each) at all levels
- 🤖 **4 AI Providers**: Anthropic (Claude), DeepSeek, xAI (Grok), OpenRouter
- 🎯 **Two Execution Flows**:
  - **Flow A**: Mother Base Decision (strategic decisions)
  - **Flow B**: Sub-Agent Execution (task execution)
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

# Advisor Layer: DeepSeek (Slots 1 & 2)
DEEPSEEK_API_KEY=sk-...

# Advisor Layer: xAI Grok (Available for Slots 1 & 2)
XAI_API_KEY=xai-...

# Advisor Layer: OpenRouter (Slot 3 - FIXED)
OPENROUTER_API_KEY=sk-or-...
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
Mother Base (Your choice)
     │
     ▼
Advisor Layer (4 AIs)
├── Slot 1: Configurable (Technical)
├── Slot 2: Configurable (Strategic)
├── Slot 3: OpenRouter (Fixed)
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
  openrouter: process.env.OPENROUTER_API_KEY,
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
| **deepseek** | deepseek-chat | ✅ Yes | $0.14 / $0.28 | Cost-effective, Slots 1-2 |
| **xai** | grok-beta | ✅ Yes | $5 / $15 | Grok from xAI, Slots 1-2 |
| **openrouter** | anthropic/claude-3.5-sonnet | ✅ Yes | Variable | **Slot 3 (FIXED)** |

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
- **Advisor Slot 1:** deepseek
- **Advisor Slot 2:** xai
- **Advisor Slot 3:** openrouter (FIXED - cannot be changed)
- **Advisor Slot 4:** anthropic (redactor, same as Mother Base)
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
- Real API implementations (4 providers: Anthropic, DeepSeek, xAI, OpenRouter)
- Token usage tracking & cost calculation
- Retry logic with exponential backoff
- Integration tests with Jest
- Provider-specific error handling

### Phase 2: Web Interface
- Search engine UI
- Live verification window
- Chat interface
- Real-time consensus visualization

### Phase 3: Desktop App
- Project-to-Agent conversion
- Local agent creation
- Agent testing and debugging

### Phase 4: Agent Marketplace
- Agent publishing
- Agent trading
- Revenue sharing
- Quality ratings

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

## Credits

Built with ❤️ by [algoq369](https://github.com/algoq369)

**Powered by:**
- [Anthropic Claude](https://www.anthropic.com/) - Mother Base, Redactor, Sub-Agents
- [DeepSeek](https://www.deepseek.com/) - Cost-effective reasoning
- [xAI Grok](https://x.ai/) - Strategic analysis
- [OpenRouter](https://openrouter.ai/) - Diversity provider (Slot 3)

---

## Support

- 📧 Email: [Your email]
- 💬 GitHub Issues: [Issues](https://github.com/algoq369/akhai/issues)
- 📖 Documentation: [Docs](docs/)

---

**AkhAI - The Super Research Engine that creates and trades AI agents** 🚀
