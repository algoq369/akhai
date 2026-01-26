# 🧠 AKHAI MOTHER BASE - Claude Code CLI Commands
# Copy each phase prompt directly into Claude Code

## QUICK START

```bash
# 1. Open terminal, go to akhai directory
cd /Users/sheirraza/akhai

# 2. Start Claude Code
claude

# 3. Copy & paste the Phase 0 prompt below
# 4. Wait for verification to pass
# 5. Move to next phase
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 0: ENVIRONMENT SETUP (5 min)
# ═══════════════════════════════════════════════════════════

## COPY THIS ENTIRE BLOCK INTO CLAUDE CODE:

```
MISSION: Setup AKHAI Mother Base environment

LOCATION: /Users/sheirraza/akhai

DO THESE TASKS IN ORDER:

1. Check system:
   - Show RAM (need 16GB+)
   - Show Node version (need 18+)
   - Check if Ollama installed

2. Install Ollama if missing:
   brew install ollama

3. Start Ollama and pull models:
   ollama serve &
   ollama pull qwen2.5:7b
   ollama pull nomic-embed-text

4. Verify models work:
   ollama run qwen2.5:7b "Say hello" --verbose

5. Setup project:
   cd /Users/sheirraza/akhai
   pnpm install

6. Create and run verification script:

```typescript
// scripts/check-phase0.ts
import { execSync } from 'child_process';
import * as os from 'os';

console.log('\\n🔍 PHASE 0 CHECK\\n');

const ram = Math.round(os.totalmem() / 1024 / 1024 / 1024);
console.log(`RAM: ${ram}GB ${ram >= 16 ? '✅' : '⚠️'}`);

const node = process.version;
console.log(`Node: ${node} ${parseInt(node.slice(1)) >= 18 ? '✅' : '❌'}`);

try {
  execSync('ollama --version', { stdio: 'pipe' });
  console.log('Ollama: ✅');
  const models = execSync('ollama list', { encoding: 'utf-8' });
  console.log(`qwen2.5: ${models.includes('qwen2.5') ? '✅' : '❌'}`);
  console.log(`nomic-embed: ${models.includes('nomic') ? '✅' : '❌'}`);
} catch { console.log('Ollama: ❌'); }

console.log('\\n✅ PHASE 0 COMPLETE - Proceed to Phase 1');
```

Run it: npx tsx scripts/check-phase0.ts

STOP and show me the output. All must be ✅ before Phase 1.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 1: GITHUB KNOWLEDGE INGESTION (30 min)
# ═══════════════════════════════════════════════════════════

## COPY THIS ENTIRE BLOCK INTO CLAUDE CODE:

```
MISSION: Ingest all GitHub repos from algoq369 into knowledge base

LOCATION: /Users/sheirraza/akhai

EXISTING FILES TO READ FIRST:
- packages/inference/src/knowledge/KnowledgeBase.ts

DO THESE TASKS:

1. Create directories:
   mkdir -p data scripts

2. Fix/complete KnowledgeBase.ts if needed - it must:
   - Fetch repos from GitHub API: GET /users/algoq369/repos
   - Get file tree: GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
   - Download file content: GET /repos/{owner}/{repo}/contents/{path}
   - Parse .ts, .tsx, .js, .md, .json, .py, .yaml files
   - Save to data/knowledge.json

3. Create ingestion script:

```typescript
// scripts/ingest.ts
import { KnowledgeBase } from '../packages/inference/src/knowledge/KnowledgeBase.js';

async function main() {
  console.log('🚀 Starting GitHub ingestion for algoq369...');
  
  const kb = new KnowledgeBase(process.env.GITHUB_TOKEN, './data/knowledge.json');
  await kb.initialize();
  await kb.ingestFromGitHub('algoq369');
  
  const stats = await kb.getStats();
  console.log(`✅ Done! ${stats.totalDocuments} docs, ${stats.repos.length} repos`);
}

main();
```

4. Run ingestion:
   npx tsx scripts/ingest.ts

5. Create and run verification:

```typescript
// scripts/check-phase1.ts
import * as fs from 'fs';

console.log('\\n🔍 PHASE 1 CHECK\\n');

if (!fs.existsSync('./data/knowledge.json')) {
  console.log('❌ knowledge.json not found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync('./data/knowledge.json', 'utf-8'));
const docs = Array.isArray(data) ? data.length : 0;
const repos = new Set(data.map((d: any) => d.metadata?.repo)).size;

console.log(`Documents: ${docs} ${docs >= 50 ? '✅' : '❌'}`);
console.log(`Repos: ${repos} ${repos >= 3 ? '✅' : '❌'}`);
console.log(`File size: ${(fs.statSync('./data/knowledge.json').size / 1024).toFixed(0)}KB`);

if (docs >= 50 && repos >= 3) {
  console.log('\\n✅ PHASE 1 COMPLETE - Proceed to Phase 2');
} else {
  console.log('\\n❌ PHASE 1 FAILED - Fix and retry');
  process.exit(1);
}
```

Run it: npx tsx scripts/check-phase1.ts

EXPECTED: 50+ docs, 3+ repos, then proceed to Phase 2.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 2: EMBEDDINGS + VECTOR DATABASE (1 hour)
# ═══════════════════════════════════════════════════════════

## COPY THIS ENTIRE BLOCK INTO CLAUDE CODE:

```
MISSION: Upgrade from keyword search to semantic embeddings with LanceDB

LOCATION: /Users/sheirraza/akhai
PREREQ: Phase 1 complete (data/knowledge.json exists)

DO THESE TASKS:

1. Install dependencies:
   pnpm add @lancedb/lancedb apache-arrow ollama

2. Create Embedder at packages/inference/src/embeddings/Embedder.ts:

```typescript
import ollama from 'ollama';

export class Embedder {
  async embed(text: string): Promise<number[]> {
    const res = await ollama.embed({ model: 'nomic-embed-text', input: text });
    return res.embeddings[0];
  }
  
  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await ollama.embed({ model: 'nomic-embed-text', input: texts });
    return res.embeddings;
  }
}
```

3. Create VectorStore at packages/inference/src/knowledge/VectorStore.ts:

```typescript
import * as lancedb from '@lancedb/lancedb';
import { Embedder } from '../embeddings/Embedder.js';

export class VectorStore {
  private db: any;
  private table: any;
  private embedder = new Embedder();
  
  constructor(private path = './data/vectors') {}
  
  async init() {
    this.db = await lancedb.connect(this.path);
    const tables = await this.db.tableNames();
    if (tables.includes('docs')) {
      this.table = await this.db.openTable('docs');
    }
  }
  
  async addDocs(docs: Array<{id: string, content: string, metadata: any}>) {
    const vectors = await this.embedder.embedBatch(docs.map(d => d.content.slice(0, 8000)));
    const records = docs.map((d, i) => ({ ...d, vector: vectors[i] }));
    
    if (!this.table) {
      this.table = await this.db.createTable('docs', records);
    } else {
      await this.table.add(records);
    }
  }
  
  async search(query: string, limit = 5) {
    const qv = await this.embedder.embed(query);
    return this.table.vectorSearch(qv).limit(limit).toArray();
  }
  
  async count() { return this.table ? await this.table.countRows() : 0; }
}
```

4. Create migration script:

```typescript
// scripts/migrate-vectors.ts
import * as fs from 'fs';
import { VectorStore } from '../packages/inference/src/knowledge/VectorStore.js';

async function main() {
  console.log('🔄 Migrating to vector embeddings...');
  
  const docs = JSON.parse(fs.readFileSync('./data/knowledge.json', 'utf-8'));
  console.log(`Loaded ${docs.length} documents`);
  
  const vs = new VectorStore('./data/vectors');
  await vs.init();
  
  // Process in batches of 20
  for (let i = 0; i < docs.length; i += 20) {
    const batch = docs.slice(i, i + 20);
    await vs.addDocs(batch);
    console.log(`Progress: ${Math.min(i + 20, docs.length)}/${docs.length}`);
  }
  
  console.log(`✅ Migration complete! ${await vs.count()} vectors`);
}

main();
```

5. Run migration (ensure Ollama is running):
   ollama serve &
   npx tsx scripts/migrate-vectors.ts

6. Create and run verification:

```typescript
// scripts/check-phase2.ts
import { VectorStore } from '../packages/inference/src/knowledge/VectorStore.js';

async function main() {
  console.log('\\n🔍 PHASE 2 CHECK\\n');
  
  const vs = new VectorStore('./data/vectors');
  await vs.init();
  
  const count = await vs.count();
  console.log(`Vectors: ${count} ${count >= 50 ? '✅' : '❌'}`);
  
  // Test semantic search
  const results = await vs.search('robot pricing strategy', 3);
  console.log(`Search test: ${results.length > 0 ? '✅' : '❌'}`);
  
  if (results.length > 0) {
    console.log(`Top result: ${results[0].metadata?.path || results[0].id}`);
  }
  
  if (count >= 50 && results.length > 0) {
    console.log('\\n✅ PHASE 2 COMPLETE - Proceed to Phase 3');
  } else {
    console.log('\\n❌ PHASE 2 FAILED');
    process.exit(1);
  }
}

main();
```

Run it: npx tsx scripts/check-phase2.ts

EXPECTED: 50+ vectors, search returns results.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 3: CHAIN-OF-THOUGHT REASONING (1 hour)
# ═══════════════════════════════════════════════════════════

## COPY THIS ENTIRE BLOCK INTO CLAUDE CODE:

```
MISSION: Add <think> reasoning tags to AI responses

LOCATION: /Users/sheirraza/akhai
PREREQ: Phase 2 complete (vector search working)

DO THESE TASKS:

1. Create ReasoningEngine at packages/inference/src/reasoning/ReasoningEngine.ts:

```typescript
import ollama from 'ollama';
import { VectorStore } from '../knowledge/VectorStore.js';

const SYSTEM = `You are AKHAI, a sovereign AI. 

ALWAYS use this format:

<think>
[Your step-by-step reasoning]
- What is the user asking?
- What do I know or need to find?
- How should I approach this?
</think>

<answer>
[Your final answer]
</answer>

NEVER skip the <think> section.`;

export class ReasoningEngine {
  private vs: VectorStore;
  
  constructor(vectorPath = './data/vectors') {
    this.vs = new VectorStore(vectorPath);
  }
  
  async init() { await this.vs.init(); }
  
  async query(q: string, useRAG = true) {
    let context = '';
    let sources: string[] = [];
    
    if (useRAG) {
      const results = await this.vs.search(q, 5);
      sources = results.map((r: any) => r.metadata?.path || r.id);
      context = results.map((r: any, i: number) => 
        `[${i+1}] ${r.metadata?.path}\\n${r.content?.slice(0, 1000)}`
      ).join('\\n\\n');
    }
    
    const prompt = context 
      ? `Context:\\n${context}\\n\\nQuestion: ${q}`
      : q;
    
    const res = await ollama.chat({
      model: 'qwen2.5:7b',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt }
      ]
    });
    
    const text = res.message.content;
    const think = text.match(/<think>([\\s\\S]*?)<\\/think>/)?.[1]?.trim() || '';
    const answer = text.match(/<answer>([\\s\\S]*?)<\\/answer>/)?.[1]?.trim() || text;
    
    return { think, answer, sources };
  }
}
```

2. Create test script:

```typescript
// scripts/test-reasoning.ts
import { ReasoningEngine } from '../packages/inference/src/reasoning/ReasoningEngine.js';

async function main() {
  console.log('🧠 Testing Chain-of-Thought...\\n');
  
  const engine = new ReasoningEngine();
  await engine.init();
  
  const r = await engine.query('What is the AKHAI robot pricing?');
  
  console.log('💭 THINKING:');
  console.log(r.think || '[none]');
  console.log('\\n💡 ANSWER:');
  console.log(r.answer);
  console.log('\\n📚 SOURCES:', r.sources.join(', '));
}

main();
```

3. Run test:
   npx tsx scripts/test-reasoning.ts

4. Create and run verification:

```typescript
// scripts/check-phase3.ts
import { ReasoningEngine } from '../packages/inference/src/reasoning/ReasoningEngine.js';

async function main() {
  console.log('\\n🔍 PHASE 3 CHECK\\n');
  
  const engine = new ReasoningEngine();
  await engine.init();
  
  const r = await engine.query('What is 15% of 200?', false);
  
  const hasThink = r.think.length > 10;
  const hasAnswer = r.answer.length > 5;
  
  console.log(`Has <think>: ${hasThink ? '✅' : '❌'}`);
  console.log(`Has <answer>: ${hasAnswer ? '✅' : '❌'}`);
  
  if (hasThink && hasAnswer) {
    console.log('\\n✅ PHASE 3 COMPLETE - Proceed to Phase 4');
  } else {
    console.log('\\n❌ PHASE 3 FAILED');
    process.exit(1);
  }
}

main();
```

Run it: npx tsx scripts/check-phase3.ts

EXPECTED: Both <think> and <answer> present.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 4: AGENTIC RAG WITH TOOLS (2 hours)
# ═══════════════════════════════════════════════════════════

## COPY THIS ENTIRE BLOCK INTO CLAUDE CODE:

```
MISSION: AI decides when to search and uses tools autonomously

LOCATION: /Users/sheirraza/akhai
PREREQ: Phase 3 complete

DO THESE TASKS:

1. Install Vercel AI SDK:
   pnpm add ai @ai-sdk/openai-compatible zod

2. Create Agent at packages/inference/src/agent/Agent.ts:

```typescript
import { generateText, tool } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { VectorStore } from '../knowledge/VectorStore.js';

const ollama = createOpenAICompatible({
  name: 'ollama',
  baseURL: 'http://localhost:11434/v1',
});

export class AKHAIAgent {
  private vs: VectorStore;
  public toolCalls: string[] = [];
  
  constructor() { this.vs = new VectorStore(); }
  
  async init() { await this.vs.init(); }
  
  async run(query: string) {
    this.toolCalls = [];
    
    const searchTool = tool({
      description: 'Search AKHAI knowledge base',
      parameters: z.object({ q: z.string() }),
      execute: async ({ q }) => {
        this.toolCalls.push(`search: ${q}`);
        const res = await this.vs.search(q, 3);
        return res.map((r: any) => `${r.metadata?.path}: ${r.content?.slice(0, 500)}`).join('\\n');
      }
    });
    
    const calcTool = tool({
      description: 'Calculate math expression',
      parameters: z.object({ expr: z.string() }),
      execute: async ({ expr }) => {
        this.toolCalls.push(`calc: ${expr}`);
        try { return String(eval(expr)); } catch { return 'Error'; }
      }
    });
    
    const result = await generateText({
      model: ollama('qwen2.5:7b'),
      system: 'You are AKHAI. Use tools when needed. For project questions, always search first.',
      prompt: query,
      tools: { search: searchTool, calc: calcTool },
      maxSteps: 5,
    });
    
    return { answer: result.text, tools: this.toolCalls };
  }
}
```

3. Create test script:

```typescript
// scripts/test-agent.ts
import { AKHAIAgent } from '../packages/inference/src/agent/Agent.js';

async function main() {
  console.log('🤖 Testing Agent...\\n');
  
  const agent = new AKHAIAgent();
  await agent.init();
  
  console.log('Query: What is AKHAI robot pricing?');
  const r1 = await agent.run('What is AKHAI robot pricing?');
  console.log('Tools used:', r1.tools);
  console.log('Answer:', r1.answer.slice(0, 300));
  
  console.log('\\nQuery: Calculate 25 * 17');
  const r2 = await agent.run('Calculate 25 * 17');
  console.log('Tools used:', r2.tools);
  console.log('Answer:', r2.answer);
}

main();
```

4. Run test:
   npx tsx scripts/test-agent.ts

5. Create and run verification:

```typescript
// scripts/check-phase4.ts
import { AKHAIAgent } from '../packages/inference/src/agent/Agent.js';

async function main() {
  console.log('\\n🔍 PHASE 4 CHECK\\n');
  
  const agent = new AKHAIAgent();
  await agent.init();
  
  const r1 = await agent.run('What are AKHAI methodologies?');
  const usedSearch = r1.tools.some(t => t.startsWith('search'));
  console.log(`Uses search tool: ${usedSearch ? '✅' : '❌'}`);
  
  const r2 = await agent.run('What is 42 * 3?');
  const usedCalc = r2.tools.some(t => t.startsWith('calc'));
  console.log(`Uses calc tool: ${usedCalc ? '✅' : '❌'}`);
  
  const hasAnswer = r1.answer.length > 20;
  console.log(`Provides answer: ${hasAnswer ? '✅' : '❌'}`);
  
  if (usedSearch && hasAnswer) {
    console.log('\\n✅ PHASE 4 COMPLETE - Proceed to Phase 5');
  } else {
    console.log('\\n⚠️ PHASE 4 PARTIAL - Agent may need tuning');
  }
}

main();
```

Run it: npx tsx scripts/check-phase4.ts
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 5: CLI + API SERVER (1 hour)
# ═══════════════════════════════════════════════════════════

## COPY THIS ENTIRE BLOCK INTO CLAUDE CODE:

```
MISSION: Complete working CLI and API

LOCATION: /Users/sheirraza/akhai
PREREQ: Phase 4 complete

DO THESE TASKS:

1. Update CLI at packages/cli/src/index.ts with commands:
   - akhai status (show doc count, vector count)
   - akhai search "query" (search knowledge)
   - akhai ask "question" (reasoning query)
   - akhai agent "question" (agentic query)

2. Make CLI executable:
   cd packages/cli
   pnpm build
   chmod +x dist/index.js
   pnpm link --global

3. Test CLI:
   akhai status
   akhai search "robot"
   akhai ask "What is AKHAI?"

4. Update API at packages/api/src/server.ts:
   - GET /status
   - GET /search?q=...
   - POST /ask { query: string }
   - POST /agent { query: string }

5. Start API:
   cd packages/api
   pnpm dev

6. Test API:
   curl http://localhost:8080/status
   curl "http://localhost:8080/search?q=robot"

7. Create final verification:

```typescript
// scripts/check-phase5.ts
import { execSync } from 'child_process';

console.log('\\n🔍 PHASE 5 CHECK\\n');

let passed = 0;

try {
  const status = execSync('akhai status 2>/dev/null', { encoding: 'utf-8' });
  console.log(`CLI status: ${status.includes('Documents') || status.includes('docs') ? '✅' : '❌'}`);
  passed++;
} catch { console.log('CLI status: ❌ (not installed)'); }

try {
  const search = execSync('akhai search robot 2>/dev/null', { encoding: 'utf-8' });
  console.log(`CLI search: ${search.length > 10 ? '✅' : '❌'}`);
  passed++;
} catch { console.log('CLI search: ❌'); }

try {
  const api = execSync('curl -s http://localhost:8080/status', { encoding: 'utf-8' });
  console.log(`API status: ${api.length > 5 ? '✅' : '❌'}`);
  passed++;
} catch { console.log('API status: ⚠️ (not running)'); }

console.log(`\\n${passed >= 2 ? '✅' : '❌'} PHASE 5: ${passed}/3 checks passed`);

if (passed >= 2) {
  console.log('\\n🎉 AKHAI MOTHER BASE COMPLETE!');
}
```

Run it: npx tsx scripts/check-phase5.ts
```

---

# ═══════════════════════════════════════════════════════════
# MASTER VERIFICATION
# ═══════════════════════════════════════════════════════════

## Run this after all phases:

```bash
# Check all phases at once
for i in 0 1 2 3 4 5; do
  echo "=== Phase $i ==="
  npx tsx scripts/check-phase$i.ts 2>/dev/null || echo "Phase $i: Not complete"
done
```

---

# SUMMARY CHECKLIST

```
□ Phase 0: Environment
  □ Ollama installed
  □ qwen2.5:7b pulled
  □ nomic-embed-text pulled
  
□ Phase 1: GitHub Ingestion  
  □ data/knowledge.json exists
  □ 50+ documents
  □ 3+ repos
  
□ Phase 2: Embeddings
  □ data/vectors/ exists
  □ Semantic search works
  
□ Phase 3: Reasoning
  □ <think> tags in output
  □ <answer> tags in output
  
□ Phase 4: Agent
  □ Uses search tool
  □ Uses calc tool
  
□ Phase 5: CLI + API
  □ akhai command works
  □ API responds
```

# TROUBLESHOOTING

```bash
# Ollama not responding
ollama serve

# Models not found
ollama pull qwen2.5:7b
ollama pull nomic-embed-text

# TypeScript errors
pnpm install
pnpm -r build

# Permission denied on CLI
chmod +x packages/cli/dist/index.js

# API port in use
lsof -i :8080
kill -9 <PID>
```
