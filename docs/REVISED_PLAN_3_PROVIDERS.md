# 🎯 AkhAI Revised Plan - 3 Provider Focus

**Simplified Implementation** - Anthropic Claude, DeepSeek, OpenRouter

**Status:** Phase 0 Complete ✅ | Phase 1 Starting Now

---

## 🎨 Simplified Architecture

### Provider Configuration

**3 Providers Only:**
1. **Anthropic Claude** - Primary provider (Mother Base, Redactor, Sub-Agents)
2. **DeepSeek** - Cost-effective reasoning (Advisor Slot 1)
3. **OpenRouter** - Multi-model access (Advisor Slot 3, fixed)

**Removed (for now):**
- ~~Qwen~~ - Removed
- ~~OpenAI~~ - Optional (can add later)
- ~~Google Gemini~~ - Optional
- ~~Mistral~~ - Optional
- ~~Ollama~~ - Optional
- ~~Groq~~ - Optional
- ~~xAI~~ - Optional

---

## 🏗️ System Configuration

### Default Setup

```
Mother Base: Anthropic Claude Sonnet 4
     │
     ▼
Advisor Layer (3 AIs):
├── Slot 1: DeepSeek (Technical Brainstormer)
├── Slot 2: DeepSeek (Strategic Brainstormer) *same provider, different prompt*
├── Slot 3: OpenRouter (Diversity Brainstormer - FIXED)
└── Slot 4: Anthropic Claude (Redactor - aligned with Mother Base)
     │
     ▼
Sub-Agents: Anthropic Claude (all agents use Mother Base family)
```

**Why This Works:**
- **Anthropic Claude:** Best-in-class reasoning for Mother Base decisions
- **DeepSeek:** Cost-effective for brainstorming (can use same provider for slots 1-2 with different system prompts)
- **OpenRouter:** Access to multiple models through one API (diversity guaranteed)

---

## 📋 Phase 1: Real API Implementation (4-6 weeks)

**Goal:** Replace mock providers with real HTTP clients for 3 providers

### Week 1-2: Anthropic Claude Implementation

#### Task 1.1: Anthropic API Client
**Files to create/modify:**
- `packages/core/src/providers/AnthropicProvider.ts`

**Implementation:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements IModelProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      messages: [
        { role: 'user', content: request.prompt }
      ]
    });

    return {
      content: message.content[0].type === 'text'
        ? message.content[0].text
        : '',
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens
      },
      model: this.model,
      finishReason: message.stop_reason
    };
  }
}
```

**Dependencies:**
```bash
cd packages/core
pnpm add @anthropic-ai/sdk
```

**Testing checklist:**
- [ ] API key validation
- [ ] Message creation successful
- [ ] Token usage tracked
- [ ] Error handling for rate limits
- [ ] Retry logic (3 attempts with exponential backoff)

---

#### Task 1.2: DeepSeek API Client
**Files to create/modify:**
- `packages/core/src/providers/DeepSeekProvider.ts`

**Implementation:**
```typescript
import OpenAI from 'openai'; // DeepSeek uses OpenAI-compatible API

export class DeepSeekProvider implements IModelProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'deepseek-chat') {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com'
    });
    this.model = model;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'user', content: request.prompt }
      ],
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      usage: {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      },
      model: this.model,
      finishReason: completion.choices[0]?.finish_reason || 'stop'
    };
  }
}
```

**Dependencies:**
```bash
cd packages/core
pnpm add openai
```

**Testing checklist:**
- [ ] API key validation
- [ ] Chat completion successful
- [ ] Token usage tracked
- [ ] Error handling for rate limits
- [ ] Retry logic

---

#### Task 1.3: OpenRouter API Client
**Files to create/modify:**
- `packages/core/src/providers/OpenRouterProvider.ts`

**Implementation:**
```typescript
import OpenAI from 'openai'; // OpenRouter uses OpenAI-compatible API

export class OpenRouterProvider implements IModelProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'anthropic/claude-3.5-sonnet') {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://akhai.ai', // Optional
        'X-Title': 'AkhAI' // Optional
      }
    });
    this.model = model;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'user', content: request.prompt }
      ],
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      usage: {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      },
      model: this.model,
      finishReason: completion.choices[0]?.finish_reason || 'stop'
    };
  }
}
```

**Testing checklist:**
- [ ] API key validation
- [ ] Chat completion successful
- [ ] Token usage tracked
- [ ] Multiple model support (can route to different providers)
- [ ] Error handling

---

### Week 3: Provider Factory Update

#### Task 1.4: Update ModelProviderFactory
**File:** `packages/core/src/models/ModelProviderFactory.ts`

**Changes:**
```typescript
import { AnthropicProvider } from '../providers/AnthropicProvider.js';
import { DeepSeekProvider } from '../providers/DeepSeekProvider.js';
import { OpenRouterProvider } from '../providers/OpenRouterProvider.js';

export class ModelProviderFactory {
  createProvider(config: ModelConfig): IModelProvider {
    const apiKey = config.apiKey || this.apiKeys.get(config.family);

    if (!apiKey) {
      throw new Error(`API key required for ${config.family}`);
    }

    switch (config.family) {
      case 'anthropic':
        return new AnthropicProvider(
          apiKey,
          config.model || 'claude-sonnet-4-20250514'
        );

      case 'deepseek':
        return new DeepSeekProvider(
          apiKey,
          config.model || 'deepseek-chat'
        );

      case 'openrouter':
        return new OpenRouterProvider(
          apiKey,
          config.model || 'anthropic/claude-3.5-sonnet'
        );

      default:
        throw new Error(`Unsupported provider: ${config.family}`);
    }
  }
}
```

**Remove:**
- All mock implementations
- Unused provider cases (openai, google, qwen, mistral, ollama, groq, xai)

---

### Week 4: Error Handling & Retry Logic

#### Task 1.5: Create Base Provider Class
**File:** `packages/core/src/providers/BaseProvider.ts`

**Implementation:**
```typescript
export abstract class BaseProvider implements IModelProvider {
  protected abstract callAPI(request: CompletionRequest): Promise<CompletionResponse>;

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.callAPI(request);
      } catch (error) {
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === maxRetries;

        if (!isRetryable || isLastAttempt) {
          throw this.formatError(error);
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  private isRetryableError(error: any): boolean {
    // Rate limit errors (429)
    if (error.status === 429) return true;

    // Server errors (5xx)
    if (error.status >= 500) return true;

    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;

    return false;
  }

  private formatError(error: any): Error {
    if (error instanceof Error) return error;
    return new Error(`Provider error: ${JSON.stringify(error)}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Update all providers to extend BaseProvider:**
```typescript
export class AnthropicProvider extends BaseProvider {
  protected async callAPI(request: CompletionRequest): Promise<CompletionResponse> {
    // Actual API call here
  }
}
```

---

### Week 5: Token Tracking & Cost Calculation

#### Task 1.6: Cost Tracking System
**File:** `packages/core/src/tracking/CostTracker.ts`

**Implementation:**
```typescript
// Pricing per 1M tokens (as of Dec 2025)
const PRICING = {
  anthropic: {
    'claude-sonnet-4-20250514': {
      input: 3.00,  // $3 per 1M input tokens
      output: 15.00 // $15 per 1M output tokens
    },
    'claude-3-5-haiku-20241022': {
      input: 1.00,
      output: 5.00
    }
  },
  deepseek: {
    'deepseek-chat': {
      input: 0.14,  // $0.14 per 1M input tokens
      output: 0.28  // $0.28 per 1M output tokens
    },
    'deepseek-reasoner': {
      input: 0.55,
      output: 2.19
    }
  },
  openrouter: {
    // OpenRouter varies by model, use average
    'anthropic/claude-3.5-sonnet': {
      input: 3.00,
      output: 15.00
    }
  }
};

export class CostTracker {
  calculateCost(
    family: ModelFamily,
    model: string,
    usage: TokenUsage
  ): number {
    const pricing = PRICING[family]?.[model];
    if (!pricing) {
      console.warn(`No pricing data for ${family}/${model}`);
      return 0;
    }

    const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  formatCost(cost: number): string {
    if (cost < 0.01) return `$${(cost * 100).toFixed(4)}¢`;
    return `$${cost.toFixed(4)}`;
  }
}
```

**Update CompletionResponse type:**
```typescript
export interface CompletionResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  finishReason?: string;
  cost?: number; // Add cost tracking
  timestamp?: number; // Add timestamp
}
```

---

### Week 6: Integration Testing

#### Task 1.7: End-to-End Tests
**File:** `packages/core/tests/integration.test.ts`

**Test scenarios:**
```typescript
describe('AkhAI Integration Tests', () => {
  test('Flow A with real APIs', async () => {
    const akhai = createAkhAI('anthropic');
    akhai.setApiKeys({
      anthropic: process.env.ANTHROPIC_API_KEY!,
      deepseek: process.env.DEEPSEEK_API_KEY!,
      openrouter: process.env.OPENROUTER_API_KEY!
    });

    akhai.setupMotherBase();
    akhai.setupAdvisorLayer('deepseek', 'deepseek'); // Both slots use DeepSeek

    const result = await akhai.executeMotherBaseFlow(
      'What is the best database for real-time applications?'
    );

    expect(result.approvedAt).not.toBeNull();
    expect(result.finalDecision).toBeTruthy();
    expect(result.layerConsensus.totalRounds).toBeLessThanOrEqual(3);
  });

  test('Flow B with CodingAgent', async () => {
    const akhai = createAkhAI('anthropic');
    // ... setup
    akhai.registerSubAgent('CodingAgent');

    const result = await akhai.executeSubAgentFlow(
      'Create a TypeScript function to validate email addresses',
      'CodingAgent'
    );

    expect(result.motherBaseApproval.approvedAt).not.toBeNull();
    expect(result.finalOutput).toContain('function');
  });

  test('Cost tracking', async () => {
    const akhai = createAkhAI('anthropic');
    // ... run query
    const result = await akhai.executeMotherBaseFlow('Test query');

    // Check that cost was calculated
    expect(result.totalCost).toBeGreaterThan(0);
    expect(result.totalTokens).toBeGreaterThan(0);
  });

  test('Error handling - invalid API key', async () => {
    const akhai = createAkhAI('anthropic');
    akhai.setApiKeys({
      anthropic: 'invalid-key',
      deepseek: 'invalid-key',
      openrouter: 'invalid-key'
    });

    await expect(
      akhai.executeMotherBaseFlow('Test')
    ).rejects.toThrow();
  });

  test('Retry logic on rate limit', async () => {
    // Test that retry logic works (mock rate limit response)
  });
});
```

**Run tests:**
```bash
cd packages/core
pnpm add -D jest @types/jest ts-jest
pnpm test
```

---

## 📊 Phase 1 Deliverables

**By end of Phase 1 (6 weeks):**

✅ **Real API Implementations:**
- Anthropic Claude client (Messages API)
- DeepSeek client (OpenAI-compatible)
- OpenRouter client (OpenAI-compatible)

✅ **Error Handling:**
- Retry logic (3 attempts, exponential backoff)
- Rate limit handling
- Network error recovery
- User-friendly error messages

✅ **Token Tracking:**
- Input/output tokens tracked per request
- Cost calculation per query
- Total cost per flow (A or B)

✅ **Testing:**
- Integration tests for Flow A & B
- Error handling tests
- Cost tracking validation
- 80%+ code coverage

✅ **Performance:**
- Average response time < 10s
- Success rate > 95%
- Proper timeout handling (30s max per request)

---

## 🌐 Phase 2: Web Interface (8-10 weeks)

**Goal:** Build beautiful search engine UI with live consensus visualization

### Week 1-2: Project Setup

#### Task 2.1: Next.js Project Initialization
**Location:** `packages/web/`

```bash
cd packages/web
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir
pnpm add @akhai/core
```

**Tech Stack:**
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State:** Zustand
- **Real-time:** Server-Sent Events (SSE)

**Project Structure:**
```
packages/web/
├── app/
│   ├── page.tsx                 # Homepage (search interface)
│   ├── query/[id]/page.tsx      # Query results page
│   ├── dashboard/page.tsx       # User dashboard
│   ├── settings/page.tsx        # Settings page
│   └── api/
│       ├── query/route.ts       # POST /api/query
│       └── stream/route.ts      # GET /api/stream (SSE)
├── components/
│   ├── SearchBar.tsx
│   ├── VerificationWindow.tsx   # Live consensus visualization
│   ├── AnswerDisplay.tsx
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── akhai.ts                 # AkhAI client wrapper
│   └── stores/                  # Zustand stores
└── public/
```

---

### Week 3-4: Core UI Components

#### Task 2.2: Search Interface
**File:** `app/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';

export default function HomePage() {
  const router = useRouter();
  const [flow, setFlow] = useState<'A' | 'B'>('A');

  const handleSearch = async (query: string) => {
    const response = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, flow })
    });

    const { queryId } = await response.json();
    router.push(`/query/${queryId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-4">🧠 AkhAI</h1>
        <p className="text-xl text-gray-600">Super Research Engine</p>
      </div>

      <SearchBar onSearch={handleSearch} />

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => setFlow('A')}
          className={`px-4 py-2 rounded-lg ${
            flow === 'A'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600'
          }`}
        >
          Strategic Decision
        </button>
        <button
          onClick={() => setFlow('B')}
          className={`px-4 py-2 rounded-lg ${
            flow === 'B'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600'
          }`}
        >
          Task Execution
        </button>
      </div>
    </div>
  );
}
```

#### Task 2.3: Verification Window Component
**File:** `components/VerificationWindow.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';

interface VerificationWindowProps {
  queryId: string;
}

export function VerificationWindow({ queryId }: VerificationWindowProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState<'running' | 'complete'>('running');

  useEffect(() => {
    const eventSource = new EventSource(`/api/stream?queryId=${queryId}`);

    eventSource.addEventListener('consensus-round', (e) => {
      const data = JSON.parse(e.data);
      setEvents(prev => [...prev, { type: 'consensus', data }]);
    });

    eventSource.addEventListener('redactor-synthesis', (e) => {
      const data = JSON.parse(e.data);
      setEvents(prev => [...prev, { type: 'redactor', data }]);
    });

    eventSource.addEventListener('mother-base-review', (e) => {
      const data = JSON.parse(e.data);
      setEvents(prev => [...prev, { type: 'motherbase', data }]);
    });

    eventSource.addEventListener('complete', (e) => {
      setStatus('complete');
      eventSource.close();
    });

    return () => eventSource.close();
  }, [queryId]);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {status === 'running' ? '🔴 LIVE' : '✅ Complete'}
        </h3>
      </div>

      <div className="space-y-3">
        {events.map((event, i) => (
          <EventCard key={i} event={event} />
        ))}
      </div>
    </div>
  );
}
```

---

### Week 5-6: Backend API

#### Task 2.4: Query API Endpoint
**File:** `app/api/query/route.ts`

```typescript
import { createAkhAI } from '@akhai/core';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory store (use Redis in production)
const queryStore = new Map();

export async function POST(request: NextRequest) {
  const { query, flow = 'A', agentName } = await request.json();

  const queryId = uuidv4();

  // Store query metadata
  queryStore.set(queryId, {
    query,
    flow,
    agentName,
    status: 'pending',
    events: []
  });

  // Execute query in background
  executeQuery(queryId, query, flow, agentName);

  return NextResponse.json({ queryId });
}

async function executeQuery(
  queryId: string,
  query: string,
  flow: 'A' | 'B',
  agentName?: string
) {
  const akhai = createAkhAI('anthropic');

  akhai.setApiKeys({
    anthropic: process.env.ANTHROPIC_API_KEY!,
    deepseek: process.env.DEEPSEEK_API_KEY!,
    openrouter: process.env.OPENROUTER_API_KEY!
  });

  akhai.setupMotherBase();
  akhai.setupAdvisorLayer('deepseek', 'deepseek');

  try {
    if (flow === 'A') {
      const result = await akhai.executeMotherBaseFlow(query);
      updateQueryStore(queryId, { status: 'complete', result });
    } else {
      akhai.registerSubAgent(agentName!);
      const result = await akhai.executeSubAgentFlow(query, agentName!);
      updateQueryStore(queryId, { status: 'complete', result });
    }
  } catch (error) {
    updateQueryStore(queryId, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function updateQueryStore(queryId: string, update: any) {
  const current = queryStore.get(queryId);
  queryStore.set(queryId, { ...current, ...update });
}
```

#### Task 2.5: SSE Stream Endpoint
**File:** `app/api/stream/route.ts`

```typescript
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const queryId = request.nextUrl.searchParams.get('queryId');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Poll queryStore for events and stream them
      const interval = setInterval(() => {
        const query = queryStore.get(queryId);

        if (!query) {
          controller.close();
          clearInterval(interval);
          return;
        }

        // Stream new events
        query.events.forEach((event: any) => {
          const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        });

        if (query.status === 'complete' || query.status === 'error') {
          const message = `event: complete\ndata: ${JSON.stringify(query.result)}\n\n`;
          controller.enqueue(encoder.encode(message));
          controller.close();
          clearInterval(interval);
        }
      }, 500);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

---

### Week 7-8: Dashboard & Settings

#### Task 2.6: User Dashboard
**File:** `app/dashboard/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    queriesThisMonth: 0,
    totalCost: 0,
    recentQueries: []
  });

  useEffect(() => {
    // Fetch user stats from API
    fetch('/api/stats').then(r => r.json()).then(setStats);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Usage This Month"
          value={`${stats.queriesThisMonth} queries`}
          percentage={69}
        />
        <StatCard
          title="Costs"
          value={`$${stats.totalCost.toFixed(2)}`}
          percentage={43}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Queries</h2>
        <QueryList queries={stats.recentQueries} />
      </div>
    </div>
  );
}
```

#### Task 2.7: Settings Page
**File:** `app/settings/page.tsx`

```tsx
'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState({
    anthropic: '',
    deepseek: '',
    openrouter: ''
  });

  const handleSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ apiKeys })
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">🔑 API Keys</h2>

        <div className="space-y-4">
          <APIKeyInput
            label="Anthropic API Key"
            value={apiKeys.anthropic}
            onChange={(v) => setApiKeys({...apiKeys, anthropic: v})}
          />
          <APIKeyInput
            label="DeepSeek API Key"
            value={apiKeys.deepseek}
            onChange={(v) => setApiKeys({...apiKeys, deepseek: v})}
          />
          <APIKeyInput
            label="OpenRouter API Key"
            value={apiKeys.openrouter}
            onChange={(v) => setApiKeys({...apiKeys, openrouter: v})}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Save Changes
      </button>
    </div>
  );
}
```

---

### Week 9-10: Polish & Deploy

#### Task 2.8: Final Polish
- [ ] Add loading skeletons
- [ ] Implement dark mode
- [ ] Add animations (Framer Motion)
- [ ] Optimize bundle size
- [ ] Add error boundaries
- [ ] Implement toast notifications
- [ ] Add keyboard shortcuts

#### Task 2.9: Deployment
**Platform:** Vercel

```bash
cd packages/web
vercel --prod
```

**Environment Variables (Vercel):**
```
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://akhai.vercel.app
```

---

## 📊 Phase 2 Deliverables

**By end of Phase 2 (10 weeks):**

✅ **Web Interface:**
- Clean search engine homepage
- Real-time verification window (SSE)
- Answer display with markdown support
- Dashboard with usage stats
- Settings page for API keys

✅ **Real-time Features:**
- Live consensus visualization
- Server-Sent Events streaming
- Progress indicators
- Status updates

✅ **User Features:**
- Query history
- Cost tracking
- Export results
- Share links

✅ **Performance:**
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Mobile responsive
- 90+ Lighthouse score

---

## 🚀 Quick Start Commands

### Phase 1 (Current)

```bash
# Setup
cd packages/core
pnpm install
pnpm add @anthropic-ai/sdk openai

# Create .env
cat > .env << EOF
ANTHROPIC_API_KEY=sk-ant-your-key
DEEPSEEK_API_KEY=sk-your-key
OPENROUTER_API_KEY=sk-or-your-key
EOF

# Build
pnpm build

# Test
pnpm test
```

### Phase 2 (Web)

```bash
# Setup
cd packages/web
pnpm create next-app@latest . --typescript --tailwind --app
pnpm add @akhai/core zustand uuid

# Run dev
pnpm dev

# Deploy
vercel --prod
```

---

## 💰 Estimated Costs (3 Providers)

### Development (Testing)
- **Anthropic Claude:** ~$5-10/day (testing)
- **DeepSeek:** ~$1-2/day (testing)
- **OpenRouter:** ~$3-5/day (testing)
- **Total:** ~$10-20/day during development

### Production (per 1000 queries)
- **Consensus rounds:** 3 brainstormers × 3 rounds × 1000 queries = 9,000 calls
- **Redactor:** 1 × 3 rounds × 1000 queries = 3,000 calls
- **Mother Base:** 1-2 calls × 1000 queries = 1,500 calls
- **Total calls:** ~13,500 API calls

**Cost estimate per 1000 queries:**
- DeepSeek (9,000 calls): $1.26
- Claude (4,500 calls): $13.50
- **Total:** ~$15/1000 queries = **$0.015 per query**

---

## 📅 Timeline Summary

| Phase | Duration | Target | Status |
|-------|----------|--------|--------|
| **Phase 0** | 2 days | Dec 2025 | ✅ Complete |
| **Phase 1** | 6 weeks | Jan-Feb 2026 | 🔨 Starting |
| **Phase 2** | 10 weeks | Mar-May 2026 | 📋 Planned |
| **Phase 3** | 12 weeks | Jun-Aug 2026 | 💭 Future |
| **Phase 4** | 16 weeks | Sep-Dec 2026 | 💭 Future |

---

## ✅ Success Metrics

### Phase 1
- ✅ All 3 providers working
- ✅ < 10s average response time
- ✅ 95%+ success rate
- ✅ < $0.02 per query

### Phase 2
- 🎯 100+ beta users
- 🎯 1,000+ queries processed
- 🎯 4.5+ user rating
- 🎯 < 3s page load time

---

**Last Updated:** December 2025
**Version:** 2.0 (Revised - 3 Providers)
**Focus:** Anthropic Claude + DeepSeek + OpenRouter

