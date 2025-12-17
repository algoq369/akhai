# 🧠 AKHAI MOTHER BASE - Step-by-Step Implementation Guide
# For Claude Code CLI - Copy & Paste Ready

## OVERVIEW

```
CURRENT STATE → TARGET STATE
─────────────────────────────────────────────────────────────
✅ Infrastructure ready    → 🎯 Reasoning AI with own knowledge
✅ Self-hosted provider    → 🎯 Chain-of-Thought prompting
✅ GitHub ingester (basic) → 🎯 Semantic embeddings + LanceDB
✅ Keyword search          → 🎯 Agentic RAG with tool-calling
❌ No reasoning            → 🎯 Fine-tuned model (later)
─────────────────────────────────────────────────────────────

TIMELINE: 4-6 weeks to production-ready sovereign AI
HARDWARE: MacBook 16GB or RTX 4060+ (we'll verify)
```

---

## PHASE 0: ENVIRONMENT SETUP & VERIFICATION
**Time: 30 minutes | Checkpoint: Hardware + Ollama ready**

### PROMPT FOR CLAUDE CODE CLI:

```
I'm building AKHAI Mother Base - a sovereign AI system.

FIRST: Verify my environment and install prerequisites.

TASKS:
1. Check hardware specs (RAM, GPU if any)
2. Install Ollama if not present
3. Pull required models:
   - ollama pull qwen2.5:7b (main reasoning)
   - ollama pull nomic-embed-text (embeddings)
4. Verify Ollama is running and models work
5. Check Node.js version (need 18+)
6. Navigate to /Users/sheirraza/akhai
7. Run pnpm install

VERIFICATION SCRIPT - Create and run this:
```typescript
// scripts/verify-environment.ts
import { execSync } from 'child_process';

console.log('🔍 AKHAI Environment Verification\n');

// 1. Check RAM
const totalMem = Math.round(require('os').totalmem() / 1024 / 1024 / 1024);
console.log(`RAM: ${totalMem}GB ${totalMem >= 16 ? '✅' : '⚠️ (16GB+ recommended)'}`);

// 2. Check Node
const nodeVersion = process.version;
console.log(`Node: ${nodeVersion} ${parseInt(nodeVersion.slice(1)) >= 18 ? '✅' : '❌ Need 18+'}`);

// 3. Check Ollama
try {
  execSync('ollama --version', { stdio: 'pipe' });
  console.log('Ollama: Installed ✅');
  
  // Check models
  const models = execSync('ollama list', { encoding: 'utf-8' });
  const hasQwen = models.includes('qwen2.5');
  const hasNomic = models.includes('nomic-embed');
  console.log(`  - qwen2.5:7b: ${hasQwen ? '✅' : '❌ Run: ollama pull qwen2.5:7b'}`);
  console.log(`  - nomic-embed-text: ${hasNomic ? '✅' : '❌ Run: ollama pull nomic-embed-text'}`);
} catch {
  console.log('Ollama: ❌ Not installed - Run: brew install ollama');
}

// 4. Check pnpm
try {
  execSync('pnpm --version', { stdio: 'pipe' });
  console.log('pnpm: Installed ✅');
} catch {
  console.log('pnpm: ❌ Run: npm install -g pnpm');
}

console.log('\n✅ Environment check complete!');
```

Run: `npx tsx scripts/verify-environment.ts`

EXPECTED OUTPUT:
- RAM: 16GB+ ✅
- Node: v18+ ✅
- Ollama: Installed ✅
- Models: Both pulled ✅
- pnpm: Installed ✅

If any ❌, fix before proceeding.
```

---

## PHASE 1: GITHUB KNOWLEDGE INGESTION
**Time: 2-4 hours | Checkpoint: All repos indexed in data/knowledge.json**

### PROMPT FOR CLAUDE CODE CLI:

```
PHASE 1: Complete GitHub Knowledge Ingestion

CONTEXT:
- Repo: /Users/sheirraza/akhai
- Existing file: packages/inference/src/knowledge/KnowledgeBase.ts (basic, needs completion)
- Target: Ingest ALL repos from github.com/algoq369

TASKS:

1. READ existing files first:
   - packages/inference/src/knowledge/KnowledgeBase.ts
   - packages/inference/src/index.ts
   - docs/IMPLEMENTATION_PLAN.md

2. COMPLETE the KnowledgeBase implementation:
   - GitHubIngester must actually fetch from GitHub API
   - Handle rate limits (use GITHUB_TOKEN if available)
   - Parse all relevant files: .ts, .tsx, .js, .md, .json, .py, .yaml
   - Store documents with proper metadata

3. CREATE ingestion script at scripts/ingest-github.ts:
```typescript
#!/usr/bin/env node
/**
 * GitHub Ingestion Script
 * Usage: GITHUB_TOKEN=xxx npx tsx scripts/ingest-github.ts algoq369
 */

import { KnowledgeBase } from '../packages/inference/src/knowledge/KnowledgeBase.js';

async function main() {
  const owner = process.argv[2] || 'algoq369';
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🧠 AKHAI MOTHER BASE - GitHub Ingestion                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  const kb = new KnowledgeBase(
    process.env.GITHUB_TOKEN,
    './data/knowledge.json'
  );
  
  await kb.initialize();
  await kb.ingestFromGitHub(owner);
  
  const stats = await kb.getStats();
  console.log(`
✅ INGESTION COMPLETE
   Documents: ${stats.totalDocuments}
   Tokens: ~${stats.totalTokens.toLocaleString()}
   Repos: ${stats.repos.length}
  `);
  
  // Test search
  console.log('Testing search...');
  const results = await kb.search('AKHAI robot');
  console.log(`Found ${results.length} results for "AKHAI robot"`);
}

main().catch(console.error);
```

4. RUN the ingestion:
```bash
cd /Users/sheirraza/akhai
mkdir -p data scripts
npx tsx scripts/ingest-github.ts algoq369
```

5. CREATE verification script at scripts/verify-phase1.ts:
```typescript
#!/usr/bin/env node
import * as fs from 'fs';

console.log('🔍 PHASE 1 VERIFICATION\n');

// Check knowledge.json exists
const dataPath = './data/knowledge.json';
if (!fs.existsSync(dataPath)) {
  console.log('❌ data/knowledge.json NOT FOUND');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const docCount = Array.isArray(data) ? data.length : 0;

console.log(`Documents indexed: ${docCount}`);
console.log(`File size: ${(fs.statSync(dataPath).size / 1024 / 1024).toFixed(2)}MB`);

// Count by type
const byType: Record<string, number> = {};
const repos = new Set<string>();

if (Array.isArray(data)) {
  for (const doc of data) {
    byType[doc.metadata?.type || 'unknown'] = (byType[doc.metadata?.type || 'unknown'] || 0) + 1;
    if (doc.metadata?.repo) repos.add(doc.metadata.repo);
  }
}

console.log(`\nBy Type:`);
Object.entries(byType).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

console.log(`\nRepos: ${repos.size}`);
[...repos].slice(0, 10).forEach(r => console.log(`  - ${r}`));

// Verification
const passed = docCount >= 50 && repos.size >= 3;
console.log(`\n${passed ? '✅ PHASE 1 PASSED' : '❌ PHASE 1 FAILED'}`);
console.log(`Expected: 50+ docs, 3+ repos`);
console.log(`Got: ${docCount} docs, ${repos.size} repos`);

process.exit(passed ? 0 : 1);
```

6. VERIFY:
```bash
npx tsx scripts/verify-phase1.ts
```

EXPECTED OUTPUT:
- Documents indexed: 100+
- Repos: 5+
- PHASE 1 PASSED ✅

DO NOT proceed to Phase 2 until verification passes.
```

---

## PHASE 2: EMBEDDINGS + LANCEDB VECTOR STORE
**Time: 1-2 days | Checkpoint: Semantic search working**

### PROMPT FOR CLAUDE CODE CLI:

```
PHASE 2: Upgrade to Semantic Embeddings + LanceDB

CONTEXT:
- Phase 1 complete: data/knowledge.json has documents
- Current: Keyword search (basic)
- Target: Semantic embeddings via Ollama + LanceDB vector store

TASKS:

1. INSTALL dependencies:
```bash
cd /Users/sheirraza/akhai
pnpm add @lancedb/lancedb apache-arrow ollama
pnpm add -D @types/node
```

2. CREATE embeddings module at packages/inference/src/embeddings/Embedder.ts:
```typescript
/**
 * AKHAI Embeddings via Ollama
 * Uses nomic-embed-text for semantic search
 */

import ollama from 'ollama';

export class Embedder {
  private model: string;
  private dimension: number = 768; // nomic-embed-text dimension

  constructor(model: string = 'nomic-embed-text') {
    this.model = model;
    console.log(`[Embedder] 🔢 Using ${model}`);
  }

  /**
   * Embed a single text
   */
  async embed(text: string): Promise<number[]> {
    const response = await ollama.embed({
      model: this.model,
      input: text,
    });
    return response.embeddings[0];
  }

  /**
   * Embed multiple texts (batched for efficiency)
   */
  async embedBatch(texts: string[], batchSize: number = 10): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await ollama.embed({
        model: this.model,
        input: batch,
      });
      embeddings.push(...response.embeddings);
      
      if (i % 50 === 0 && i > 0) {
        console.log(`[Embedder] Processed ${i}/${texts.length}`);
      }
    }
    
    return embeddings;
  }

  /**
   * Get embedding dimension
   */
  getDimension(): number {
    return this.dimension;
  }
}
```

3. CREATE LanceDB vector store at packages/inference/src/knowledge/VectorStore.ts:
```typescript
/**
 * AKHAI Vector Store using LanceDB
 * Local-first, zero-config, TypeScript native
 */

import * as lancedb from '@lancedb/lancedb';
import type { Table } from '@lancedb/lancedb';
import { Embedder } from '../embeddings/Embedder.js';

export interface VectorDocument {
  id: string;
  content: string;
  vector: number[];
  metadata: {
    source: string;
    path: string;
    type: string;
    repo: string;
    language?: string;
  };
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: VectorDocument['metadata'];
}

export class VectorStore {
  private db: lancedb.Connection | null = null;
  private table: Table | null = null;
  private embedder: Embedder;
  private dbPath: string;
  private tableName: string;

  constructor(dbPath: string = './data/vectors', tableName: string = 'documents') {
    this.dbPath = dbPath;
    this.tableName = tableName;
    this.embedder = new Embedder();
  }

  /**
   * Initialize connection
   */
  async initialize(): Promise<void> {
    console.log(`[VectorStore] 📂 Connecting to ${this.dbPath}`);
    this.db = await lancedb.connect(this.dbPath);
    
    // Check if table exists
    const tables = await this.db.tableNames();
    if (tables.includes(this.tableName)) {
      this.table = await this.db.openTable(this.tableName);
      const count = await this.table.countRows();
      console.log(`[VectorStore] ✅ Loaded ${count} documents`);
    } else {
      console.log(`[VectorStore] 📝 Table "${this.tableName}" will be created on first insert`);
    }
  }

  /**
   * Add documents with embeddings
   */
  async addDocuments(docs: Array<{
    id: string;
    content: string;
    metadata: VectorDocument['metadata'];
  }>): Promise<void> {
    if (!this.db) throw new Error('Not initialized');

    console.log(`[VectorStore] 🔄 Embedding ${docs.length} documents...`);
    
    // Generate embeddings
    const contents = docs.map(d => d.content.slice(0, 8000)); // Truncate for embedding
    const vectors = await this.embedder.embedBatch(contents);

    // Prepare records
    const records: VectorDocument[] = docs.map((doc, i) => ({
      id: doc.id,
      content: doc.content,
      vector: vectors[i],
      metadata: doc.metadata,
    }));

    // Create or append to table
    if (!this.table) {
      this.table = await this.db.createTable(this.tableName, records);
      console.log(`[VectorStore] ✅ Created table with ${records.length} documents`);
    } else {
      await this.table.add(records);
      console.log(`[VectorStore] ✅ Added ${records.length} documents`);
    }
  }

  /**
   * Semantic search
   */
  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    if (!this.table) throw new Error('No documents indexed');

    const queryVector = await this.embedder.embed(query);
    
    const results = await this.table
      .vectorSearch(queryVector)
      .limit(limit)
      .toArray();

    return results.map((r: any) => ({
      id: r.id,
      content: r.content,
      score: 1 - (r._distance || 0), // Convert distance to similarity
      metadata: r.metadata,
    }));
  }

  /**
   * Hybrid search: semantic + metadata filter
   */
  async searchWithFilter(
    query: string, 
    filter: string,  // SQL-like filter: "metadata.type = 'docs'"
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (!this.table) throw new Error('No documents indexed');

    const queryVector = await this.embedder.embed(query);
    
    const results = await this.table
      .vectorSearch(queryVector)
      .where(filter)
      .limit(limit)
      .toArray();

    return results.map((r: any) => ({
      id: r.id,
      content: r.content,
      score: 1 - (r._distance || 0),
      metadata: r.metadata,
    }));
  }

  /**
   * Get stats
   */
  async getStats(): Promise<{ count: number; tables: string[] }> {
    if (!this.db) throw new Error('Not initialized');
    
    const tables = await this.db.tableNames();
    const count = this.table ? await this.table.countRows() : 0;
    
    return { count, tables };
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    if (!this.db) throw new Error('Not initialized');
    
    const tables = await this.db.tableNames();
    if (tables.includes(this.tableName)) {
      await this.db.dropTable(this.tableName);
      this.table = null;
      console.log(`[VectorStore] 🗑️ Cleared table ${this.tableName}`);
    }
  }
}
```

4. CREATE migration script at scripts/migrate-to-vectors.ts:
```typescript
#!/usr/bin/env node
/**
 * Migrate from JSON to LanceDB with embeddings
 */

import * as fs from 'fs';
import { VectorStore } from '../packages/inference/src/knowledge/VectorStore.js';

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🔄 AKHAI - Migrating to Vector Embeddings                ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Load existing JSON data
  const jsonPath = './data/knowledge.json';
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ No knowledge.json found. Run Phase 1 first.');
    process.exit(1);
  }

  const documents = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📄 Loaded ${documents.length} documents from JSON`);

  // Initialize vector store
  const vectorStore = new VectorStore('./data/vectors', 'documents');
  await vectorStore.initialize();

  // Clear existing (if re-running)
  await vectorStore.clear();
  await vectorStore.initialize();

  // Migrate in batches
  const batchSize = 50;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize).map((doc: any) => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
    }));
    
    await vectorStore.addDocuments(batch);
    console.log(`✅ Migrated ${Math.min(i + batchSize, documents.length)}/${documents.length}`);
  }

  // Verify
  const stats = await vectorStore.getStats();
  console.log(`
✅ MIGRATION COMPLETE
   Documents in vector DB: ${stats.count}
   Tables: ${stats.tables.join(', ')}
  `);

  // Test search
  console.log('\n🔍 Testing semantic search...');
  const results = await vectorStore.search('AKHAI robot pricing strategy', 3);
  results.forEach((r, i) => {
    console.log(`\n[${i + 1}] ${r.metadata.path} (score: ${r.score.toFixed(3)})`);
    console.log(`    ${r.content.slice(0, 150)}...`);
  });
}

main().catch(console.error);
```

5. RUN migration:
```bash
# Make sure Ollama is running with nomic-embed-text
ollama serve &
sleep 5
ollama pull nomic-embed-text

# Run migration
npx tsx scripts/migrate-to-vectors.ts
```

6. CREATE verification script at scripts/verify-phase2.ts:
```typescript
#!/usr/bin/env node
import * as fs from 'fs';
import { VectorStore } from '../packages/inference/src/knowledge/VectorStore.js';

async function main() {
  console.log('🔍 PHASE 2 VERIFICATION\n');

  // Check LanceDB directory exists
  if (!fs.existsSync('./data/vectors')) {
    console.log('❌ Vector database not found');
    process.exit(1);
  }

  // Initialize and check
  const vectorStore = new VectorStore('./data/vectors', 'documents');
  await vectorStore.initialize();
  
  const stats = await vectorStore.getStats();
  console.log(`Documents in vector DB: ${stats.count}`);

  // Test semantic search
  console.log('\n📊 Testing semantic search quality...');
  
  const testQueries = [
    { query: 'robot pricing market analysis', expectPath: 'robot' },
    { query: 'bitcoin mining smart city', expectPath: 'broolykid' },
    { query: 'AKHAI engine methodology', expectPath: 'akhai' },
  ];

  let passed = 0;
  for (const test of testQueries) {
    const results = await vectorStore.search(test.query, 3);
    const found = results.some(r => 
      r.metadata.path.toLowerCase().includes(test.expectPath) ||
      r.metadata.repo.toLowerCase().includes(test.expectPath)
    );
    console.log(`  "${test.query}" → ${found ? '✅' : '⚠️'}`);
    if (found) passed++;
  }

  const success = stats.count >= 50 && passed >= 2;
  console.log(`\n${success ? '✅ PHASE 2 PASSED' : '❌ PHASE 2 FAILED'}`);
  console.log(`Vectors: ${stats.count} (need 50+), Search tests: ${passed}/3 (need 2+)`);
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
```

7. VERIFY:
```bash
npx tsx scripts/verify-phase2.ts
```

EXPECTED OUTPUT:
- Documents in vector DB: 100+
- Search tests: 2/3+ passing
- PHASE 2 PASSED ✅

DO NOT proceed to Phase 3 until verification passes.
```

---

## PHASE 3: CHAIN-OF-THOUGHT REASONING
**Time: 1-2 days | Checkpoint: Model uses <think> tags before answering**

### PROMPT FOR CLAUDE CODE CLI:

```
PHASE 3: Add Chain-of-Thought Reasoning

CONTEXT:
- Phase 2 complete: Semantic search working
- Target: Model reasons in <think> tags before answering
- Using: Qwen 2.5 7B via Ollama

TASKS:

1. CREATE reasoning engine at packages/inference/src/reasoning/ReasoningEngine.ts:
```typescript
/**
 * AKHAI Reasoning Engine
 * Implements Chain-of-Thought prompting with <think> tags
 */

import ollama from 'ollama';
import { VectorStore } from '../knowledge/VectorStore.js';

export interface ReasoningResponse {
  thinking: string;
  answer: string;
  sources: Array<{ path: string; score: number }>;
  totalTime: number;
}

export const REASONING_SYSTEM_PROMPT = `You are AKHAI, a sovereign AI assistant with access to a private knowledge base.

CRITICAL: You MUST follow this exact format for EVERY response:

<think>
[Your detailed internal reasoning process]
- Analyze what the user is asking
- Consider what knowledge might be relevant
- Plan your approach step by step
- Question your assumptions
- Consider alternatives
</think>

<answer>
[Your final, clear answer to the user]
- Be direct and helpful
- Cite sources when using knowledge base: [Source: path/to/file]
- If uncertain, say so
</answer>

RULES:
1. NEVER skip the <think> section
2. Keep thinking thorough but concise
3. Final answer should be actionable
4. Always cite sources from the knowledge base`;

export class ReasoningEngine {
  private model: string;
  private vectorStore: VectorStore;
  private initialized: boolean = false;

  constructor(
    model: string = 'qwen2.5:7b',
    vectorStorePath: string = './data/vectors'
  ) {
    this.model = model;
    this.vectorStore = new VectorStore(vectorStorePath);
  }

  async initialize(): Promise<void> {
    await this.vectorStore.initialize();
    this.initialized = true;
    console.log(`[Reasoning] 🧠 Initialized with ${this.model}`);
  }

  /**
   * Query with reasoning + RAG
   */
  async query(userQuery: string, useRAG: boolean = true): Promise<ReasoningResponse> {
    if (!this.initialized) await this.initialize();
    
    const startTime = Date.now();
    let context = '';
    let sources: ReasoningResponse['sources'] = [];

    // Step 1: Retrieve relevant context
    if (useRAG) {
      const results = await this.vectorStore.search(userQuery, 5);
      sources = results.map(r => ({ path: r.metadata.path, score: r.score }));
      
      if (results.length > 0) {
        context = '\n\n--- KNOWLEDGE BASE CONTEXT ---\n';
        context += results.map((r, i) => 
          `[${i + 1}] ${r.metadata.path}\n${r.content.slice(0, 1500)}`
        ).join('\n\n');
        context += '\n--- END CONTEXT ---\n';
      }
    }

    // Step 2: Generate response with reasoning
    const prompt = useRAG && context
      ? `Using the following context from my knowledge base:\n${context}\n\nUser question: ${userQuery}`
      : userQuery;

    const response = await ollama.chat({
      model: this.model,
      messages: [
        { role: 'system', content: REASONING_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      options: {
        temperature: 0.7,
        num_predict: 2048,
      }
    });

    const fullResponse = response.message.content;
    
    // Step 3: Parse thinking and answer
    const thinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>/);
    const answerMatch = fullResponse.match(/<answer>([\s\S]*?)<\/answer>/);

    return {
      thinking: thinkMatch ? thinkMatch[1].trim() : '[No explicit thinking captured]',
      answer: answerMatch ? answerMatch[1].trim() : fullResponse,
      sources,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * Simple query without RAG (for testing)
   */
  async simpleQuery(userQuery: string): Promise<string> {
    const response = await ollama.chat({
      model: this.model,
      messages: [
        { role: 'system', content: REASONING_SYSTEM_PROMPT },
        { role: 'user', content: userQuery }
      ],
      options: { temperature: 0.7 }
    });
    return response.message.content;
  }

  /**
   * Format response for display
   */
  formatResponse(response: ReasoningResponse): string {
    let output = '';
    
    output += '💭 THINKING:\n';
    output += '─'.repeat(50) + '\n';
    output += response.thinking + '\n\n';
    
    output += '💡 ANSWER:\n';
    output += '─'.repeat(50) + '\n';
    output += response.answer + '\n\n';
    
    if (response.sources.length > 0) {
      output += '📚 SOURCES:\n';
      response.sources.forEach(s => {
        output += `   • ${s.path} (relevance: ${(s.score * 100).toFixed(0)}%)\n`;
      });
    }
    
    output += `\n⏱️ ${response.totalTime}ms`;
    
    return output;
  }
}
```

2. UPDATE exports in packages/inference/src/index.ts:
```typescript
// Add to existing exports
export { ReasoningEngine, REASONING_SYSTEM_PROMPT } from './reasoning/ReasoningEngine.js';
export { VectorStore } from './knowledge/VectorStore.js';
export { Embedder } from './embeddings/Embedder.js';
```

3. CREATE test script at scripts/test-reasoning.ts:
```typescript
#!/usr/bin/env node
/**
 * Test Chain-of-Thought Reasoning
 */

import { ReasoningEngine } from '../packages/inference/src/reasoning/ReasoningEngine.js';

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🧠 AKHAI - Testing Chain-of-Thought Reasoning            ║
╚═══════════════════════════════════════════════════════════╝
  `);

  const engine = new ReasoningEngine('qwen2.5:7b', './data/vectors');
  await engine.initialize();

  // Test 1: Simple reasoning (no RAG)
  console.log('\n📝 TEST 1: Simple Reasoning (no RAG)');
  console.log('Query: "What is 15% of 80?"');
  const simple = await engine.query('What is 15% of 80?', false);
  console.log(engine.formatResponse(simple));

  // Test 2: RAG query about AKHAI
  console.log('\n📝 TEST 2: RAG Query');
  console.log('Query: "What is the AKHAI robot pricing strategy?"');
  const rag = await engine.query('What is the AKHAI robot pricing strategy?', true);
  console.log(engine.formatResponse(rag));

  // Test 3: Complex reasoning
  console.log('\n📝 TEST 3: Complex Reasoning with RAG');
  console.log('Query: "Compare AKHAI Engine methodologies and recommend which to use for business analysis"');
  const complex = await engine.query(
    'Compare AKHAI Engine methodologies and recommend which to use for business analysis',
    true
  );
  console.log(engine.formatResponse(complex));
}

main().catch(console.error);
```

4. RUN test:
```bash
# Ensure Ollama is running
ollama serve &
sleep 3

# Run reasoning test
npx tsx scripts/test-reasoning.ts
```

5. CREATE verification script at scripts/verify-phase3.ts:
```typescript
#!/usr/bin/env node
import { ReasoningEngine } from '../packages/inference/src/reasoning/ReasoningEngine.js';

async function main() {
  console.log('🔍 PHASE 3 VERIFICATION\n');

  const engine = new ReasoningEngine('qwen2.5:7b', './data/vectors');
  await engine.initialize();

  let passed = 0;
  const tests = [
    {
      name: 'Has <think> tags',
      query: 'What is 2+2?',
      check: (r: any) => r.thinking !== '[No explicit thinking captured]' && r.thinking.length > 20
    },
    {
      name: 'Has <answer> tags',
      query: 'Explain what AKHAI is',
      check: (r: any) => r.answer.length > 50
    },
    {
      name: 'Uses sources from RAG',
      query: 'What is the AKHAI 10-year plan?',
      check: (r: any) => r.sources.length > 0
    }
  ];

  for (const test of tests) {
    console.log(`Testing: ${test.name}...`);
    const response = await engine.query(test.query, true);
    const ok = test.check(response);
    console.log(`  ${ok ? '✅' : '❌'} ${test.name}`);
    if (ok) passed++;
  }

  const success = passed >= 2;
  console.log(`\n${success ? '✅ PHASE 3 PASSED' : '❌ PHASE 3 FAILED'}`);
  console.log(`Tests passed: ${passed}/3 (need 2+)`);
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
```

6. VERIFY:
```bash
npx tsx scripts/verify-phase3.ts
```

EXPECTED OUTPUT:
- Has <think> tags ✅
- Has <answer> tags ✅
- Uses sources from RAG ✅
- PHASE 3 PASSED ✅
```

---

## PHASE 4: AGENTIC RAG WITH TOOL-CALLING
**Time: 3-5 days | Checkpoint: AI decides when/what to search autonomously**

### PROMPT FOR CLAUDE CODE CLI:

```
PHASE 4: Implement Agentic RAG with Tool-Calling

CONTEXT:
- Phase 3 complete: Chain-of-Thought reasoning working
- Target: AI autonomously decides when to search, what queries to use
- Pattern: ReAct (Reasoning + Acting)

TASKS:

1. INSTALL Vercel AI SDK:
```bash
cd /Users/sheirraza/akhai
pnpm add ai @ai-sdk/openai-compatible zod
```

2. CREATE agent at packages/inference/src/agent/AKHAIAgent.ts:
```typescript
/**
 * AKHAI Agentic RAG
 * AI autonomously decides when to search and what queries to use
 */

import { generateText, tool } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import { VectorStore } from '../knowledge/VectorStore.js';

// Ollama provider (OpenAI-compatible)
const ollama = createOpenAICompatible({
  name: 'ollama',
  baseURL: 'http://localhost:11434/v1',
});

export interface AgentResponse {
  answer: string;
  reasoning: string[];
  toolCalls: Array<{
    tool: string;
    input: any;
    output: string;
  }>;
  totalTime: number;
}

export class AKHAIAgent {
  private vectorStore: VectorStore;
  private model: string;
  private maxSteps: number;

  constructor(
    vectorStorePath: string = './data/vectors',
    model: string = 'qwen2.5:7b',
    maxSteps: number = 5
  ) {
    this.vectorStore = new VectorStore(vectorStorePath);
    this.model = model;
    this.maxSteps = maxSteps;
  }

  async initialize(): Promise<void> {
    await this.vectorStore.initialize();
    console.log(`[Agent] 🤖 Initialized with ${this.model}, max ${this.maxSteps} steps`);
  }

  /**
   * Run agentic query
   */
  async run(userQuery: string): Promise<AgentResponse> {
    const startTime = Date.now();
    const toolCalls: AgentResponse['toolCalls'] = [];
    const reasoning: string[] = [];

    // Define tools the agent can use
    const searchKnowledge = tool({
      description: 'Search the AKHAI knowledge base for relevant information about AKHAI, BroolyKid, robots, or any project documentation',
      parameters: z.object({
        query: z.string().describe('Optimized search query for the knowledge base'),
        limit: z.number().min(1).max(10).default(5).describe('Number of results to return'),
      }),
      execute: async ({ query, limit }) => {
        reasoning.push(`🔍 Searching knowledge base: "${query}"`);
        
        const results = await this.vectorStore.search(query, limit);
        
        if (results.length === 0) {
          const output = 'No relevant documents found. Try a different query.';
          toolCalls.push({ tool: 'searchKnowledge', input: { query, limit }, output });
          return output;
        }

        const output = results.map((r, i) => 
          `[${i + 1}] ${r.metadata.path} (score: ${(r.score * 100).toFixed(0)}%)\n${r.content.slice(0, 800)}`
        ).join('\n\n---\n\n');
        
        toolCalls.push({ tool: 'searchKnowledge', input: { query, limit }, output: `Found ${results.length} results` });
        reasoning.push(`📄 Found ${results.length} relevant documents`);
        
        return output;
      },
    });

    const calculateMath = tool({
      description: 'Perform mathematical calculations',
      parameters: z.object({
        expression: z.string().describe('Mathematical expression to evaluate'),
      }),
      execute: async ({ expression }) => {
        reasoning.push(`🧮 Calculating: ${expression}`);
        try {
          // Simple eval (in production, use a proper math parser)
          const result = Function(`"use strict"; return (${expression})`)();
          toolCalls.push({ tool: 'calculateMath', input: { expression }, output: String(result) });
          return `Result: ${result}`;
        } catch (e) {
          return `Error: Could not evaluate "${expression}"`;
        }
      },
    });

    // Run agent loop
    const result = await generateText({
      model: ollama(this.model),
      system: `You are AKHAI, a sovereign AI assistant.

You have access to tools to help answer questions:
1. searchKnowledge - Search your knowledge base about AKHAI, BroolyKid, robots, documentation
2. calculateMath - Perform calculations

ALWAYS think step by step:
1. Analyze what the user needs
2. Decide if you need to use tools
3. Use tools to gather information
4. Synthesize a final answer

For questions about AKHAI, BroolyKid, or projects - ALWAYS search first.
For factual questions you know - answer directly.
For calculations - use the calculator tool.

Be helpful, accurate, and cite your sources.`,
      prompt: userQuery,
      tools: {
        searchKnowledge,
        calculateMath,
      },
      maxSteps: this.maxSteps,
    });

    return {
      answer: result.text,
      reasoning,
      toolCalls,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * Format response for display
   */
  formatResponse(response: AgentResponse): string {
    let output = '';

    if (response.reasoning.length > 0) {
      output += '🧠 AGENT REASONING:\n';
      output += '─'.repeat(50) + '\n';
      response.reasoning.forEach(r => output += `  ${r}\n`);
      output += '\n';
    }

    if (response.toolCalls.length > 0) {
      output += '🔧 TOOL CALLS:\n';
      output += '─'.repeat(50) + '\n';
      response.toolCalls.forEach(t => {
        output += `  • ${t.tool}(${JSON.stringify(t.input)}) → ${t.output}\n`;
      });
      output += '\n';
    }

    output += '💡 ANSWER:\n';
    output += '─'.repeat(50) + '\n';
    output += response.answer + '\n\n';
    output += `⏱️ ${response.totalTime}ms`;

    return output;
  }
}
```

3. UPDATE CLI at packages/cli/src/index.ts to use agent:
```typescript
// Add agent command to existing CLI
import { AKHAIAgent } from '@akhai/inference';

// Add this command:
program
  .command('agent <query>')
  .description('Query AKHAI with agentic RAG')
  .action(async (query: string) => {
    const agent = new AKHAIAgent('./data/vectors', 'qwen2.5:7b');
    await agent.initialize();
    const response = await agent.run(query);
    console.log(agent.formatResponse(response));
  });
```

4. CREATE test script at scripts/test-agent.ts:
```typescript
#!/usr/bin/env node
import { AKHAIAgent } from '../packages/inference/src/agent/AKHAIAgent.js';

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🤖 AKHAI - Testing Agentic RAG                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  const agent = new AKHAIAgent('./data/vectors', 'qwen2.5:7b', 5);
  await agent.initialize();

  // Test 1: Should trigger knowledge search
  console.log('\n📝 TEST 1: Knowledge Query (should search)');
  console.log('Query: "What is the AKHAI robot pricing strategy?"');
  const test1 = await agent.run('What is the AKHAI robot pricing strategy?');
  console.log(agent.formatResponse(test1));

  // Test 2: Should use calculator
  console.log('\n📝 TEST 2: Math Query (should calculate)');
  console.log('Query: "What is 15% of 850?"');
  const test2 = await agent.run('What is 15% of 850?');
  console.log(agent.formatResponse(test2));

  // Test 3: Multi-step reasoning
  console.log('\n📝 TEST 3: Multi-step Query');
  console.log('Query: "Search for AKHAI timeline and calculate how many years until robot launch"');
  const test3 = await agent.run(
    'Search for AKHAI timeline and calculate how many years from 2025 until robot launch'
  );
  console.log(agent.formatResponse(test3));
}

main().catch(console.error);
```

5. RUN test:
```bash
npx tsx scripts/test-agent.ts
```

6. CREATE verification at scripts/verify-phase4.ts:
```typescript
#!/usr/bin/env node
import { AKHAIAgent } from '../packages/inference/src/agent/AKHAIAgent.js';

async function main() {
  console.log('🔍 PHASE 4 VERIFICATION\n');

  const agent = new AKHAIAgent('./data/vectors', 'qwen2.5:7b', 5);
  await agent.initialize();

  let passed = 0;

  // Test 1: Agent uses searchKnowledge tool
  console.log('Test 1: Agent searches knowledge base...');
  const r1 = await agent.run('What are the AKHAI methodologies?');
  const usedSearch = r1.toolCalls.some(t => t.tool === 'searchKnowledge');
  console.log(`  ${usedSearch ? '✅' : '❌'} Used searchKnowledge tool`);
  if (usedSearch) passed++;

  // Test 2: Agent uses calculator
  console.log('Test 2: Agent calculates...');
  const r2 = await agent.run('Calculate 25 * 4');
  const usedCalc = r2.toolCalls.some(t => t.tool === 'calculateMath');
  console.log(`  ${usedCalc ? '✅' : '❌'} Used calculateMath tool`);
  if (usedCalc) passed++;

  // Test 3: Agent provides answer
  console.log('Test 3: Agent provides answer...');
  const hasAnswer = r1.answer.length > 50;
  console.log(`  ${hasAnswer ? '✅' : '❌'} Provides substantive answer`);
  if (hasAnswer) passed++;

  const success = passed >= 2;
  console.log(`\n${success ? '✅ PHASE 4 PASSED' : '❌ PHASE 4 FAILED'}`);
  console.log(`Tests passed: ${passed}/3 (need 2+)`);

  process.exit(success ? 0 : 1);
}

main().catch(console.error);
```

7. VERIFY:
```bash
npx tsx scripts/verify-phase4.ts
```

EXPECTED OUTPUT:
- Used searchKnowledge tool ✅
- Used calculateMath tool ✅
- Provides substantive answer ✅
- PHASE 4 PASSED ✅
```

---

## PHASE 5: CLI + API COMPLETION
**Time: 2-3 days | Checkpoint: Full working CLI and API server**

### PROMPT FOR CLAUDE CODE CLI:

```
PHASE 5: Complete CLI and API Server

CONTEXT:
- All core functionality working
- Target: Polished CLI and production-ready API

TASKS:

1. UPDATE complete CLI at packages/cli/src/index.ts:
   - akhai chat (interactive)
   - akhai query "..." (single query)
   - akhai agent "..." (agentic query)
   - akhai search "..." (search knowledge)
   - akhai status (show stats)
   - akhai ingest (re-ingest GitHub)

2. UPDATE API server at packages/api/src/server.ts:
   - POST /v1/query (with reasoning)
   - POST /v1/agent (agentic query)
   - GET /v1/search?q=...
   - GET /v1/status
   - WebSocket /v1/stream (streaming)

3. BUILD and LINK CLI:
```bash
cd /Users/sheirraza/akhai/packages/cli
pnpm build
pnpm link --global
```

4. TEST CLI:
```bash
akhai status
akhai search "robot pricing"
akhai query "What is AKHAI?"
akhai agent "Find AKHAI timeline and summarize"
```

5. START API:
```bash
cd /Users/sheirraza/akhai/packages/api
pnpm dev
# Test: curl http://localhost:8080/v1/status
```

6. CREATE final verification at scripts/verify-phase5.ts:
```typescript
#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('🔍 PHASE 5 VERIFICATION\n');

let passed = 0;

// Test CLI commands
const tests = [
  { cmd: 'akhai status', expect: 'Documents' },
  { cmd: 'akhai search "AKHAI"', expect: 'Found' },
];

for (const test of tests) {
  try {
    const output = execSync(test.cmd, { encoding: 'utf-8', timeout: 30000 });
    const ok = output.includes(test.expect);
    console.log(`${ok ? '✅' : '❌'} ${test.cmd}`);
    if (ok) passed++;
  } catch (e) {
    console.log(`❌ ${test.cmd} (failed)`);
  }
}

// Test API
try {
  const response = execSync('curl -s http://localhost:8080/v1/status', { encoding: 'utf-8' });
  const ok = response.includes('AKHAI') || response.includes('status');
  console.log(`${ok ? '✅' : '❌'} API /v1/status`);
  if (ok) passed++;
} catch {
  console.log('⚠️ API not running (start with: cd packages/api && pnpm dev)');
}

const success = passed >= 2;
console.log(`\n${success ? '✅ PHASE 5 PASSED' : '❌ PHASE 5 FAILED'}`);
process.exit(success ? 0 : 1);
```

7. VERIFY:
```bash
npx tsx scripts/verify-phase5.ts
```
```

---

## MASTER VERIFICATION SCRIPT

### Create this to verify ALL phases:

```typescript
// scripts/verify-all.ts
#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🧠 AKHAI MOTHER BASE - FULL VERIFICATION                 ║
╚═══════════════════════════════════════════════════════════╝
`);

const phases = [
  { name: 'Phase 0: Environment', script: 'verify-environment.ts' },
  { name: 'Phase 1: GitHub Ingestion', script: 'verify-phase1.ts' },
  { name: 'Phase 2: Embeddings + LanceDB', script: 'verify-phase2.ts' },
  { name: 'Phase 3: Chain-of-Thought', script: 'verify-phase3.ts' },
  { name: 'Phase 4: Agentic RAG', script: 'verify-phase4.ts' },
  { name: 'Phase 5: CLI + API', script: 'verify-phase5.ts' },
];

let passed = 0;
const results: string[] = [];

for (const phase of phases) {
  const scriptPath = `./scripts/${phase.script}`;
  
  if (!fs.existsSync(scriptPath)) {
    results.push(`⏭️  ${phase.name}: Not yet implemented`);
    continue;
  }

  try {
    execSync(`npx tsx ${scriptPath}`, { stdio: 'pipe', timeout: 120000 });
    results.push(`✅ ${phase.name}: PASSED`);
    passed++;
  } catch (e) {
    results.push(`❌ ${phase.name}: FAILED`);
  }
}

console.log('\n📊 RESULTS:\n');
results.forEach(r => console.log(`  ${r}`));

console.log(`\n${'═'.repeat(50)}`);
console.log(`TOTAL: ${passed}/${phases.length} phases complete`);

if (passed === phases.length) {
  console.log('\n🎉 AKHAI MOTHER BASE FULLY OPERATIONAL!');
} else {
  console.log(`\n⚠️  Continue with Phase ${passed + 1}`);
}
```

---

## QUICK REFERENCE COMMANDS

```bash
# Start Ollama (required)
ollama serve

# Run any phase verification
npx tsx scripts/verify-phase1.ts
npx tsx scripts/verify-phase2.ts
npx tsx scripts/verify-phase3.ts
npx tsx scripts/verify-phase4.ts
npx tsx scripts/verify-phase5.ts

# Run ALL verifications
npx tsx scripts/verify-all.ts

# CLI commands (after Phase 5)
akhai status
akhai search "query"
akhai query "question"
akhai agent "complex question"
akhai chat

# API (after Phase 5)
cd packages/api && pnpm dev
curl http://localhost:8080/v1/status
```
