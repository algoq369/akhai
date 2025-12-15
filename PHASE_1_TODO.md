# ✅ Phase 1 Implementation Checklist

**Goal:** Real API implementations for 3 providers (Anthropic, DeepSeek, OpenRouter)

**Timeline:** 6 weeks (Jan-Feb 2026)

---

## Week 1-2: Anthropic Claude Implementation

### Task 1.1: Anthropic Provider
- [ ] Install `@anthropic-ai/sdk` dependency
- [ ] Create `packages/core/src/providers/AnthropicProvider.ts`
- [ ] Implement `complete()` method using Messages API
- [ ] Add token usage tracking
- [ ] Test with real API key
- [ ] Verify error handling
- [ ] Document usage examples

**Files:**
- `packages/core/src/providers/AnthropicProvider.ts` (new)
- `packages/core/package.json` (update dependencies)

**Testing:**
```bash
# Manual test
cd packages/core
node -e "
  const { AnthropicProvider } = require('./dist/providers/AnthropicProvider.js');
  const provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
  provider.complete({ prompt: 'Hello!' }).then(console.log);
"
```

---

### Task 1.2: DeepSeek Provider
- [ ] Install `openai` dependency (DeepSeek uses OpenAI-compatible API)
- [ ] Create `packages/core/src/providers/DeepSeekProvider.ts`
- [ ] Implement `complete()` method with base URL `https://api.deepseek.com`
- [ ] Add token usage tracking
- [ ] Test with real API key
- [ ] Verify error handling
- [ ] Document usage examples

**Files:**
- `packages/core/src/providers/DeepSeekProvider.ts` (new)
- `packages/core/package.json` (update dependencies)

**Testing:**
```bash
# Manual test
cd packages/core
node -e "
  const { DeepSeekProvider } = require('./dist/providers/DeepSeekProvider.js');
  const provider = new DeepSeekProvider(process.env.DEEPSEEK_API_KEY);
  provider.complete({ prompt: 'Hello!' }).then(console.log);
"
```

---

### Task 1.3: OpenRouter Provider
- [ ] Create `packages/core/src/providers/OpenRouterProvider.ts`
- [ ] Implement `complete()` method with base URL `https://openrouter.ai/api/v1`
- [ ] Add OpenRouter-specific headers (HTTP-Referer, X-Title)
- [ ] Add token usage tracking
- [ ] Test with real API key
- [ ] Test multi-model routing (can use different models)
- [ ] Document usage examples

**Files:**
- `packages/core/src/providers/OpenRouterProvider.ts` (new)

**Testing:**
```bash
# Manual test
cd packages/core
node -e "
  const { OpenRouterProvider } = require('./dist/providers/OpenRouterProvider.js');
  const provider = new OpenRouterProvider(process.env.OPENROUTER_API_KEY);
  provider.complete({ prompt: 'Hello!' }).then(console.log);
"
```

---

## Week 3: Provider Factory Update

### Task 1.4: Update ModelProviderFactory
- [ ] Remove mock implementations from `ModelProviderFactory.ts`
- [ ] Add imports for real providers (Anthropic, DeepSeek, OpenRouter)
- [ ] Update `createProvider()` switch statement
- [ ] Remove unused provider cases (qwen, openai, google, mistral, ollama, groq, xai)
- [ ] Update type definitions to only include 3 providers
- [ ] Test factory creates correct provider instances

**Files:**
- `packages/core/src/models/ModelProviderFactory.ts` (update)
- `packages/core/src/models/types.ts` (update - remove unused families)

**Changes to types.ts:**
```typescript
// Before (10 providers):
export type ModelFamily = 'anthropic' | 'openai' | 'deepseek' | 'qwen' | 'google' | 'mistral' | 'openrouter' | 'ollama' | 'groq' | 'xai';

// After (3 providers):
export type ModelFamily = 'anthropic' | 'deepseek' | 'openrouter';
```

---

### Task 1.5: Update Model Alignment
- [ ] Update `ModelAlignment.ts` to support DeepSeek in slots 1-2
- [ ] Keep OpenRouter fixed in slot 3
- [ ] Update validation to only check against 3 families
- [ ] Update documentation

**Files:**
- `packages/core/src/models/ModelAlignment.ts` (update)

**Key change:**
```typescript
// Allow DeepSeek in both slots 1 and 2 (same provider, different prompts)
export class ModelAlignmentManager {
  getAdvisorLayerConfig(slot1Family: ModelFamily, slot2Family: ModelFamily): ResolvedAdvisorLayer {
    // Slots 1-2 can both be 'deepseek' (different prompts)
    // OR one can be different from Mother Base
    // Slot 3 is always 'openrouter' (fixed)
    // Slot 4 is always same as Mother Base (redactor)
  }
}
```

---

## Week 4: Error Handling & Retry Logic

### Task 1.6: Base Provider Class
- [ ] Create `packages/core/src/providers/BaseProvider.ts`
- [ ] Implement retry logic (3 attempts, exponential backoff)
- [ ] Add `isRetryableError()` method (429, 5xx, network errors)
- [ ] Add `formatError()` method for consistent error messages
- [ ] Add `sleep()` utility for delays
- [ ] Update all 3 providers to extend `BaseProvider`

**Files:**
- `packages/core/src/providers/BaseProvider.ts` (new)
- `packages/core/src/providers/AnthropicProvider.ts` (update - extend BaseProvider)
- `packages/core/src/providers/DeepSeekProvider.ts` (update - extend BaseProvider)
- `packages/core/src/providers/OpenRouterProvider.ts` (update - extend BaseProvider)

**Testing:**
```bash
# Test retry logic (manually trigger rate limit or server error)
# Should see retries with delays: 1s, 2s, 4s
```

---

### Task 1.7: Error Message Improvements
- [ ] Add user-friendly error messages
- [ ] Include provider name in errors
- [ ] Add suggestions for common errors (invalid API key, rate limit, etc.)
- [ ] Log errors with context (request ID, timestamp, model)

**Example error messages:**
```
❌ Anthropic API Error: Invalid API key. Please check your ANTHROPIC_API_KEY.
❌ DeepSeek Rate Limit: Too many requests. Retrying in 2 seconds...
❌ OpenRouter Network Error: Connection timeout. Retrying in 4 seconds...
```

---

## Week 5: Token Tracking & Cost Calculation

### Task 1.8: Cost Tracker
- [ ] Create `packages/core/src/tracking/CostTracker.ts`
- [ ] Add pricing data for all 3 providers (per 1M tokens)
- [ ] Implement `calculateCost()` method
- [ ] Implement `formatCost()` method (display in dollars/cents)
- [ ] Add cost to `CompletionResponse` type

**Files:**
- `packages/core/src/tracking/CostTracker.ts` (new)
- `packages/core/src/models/types.ts` (update - add `cost` field)

**Pricing (as of Dec 2025):**
```typescript
const PRICING = {
  anthropic: {
    'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 1.00, output: 5.00 }
  },
  deepseek: {
    'deepseek-chat': { input: 0.14, output: 0.28 },
    'deepseek-reasoner': { input: 0.55, output: 2.19 }
  },
  openrouter: {
    'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 }
  }
};
```

---

### Task 1.9: Flow-Level Cost Tracking
- [ ] Add cost aggregation to Flow A result
- [ ] Add cost aggregation to Flow B result
- [ ] Track total tokens per flow
- [ ] Add cost breakdown by provider
- [ ] Display cost in final output

**Update types:**
```typescript
export interface FlowAResult {
  // ... existing fields
  totalCost?: number;        // Total cost in dollars
  totalTokens?: number;      // Total tokens used
  costBreakdown?: {          // Cost per provider
    deepseek: number;
    anthropic: number;
    openrouter: number;
  };
}
```

---

## Week 6: Integration Testing

### Task 1.10: Test Suite Setup
- [ ] Install Jest and ts-jest
- [ ] Configure Jest for TypeScript
- [ ] Create test directory structure
- [ ] Add test scripts to package.json

**Files:**
- `packages/core/jest.config.js` (new)
- `packages/core/tests/` (new directory)
- `packages/core/package.json` (update scripts)

**Setup:**
```bash
cd packages/core
pnpm add -D jest @types/jest ts-jest
pnpm exec jest --init
```

---

### Task 1.11: Integration Tests
- [ ] Test Flow A with real APIs
- [ ] Test Flow B with real APIs
- [ ] Test cost tracking accuracy
- [ ] Test error handling (invalid API keys)
- [ ] Test retry logic (rate limits)
- [ ] Test token usage tracking
- [ ] Aim for 80%+ code coverage

**Files:**
- `packages/core/tests/integration.test.ts` (new)
- `packages/core/tests/providers.test.ts` (new)
- `packages/core/tests/cost.test.ts` (new)

**Run tests:**
```bash
cd packages/core
pnpm test
pnpm test:coverage
```

---

### Task 1.12: Performance Testing
- [ ] Measure average response time (target: < 10s)
- [ ] Measure success rate (target: > 95%)
- [ ] Test timeout handling (30s max per request)
- [ ] Test concurrent requests
- [ ] Profile memory usage

**Create performance test:**
```bash
cd packages/core
node performance-test.js
```

---

## Week 6: Documentation & Finalization

### Task 1.13: Update Documentation
- [ ] Update README.md with real API setup instructions
- [ ] Add example code with real API calls
- [ ] Document error handling
- [ ] Add troubleshooting section
- [ ] Update cost estimates

**Files:**
- `README.md` (update)
- `docs/API_REFERENCE.md` (new - detailed API docs)

---

### Task 1.14: Update MCP Server
- [ ] Update MCP server to use real providers
- [ ] Test MCP tools with real APIs
- [ ] Update `.cursor/mcp.json` with only 3 API keys
- [ ] Test in Claude Code CLI

**Files:**
- `packages/mcp-server/src/tools/query.ts` (verify works with real APIs)
- `.cursor/mcp.json` (update - remove unused API keys)

**Test in Claude Code:**
```
Use akhai.status
Use akhai.query with query "What is TypeScript?" and flow "A"
```

---

### Task 1.15: Environment Setup
- [ ] Update `.env.example` to only include 3 providers
- [ ] Create setup script for easy API key configuration
- [ ] Add validation for API keys on startup
- [ ] Document where to get API keys

**Files:**
- `.env.example` (update)
- `scripts/setup.sh` (new - interactive setup wizard)

**Updated .env.example:**
```bash
# Required: Anthropic (Mother Base, Redactor, Sub-Agents)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Required: DeepSeek (Advisor Slots 1-2)
DEEPSEEK_API_KEY=sk-your-key-here

# Required: OpenRouter (Advisor Slot 3 - fixed)
OPENROUTER_API_KEY=sk-or-your-key-here
```

---

## Final Verification Checklist

### Functionality
- [ ] Flow A works end-to-end with real APIs
- [ ] Flow B works end-to-end with real APIs
- [ ] All 3 providers respond correctly
- [ ] Token usage tracked accurately
- [ ] Cost calculation correct
- [ ] Error handling works (retry, timeout, invalid keys)
- [ ] MCP tools work in Claude Code CLI

### Performance
- [ ] Average response time < 10s
- [ ] Success rate > 95%
- [ ] Proper timeout handling (30s max)
- [ ] Memory usage acceptable
- [ ] No memory leaks

### Documentation
- [ ] README updated with real examples
- [ ] API reference created
- [ ] Troubleshooting guide added
- [ ] Cost estimates accurate
- [ ] Setup instructions clear

### Testing
- [ ] All tests pass
- [ ] Code coverage > 80%
- [ ] Integration tests work with real APIs
- [ ] Performance benchmarks meet targets

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No console.log statements in production code
- [ ] Proper error handling everywhere
- [ ] Code follows consistent style
- [ ] All TODOs resolved

---

## Git Workflow

### After each task completion:
```bash
git add .
git commit -m "feat: [task description]

- Implemented [feature]
- Added [tests]
- Updated [docs]

Closes #[issue-number]
"
git push origin main
```

### Create release after Phase 1:
```bash
git tag -a v0.2.0 -m "Phase 1 Complete: Real API Implementations"
git push origin v0.2.0
```

---

## Success Criteria

**Phase 1 is complete when:**
✅ All 3 providers have real API implementations
✅ All tests pass with >80% coverage
✅ Average response time < 10s
✅ Success rate > 95%
✅ Cost tracking accurate
✅ Documentation updated
✅ MCP server works with real APIs
✅ Ready for Phase 2 (Web Interface)

---

**Last Updated:** December 2025
**Phase:** 1 (Real API Implementation)
**Duration:** 6 weeks
**Status:** Ready to Start



---

## 🎯 Project Integration (OneAI Vision)

### Recommended Project-Specific Sub-Agents

| Agent Name | Project | Purpose | MCP Integration |
|------------|---------|---------|-----------------|
| `TradingAgent` | AlgoQbot | Trade analysis, strategy selection, P&L review | SQLite access to trading_bot.db |
| `BusinessAgent` | BroolyKid | Investor research, business plan updates, financial modeling | File access to broolykid-unified |
| `WellnessAgent` | Sempai | PoW validation logic, wellness metrics, blockchain writes | Sempai API integration |
| `CodingAgent` | General | Code generation, debugging, refactoring | All project filesystems |
| `ResearchAgent` | General | Web research, competitor analysis, market trends | Brave Search + Web Fetch |

### Qwen Access via OpenRouter

Instead of removing Qwen entirely, access it through OpenRouter:

```typescript
// In OpenRouterProvider, allow model specification
const qwenViaOpenRouter = await openrouter.complete({
  model: 'qwen/qwen-2.5-72b-instruct',  // Qwen via OpenRouter
  prompt: 'Analyze trading patterns...'
});
```

This maintains compatibility with AlgoQbot's AI Council while keeping only 3 API keys.

### OneAI Integration Points

```
┌────────────────────────────────────────────────────────────┐
│                     AkhAI (Mother Base)                     │
│                    Claude Sonnet 4                          │
└────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  TradingAgent │  │ BusinessAgent│  │ WellnessAgent│
│   (AlgoQbot)  │  │  (BroolyKid) │  │   (Sempai)   │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ - SQLite DB  │  │ - File access│  │ - API calls  │
│ - Price feeds│  │ - Research   │  │ - Blockchain │
│ - Strategies │  │ - Investors  │  │ - Validators │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Future: OneChat Universal Interface

Phase 2 web interface can serve as the unified "OneChat" entry point:
- Single search bar for all projects
- Auto-routing to appropriate sub-agent
- Cross-project context via Memory MCP
- Dashboard showing all project statuses

---

**Integration Status:** Planned for Phase 2
**Dependency:** Phase 1 completion required
