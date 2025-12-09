# 🏗️ AkhAI Architecture

Technical architecture and implementation details for the AkhAI Super Research Engine.

---

## 📐 System Overview

AkhAI is built as a **monorepo** with two main packages:

```
akhai/
├── packages/
│   ├── core/          # @akhai/core - Consensus engine
│   └── mcp-server/    # @akhai/mcp-server - MCP protocol wrapper
├── docs/              # Documentation
├── .cursor/           # Claude Code MCP configuration
└── pnpm-workspace.yaml
```

---

## 🧩 Core Components

### 1. Mother Base

**Purpose:** Primary decision-maker and final authority

**Responsibilities:**
- Receives initial queries
- Reviews advisor recommendations
- Approves or requests revisions
- Makes final decisions

**Configuration:**
- Can be any of 10 supported AI families
- Default: Anthropic Claude Sonnet 4
- Aligned with Slot 4 (Redactor) and all Sub-Agents

**Code Location:** `packages/core/src/AkhAISystem.ts`

```typescript
class AkhAISystem {
  private motherBaseProvider: IModelProvider | null;

  setupMotherBase(model?: string): void {
    const family = this.alignmentManager.getMotherBaseFamily();
    this.motherBaseProvider = this.providerFactory.createProvider({
      family,
      model: model || config.defaultModel
    });
  }
}
```

---

### 2. Advisor Layer

**Purpose:** Provide diverse perspectives and reach consensus

**Structure:** 4 slots with specific roles

#### Slot 1: Technical Brainstormer
- **Role:** Technical perspective
- **Configurable:** Yes (must differ from Mother Base)
- **Default:** DeepSeek

#### Slot 2: Strategic Brainstormer
- **Role:** Strategic perspective
- **Configurable:** Yes (must differ from Mother Base)
- **Default:** Qwen

#### Slot 3: Diversity Brainstormer
- **Role:** Ensure diversity
- **Configurable:** No (FIXED)
- **Value:** OpenRouter

#### Slot 4: Redactor
- **Role:** Synthesize advisor outputs
- **Configurable:** No (aligned with Mother Base)
- **Value:** Same family as Mother Base

**Consensus Process:**
- Max 3 rounds (2 min each)
- Each round: All brainstormers provide input
- Redactor checks consensus after each round
- Early exit if consensus reached
- Force conclusion at max rounds

**Code Location:** `packages/core/src/AkhAISystem.ts`

```typescript
async executeInternalConsensus(
  query: string,
  context?: { fromMotherBase?: string; fromSubAgent?: { agent: string; feedback: string } }
): Promise<ConsensusResult> {
  const maxRounds = 3;

  for (let round = 1; round <= maxRounds; round++) {
    // Get responses from all 3 brainstormers (Slots 1-3)
    const responses = await this.getBrainstormerResponses(query, round, context);

    // Check consensus via Redactor (Slot 4)
    const consensusReached = await this.checkConsensus(responses);

    if (consensusReached) break;
  }
}
```

---

### 3. Sub-Agents

**Purpose:** Execute specific tasks with specialized expertise

**Types:**
- **CodingAgent:** Code generation, debugging, refactoring
- **ResearchAgent:** Information gathering, analysis
- **AnalysisAgent:** Data analysis, insights, patterns
- **Custom:** User-defined agents

**Alignment:**
- All sub-agents use the same family as Mother Base
- Ensures consistency in execution style
- Simplifies prompt engineering

**Registration:**
```typescript
akhai.registerSubAgent('CodingAgent');
akhai.registerSubAgent('ResearchAgent');
akhai.registerSubAgent('CustomAgent');
```

---

## 🔄 Execution Flows

### Flow A: Mother Base Decision

**Visual Diagram:**
```
┌──────┐    ┌──────────────┐    ┌────────────┐    ┌──────────┐    ┌──────────────┐
│ User │───>│ Mother Base  │───>│  Advisor   │───>│ Redactor │───>│ Mother Base  │
└──────┘    │ (Evaluate)   │    │  Layer     │    │(Synthesize)   │ (Approve)    │
            └──────────────┘    │(Consensus) │    └──────────┘    └──────────────┘
                                └────────────┘          │                  │
                                      │                 │                  │
                                      └─────────────────┴──────────────────┘
                                              If REVISION requested
```

**Process:**
1. **Initial Query**
   - User provides query
   - Mother Base receives and evaluates

2. **Advisor Consensus** (max 3 rounds)
   - Slots 1-3 debate the query
   - Each provides perspective with [AGREE]/[DISAGREE]
   - Redactor (Slot 4) checks for consensus
   - Repeat until consensus or max rounds

3. **Redactor Synthesis**
   - Combines all advisor perspectives
   - Creates coherent recommendation
   - Highlights agreement and dissent

4. **Mother Base Review** (max 3 exchanges)
   - Reviews synthesized recommendation
   - Responds with APPROVE or REVISION
   - If REVISION: Feedback goes back to Advisor Layer
   - Repeat until approval or max exchanges

**Code Location:** `packages/core/src/AkhAISystem.ts::executeMotherBaseFlow()`

---

### Flow B: Sub-Agent Execution (DIRECT)

**Visual Diagram:**
```
Phase 1: Sub-Agent ↔ Advisor Layer
┌──────┐    ┌───────────┐    ┌────────────┐    ┌──────────┐    ┌───────────┐
│ User │───>│ Sub-Agent │───>│  Advisor   │───>│ Redactor │───>│ Sub-Agent │
└──────┘    │(Receive)  │    │  Layer     │    │(Synthesize)   │ (Execute) │
            └───────────┘    │(Guidance)  │    └──────────┘    └───────────┘
                             └────────────┘          │                │
                                   │                 │                │
                                   └─────────────────┴────────────────┘
                                        If NEED clarification

Phase 2: Sub-Agent → Mother Base Approval
┌───────────┐    ┌──────────────┐
│ Sub-Agent │───>│ Mother Base  │
│  (Submit  │    │  (Approve)   │
│   Work)   │<───│              │
└───────────┘    └──────────────┘
                  If REVISION needed
```

**Process:**

**Phase 1: Sub-Agent ↔ Advisor Layer** (max 3 exchanges)
1. Sub-Agent receives task
2. Advisor Layer provides guidance (consensus)
3. Redactor synthesizes guidance
4. Sub-Agent executes based on guidance
5. Sub-Agent reports completion or requests clarification
6. Repeat until complete or max exchanges

**Phase 2: Sub-Agent → Mother Base** (max 3 exchanges)
1. Sub-Agent submits completed work
2. Mother Base reviews
3. Mother Base responds with APPROVE or REVISION
4. If REVISION: Sub-Agent revises work
5. Repeat until approval or max exchanges

**Code Location:** `packages/core/src/AkhAISystem.ts::executeSubAgentFlow()`

---

## 🔧 Model Alignment System

**Purpose:** Ensure proper diversity and consistency across the system

### Alignment Rules

1. **Mother Base Independence**
   - Can be any of 10 families
   - User-configurable at system initialization

2. **Advisor Diversity**
   - Slots 1-2: Must differ from Mother Base
   - Slot 3: Always OpenRouter (fixed)
   - Slot 4: Always same as Mother Base (redactor)

3. **Sub-Agent Consistency**
   - All sub-agents use Mother Base family
   - Ensures consistent execution style

### Implementation

**Code Location:** `packages/core/src/models/ModelAlignment.ts`

```typescript
export class ModelAlignmentManager {
  constructor(motherBaseFamily: ModelFamily) {
    this.primaryFamily = motherBaseFamily;
  }

  getAdvisorLayerConfig(slot1: ModelFamily, slot2: ModelFamily): ResolvedAdvisorLayer {
    // Validate slots 1-2 differ from Mother Base
    if (slot1 === this.primaryFamily || slot2 === this.primaryFamily) {
      throw new Error('Brainstormer slots must differ from Mother Base');
    }

    return {
      slot1: { family: slot1, role: 'brainstormer', isAlignedWithMotherBase: false },
      slot2: { family: slot2, role: 'brainstormer', isAlignedWithMotherBase: false },
      slot3: { family: 'openrouter', role: 'brainstormer', isAlignedWithMotherBase: false },
      slot4: { family: this.primaryFamily, role: 'redactor', isAlignedWithMotherBase: true }
    };
  }
}
```

---

## 🤖 Model Provider System

**Purpose:** Abstract away provider-specific implementation details

### Supported Providers

| Provider | Base URL | Auth | Models |
|----------|----------|------|--------|
| Anthropic | api.anthropic.com | API Key | Claude Sonnet 4, Haiku |
| OpenAI | api.openai.com | API Key | GPT-4o, GPT-4o-mini |
| DeepSeek | api.deepseek.com | API Key | deepseek-chat, deepseek-reasoner |
| Qwen | dashscope.aliyuncs.com | API Key | qwen-plus, qwen-turbo |
| Google | generativelanguage.googleapis.com | API Key | Gemini 1.5 Pro, Flash |
| Mistral | api.mistral.ai | API Key | Large, Medium, Small |
| OpenRouter | openrouter.ai/api/v1 | API Key | Multi-provider access |
| Ollama | localhost:11434 | None | Local models |
| Groq | api.groq.com | API Key | Llama, Mixtral |
| xAI | api.x.ai | API Key | Grok |

### Provider Factory

**Code Location:** `packages/core/src/models/ModelProviderFactory.ts`

```typescript
export class ModelProviderFactory {
  private apiKeys: Map<ModelFamily, string> = new Map();

  createProvider(config: ModelConfig): IModelProvider {
    const providerConfig = PROVIDER_CONFIGS[config.family];
    const apiKey = config.apiKey || this.apiKeys.get(config.family);

    if (providerConfig.requiresApiKey && !apiKey) {
      throw new Error(`API key required for ${config.family}`);
    }

    return new ModelProvider(config.family, config.model, apiKey, ...);
  }
}
```

### Current Implementation

**Status:** Mock implementations (Phase 0)
**Next:** Real API implementations (Phase 1)

All providers currently return mock responses to enable testing of:
- Consensus mechanism
- Flow A and Flow B logic
- MCP tool integration
- Type safety

---

## 📡 MCP Integration

**Purpose:** Expose AkhAI via Model Context Protocol for Claude Code integration

### MCP Server Structure

```
packages/mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point
│   └── tools/
│       ├── query.ts          # akhai.query implementation
│       ├── status.ts         # akhai.status implementation
│       └── agents.ts         # akhai.agents implementation
└── dist/                     # Compiled output
```

### MCP Tools

#### 1. akhai.query

**Purpose:** Execute queries using Flow A or Flow B

**Parameters:**
```typescript
{
  query: string;              // Required
  flow?: 'A' | 'B';          // Default: 'A'
  agentName?: string;         // Required for Flow B
  motherBase?: string;        // Default: 'anthropic'
  advisorSlot1?: string;      // Default: 'deepseek'
  advisorSlot2?: string;      // Default: 'qwen'
}
```

**Implementation:**
- Singleton AkhAI instance (reused across calls)
- Auto-loads API keys from environment variables
- Formats results as markdown

#### 2. akhai.status

**Purpose:** Get system status and configuration

**Returns:**
- System architecture diagram
- List of 10 supported providers
- API key configuration status
- Default settings
- Usage examples

#### 3. akhai.agents

**Purpose:** Manage sub-agents

**Actions:**
- `list`: Show all registered agents
- `register`: Add new agent

**Default Agents:**
- CodingAgent
- ResearchAgent
- AnalysisAgent

---

## 🗄️ Data Flow

### Type System

**Location:** `packages/core/src/models/types.ts`

**Core Types:**
```typescript
// Model Provider Types
ModelFamily, ModelConfig, ProviderConfig
CompletionRequest, CompletionResponse

// Advisor Layer Types
AdvisorRole, AdvisorSlotInfo, ResolvedAdvisorLayer

// Consensus Types
ConsensusRound, ConsensusResult

// Flow Types
FlowAResult, FlowBResult
```

### Request/Response Flow

```
MCP Tool Call
    ↓
Tool Handler (packages/mcp-server/src/tools/*.ts)
    ↓
AkhAISystem (packages/core/src/AkhAISystem.ts)
    ↓
├─ Flow A: executeMotherBaseFlow()
│   ├─ executeInternalConsensus()
│   ├─ redact()
│   └─ askMotherBase()
│
└─ Flow B: executeSubAgentFlow()
    ├─ Phase 1: executeInternalConsensus() + redact() + agentProvider.complete()
    └─ Phase 2: askMotherBase()
    ↓
Provider Factory (packages/core/src/models/ModelProviderFactory.ts)
    ↓
Model Provider (IModelProvider)
    ↓
AI Provider API (Anthropic, OpenAI, etc.)
```

---

## 🔒 Security Considerations

### API Key Management

- API keys stored as environment variables
- Never committed to version control
- Passed to MCP server via environment
- Not logged or exposed in responses

### Input Validation

- Query length limits
- Agent name validation (alphanumeric + underscore)
- Model family validation
- Flow type validation ('A' or 'B')

### Rate Limiting

**Current:** None (Phase 0)
**Future (Phase 1):**
- Per-provider rate limits
- Per-user rate limits
- Cost limits per query
- Daily/monthly quotas

---

## 📊 Performance Considerations

### Current Performance (Phase 0)

- **Mock Responses:** 50-200ms delay per provider call
- **Consensus:** ~1-2 seconds (3 providers × 3 rounds max)
- **Flow A:** ~5-10 seconds (3 exchanges max)
- **Flow B:** ~10-15 seconds (2 phases, 3 exchanges each)

### Optimization Strategies (Phase 1)

1. **Parallel Requests**
   - Call all 3 brainstormers in parallel
   - Reduce round time from 600ms to 200ms

2. **Caching**
   - Cache consensus results for identical queries
   - Cache provider responses (TTL: 1 hour)
   - Reduce redundant API calls

3. **Smart Routing**
   - Route to fastest provider first
   - Fall back to slower providers if needed
   - Track provider response times

4. **Request Batching**
   - Batch multiple queries to same provider
   - Reduce API overhead
   - Optimize token usage

---

## 🧪 Testing Strategy

### Current State (Phase 0)

- **Unit Tests:** None yet
- **Integration Tests:** None yet
- **E2E Tests:** None yet
- **Manual Testing:** Via MCP tools

### Future Testing (Phase 1)

1. **Unit Tests**
   - Model alignment logic
   - Provider factory
   - Consensus algorithm
   - Flow logic

2. **Integration Tests**
   - Real API calls (with test keys)
   - End-to-end flows
   - Error handling
   - Edge cases

3. **E2E Tests**
   - MCP tool calls
   - Full consensus processes
   - Multi-provider scenarios
   - Performance benchmarks

---

## 📦 Build System

### TypeScript Configuration

**Compiler Options:**
- Target: ES2022
- Module: NodeNext
- Strict: true
- Declaration: true (generates .d.ts files)
- Source Maps: true

**Project References:**
- `mcp-server` references `core`
- Enables incremental builds
- Type-safe cross-package imports

### Build Process

```bash
# Install dependencies
pnpm install

# Build core package
cd packages/core && pnpm build

# Build MCP server (requires core built first)
cd packages/mcp-server && pnpm build
```

**Output:**
- `packages/core/dist/` (148K)
- `packages/mcp-server/dist/` (96K)
- Total: 244K compiled JavaScript + type definitions

---

## 🔮 Future Architecture

### Phase 1: Real API Implementations

- Replace mock providers with real HTTP clients
- Add retry logic and error handling
- Implement token tracking
- Add response streaming

### Phase 2: Web Interface

- Add REST API layer
- Implement WebSocket for real-time updates
- Add database layer (PostgreSQL)
- Session management

### Phase 3: Desktop App

- Electron wrapper
- Local SQLite database
- File system integration
- IPC communication

### Phase 4: Marketplace

- Multi-tenant architecture
- Agent storage (S3/similar)
- Payment processing (Stripe)
- Search and recommendation engine

---

**Last Updated:** December 2025
**Version:** 1.0
**Status:** Phase 0 Architecture (Complete)
