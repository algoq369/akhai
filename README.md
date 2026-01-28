<p align="center">
  <img src="docs/akhai-logo.svg" alt="AkhAI Logo" width="120" />
</p>

<h1 align="center">AkhAI</h1>

<p align="center">
  <strong>Sovereign AI Research Engine</strong><br/>
  Visual-First Intelligence • Multi-Methodology Processing • Real-Time Validation
</p>

<p align="center">
  <a href="#architecture">Architecture</a> •
  <a href="#methodologies">Methodologies</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#pricing">Pricing</a>
</p>

---

## What is AkhAI?

AkhAI is a **sovereign AI research engine** built on a dual-layer processing architecture that combines visual-first intelligence with multiple reasoning methodologies and real-time hallucination detection.

Every query flows through a sophisticated pipeline:

1. **Layer 1: Neural Weight Distribution** — 11 specialized computational layers analyze and weight the query across cognitive dimensions
2. **Layer 2: Methodology Selection** — An intelligent router selects from 7 specialized reasoning approaches based on query complexity
3. **Grounding Guard** — Real-time validation system that detects drift, verifies claims, and ensures response integrity
4. **Side Canal** — Deep semantic annotation that extracts entities, relationships, and knowledge graph connections
5. **Response Synthesis** — Final output with confidence scores, source attribution, and visual knowledge mapping

The result: responses that are not just answers, but **verified, annotated, and visually connected** to your growing knowledge base.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER QUERY INPUT                                  │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 1: NEURAL WEIGHT DISTRIBUTION                      │
│                      (60% User Influence / 40% System)                      │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  META    │ │ PATTERN  │ │ CREATIVE │ │ KNOWLEDGE│ │ BALANCE  │          │
│  │ COGNITION│ │RECOGNITION│ │ SYNTHESIS│ │INTEGRATION│ │ HARMONY │          │
│  │  [1.0]   │ │  [0.85]  │ │  [0.70]  │ │  [0.90]  │ │  [0.80]  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │            │            │            │            │                 │
│  ┌────┴────┐ ┌─────┴────┐ ┌─────┴────┐ ┌─────┴────┐ ┌─────┴────┐          │
│  │VALIDATION│ │EXPANSION │ │ VICTORY  │ │PRECISION │ │FOUNDATION│          │
│  │  GATE   │ │  MODULE  │ │ PATHWAY  │ │  MODULE  │ │  LAYER   │          │
│  │  [0.60] │ │  [0.50]  │ │  [0.45]  │ │  [0.75]  │ │  [0.65]  │          │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │           │            │            │            │                 │
│       └───────────┴────────────┼────────────┴────────────┘                 │
│                                ▼                                            │
│                        ┌──────────────┐                                     │
│                        │   OUTPUT     │                                     │
│                        │   LAYER      │                                     │
│                        │   [0.55]     │                                     │
│                        └──────┬───────┘                                     │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: METHODOLOGY SELECTION                           │
│                                                                             │
│  Query Analysis → Complexity Score → Methodology Router → Strategy Select   │
│                                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ DIRECT  │ │   CoD   │ │   BoT   │ │  ReAct  │ │   PoT   │ │   GTP   │  │
│  │ [0.15]  │ │ [0.20]  │ │ [0.15]  │ │ [0.18]  │ │ [0.12]  │ │ [0.20]  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                             │
│                           ┌─────────┐                                       │
│                           │  AUTO   │ ← Intelligent Router (Default)        │
│                           │ SELECTOR│                                       │
│                           └─────────┘                                       │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GROUNDING GUARD (Active)                            │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  DRIFT DETECTOR │  │ CLAIM VERIFIER  │  │ CONFIDENCE CALC │             │
│  │  Measures topic │  │ Cross-references│  │ Outputs 0.0-1.0 │             │
│  │  coherence %    │  │ against sources │  │ certainty score │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                ▼                                            │
│                    ┌───────────────────────┐                                │
│                    │   VALIDATION RESULT   │                                │
│                    │  ✓ Pass / ⚠ Warning   │                                │
│                    │  Drift: 3% | Conf: 87%│                                │
│                    └───────────────────────┘                                │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SIDE CANAL (Deep Annotation)                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ENTITY EXTRACTION    │  RELATIONSHIP MAPPING  │  TOPIC CLUSTERING  │   │
│  │  • Named entities     │  • Subject-predicate   │  • Category assign │   │
│  │  • Concepts           │  • Object relations    │  • Semantic groups │   │
│  │  • Technical terms    │  • Causal links        │  • Knowledge edges │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│                    ┌───────────────────────────┐                            │
│                    │      MIND MAP UPDATE      │                            │
│                    │  Nodes: +3 | Edges: +7    │                            │
│                    │  Topics: technology, AI   │                            │
│                    └───────────────────────────┘                            │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RESPONSE SYNTHESIS                                 │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   ANSWER    │  │ ANNOTATIONS │  │  MIND MAP   │  │   METRICS   │        │
│  │   Content   │  │   Sources   │  │   Visual    │  │   Tokens    │        │
│  │             │  │   Claims    │  │   Graph     │  │   Cost      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: Neural Weight Distribution

The 11 computational layers work together to analyze query characteristics:

| Layer | Function | Weight Range |
|-------|----------|--------------|
| **Meta-Cognition** | High-level reasoning priority, query intent classification | 0.8 - 1.0 |
| **Pattern Recognition** | Analytical processing, structure detection, logical inference | 0.6 - 0.95 |
| **Creative Synthesis** | Lateral thinking, novel connections, creative generation | 0.3 - 0.85 |
| **Knowledge Integration** | Context fusion, memory retrieval, fact consolidation | 0.5 - 0.95 |
| **Balance Harmony** | Output optimization, response coherence tuning | 0.4 - 0.90 |
| **Validation Gate** | Quality assurance, constraint checking | 0.3 - 0.80 |
| **Expansion Module** | Generative capacity, elaboration depth | 0.2 - 0.70 |
| **Victory Pathway** | Goal persistence, task completion drive | 0.3 - 0.75 |
| **Precision Module** | Accuracy focus, detail orientation | 0.5 - 0.90 |
| **Foundation Layer** | Base reasoning, fundamental logic | 0.4 - 0.80 |
| **Output Layer** | Response generation, final synthesis | 0.3 - 0.70 |

**Weight Influence**: Users control 60% of weight distribution through configuration presets. System intelligence contributes 40% based on query analysis.

---

## Methodologies

AkhAI provides 7 specialized reasoning methodologies, each optimized for different query types:

| Method | Full Name | What It Does | Best For |
|--------|-----------|--------------|----------|
| **Direct** | Direct Response | Fast, single-pass generation with minimal overhead | Quick facts, simple Q&A, definitions |
| **CoD** | Chain of Density | Progressive compression → iterative refinement cycles | Summarization, step-by-step explanations |
| **BoT** | Buffer of Thoughts | Thought buffer accumulation with meta-cognitive synthesis | Complex reasoning, multi-step problems |
| **ReAct** | Reasoning + Acting | Think → Act → Observe iterative loops with tool use | Research, fact-finding, web searches |
| **PoT** | Program of Thoughts | Code-based computation with executable reasoning | Math, calculations, data analysis, logic |
| **GTP** | Generative Thought Process | Multi-advisor consensus with confidence-weighted synthesis | Complex decisions, nuanced opinions |
| **Auto** | Automatic Router | Intelligent methodology selection based on query analysis | Any query (default mode) |

### Methodology Selection Process

```
Query Input
    │
    ▼
┌─────────────────────┐
│  Complexity Score   │ ← Analyzes: length, technical terms, question type
│  0.0 ──────── 1.0   │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
  Simple       Complex
  (< 0.4)      (≥ 0.4)
    │             │
    ▼             ▼
┌─────────┐  ┌─────────────────────────────┐
│ Direct  │  │ Further Analysis            │
└─────────┘  │ • Math detected? → PoT      │
             │ • Research needed? → ReAct  │
             │ • Multi-step? → BoT         │
             │ • Opinions? → GTP           │
             │ • Summary? → CoD            │
             └─────────────────────────────┘
```

---

## Features

### 🧠 Mind Map — Visual Knowledge Graph

Every conversation builds your personal knowledge graph:

- **Graph View**: Force-directed clustering by topic category
- **History View**: Chronological conversation cards with topic extraction
- **Grimoire View**: Project-based workspaces with persistent memory

### 🔍 Side Canal — Deep Semantic Annotation

Automatic extraction and linking of:

- **Entities**: People, organizations, technologies, concepts
- **Relationships**: Causal links, comparisons, dependencies
- **Topics**: Hierarchical categorization with semantic clustering
- **Knowledge Edges**: Cross-conversation connections

### 🛡️ Grounding Guard — Real-Time Validation

Active monitoring during response generation:

- **Drift Detection**: Measures topic coherence (alerts if > 5% drift)
- **Claim Verification**: Cross-references factual statements
- **Confidence Scoring**: 0-100% certainty on each response
- **Source Attribution**: Links claims to supporting evidence

### ⚡ Visual-First Intelligence

- **Mind Map Generation**: Automatic visual explanations
- **Metrics Dashboard**: Real-time token usage, cost tracking
- **Query Panel**: Quick actions on any node
- **Category Filtering**: Filter by topic, methodology, time

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL (optional, SQLite default)

### Installation

```bash
# Clone the repository
git clone https://github.com/algoq369/akhai.git
cd akhai

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY

# Start development server
pnpm dev
```

### Configuration

Create a `.env.local` file:

```env
# Required
ANTHROPIC_API_KEY=your_api_key_here

# Optional
DATABASE_URL=postgresql://...  # Defaults to SQLite
BRAVE_API_KEY=...              # For web search (falls back to DuckDuckGo)
POSTHOG_KEY=...                # Analytics
```

---

## Pricing

All tiers include **all 7 methodologies**, Grounding Guard, Mind Map, and Side Canal.

| Plan | Price | Daily Tokens | Features |
|------|-------|--------------|----------|
| **Free** | $0 | 50K tokens | Full methodology access, Guard, Mind Map |
| **Pro** | $20/month | 1M tokens | Priority support, extended history, API access |
| **Expert** | $100/month | 5M tokens | Advanced analytics, custom presets, team sharing |
| **Legend** | $200/month | Unlimited | R&D tier, early access, direct founder contact |

### Pay-As-You-Go

For usage beyond your plan limits:

| Token Volume | Price per 1M tokens |
|--------------|---------------------|
| Up to 10M | $15 |
| 10M - 100M | $12 |
| 100M+ | $10 |

*All tiers powered by Claude API. Transitioning to sovereign self-hosted models Q1 2027.*

---

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js API, PostgreSQL/SQLite, Neo4j (knowledge graph)
- **AI**: Claude API (launch), Qwen/Mistral (sovereign Q1 2027)
- **Infrastructure**: FlokiNET Iceland (sovereignty-focused hosting)

---

## Roadmap

### Phase 1: Foundation (Current)
- ✅ 7 Methodologies implementation
- ✅ Grounding Guard system
- ✅ Mind Map visualization
- ✅ Side Canal annotation

### Phase 2: Enhancement (Q2 2026)
- 🔄 Improved clustering algorithms
- 🔄 Advanced query panel
- 🔄 Team collaboration features

### Phase 3: Sovereignty (Q1 2027)
- ⏳ Self-hosted model migration (Qwen 2.5-72B)
- ⏳ Local inference infrastructure
- ⏳ Complete data sovereignty

### Phase 4: Hardware (2027+)
- 📋 AkhAI Terminal
- 📋 Sovereign Phone
- 📋 Custom GPU infrastructure

---

## Contributing

AkhAI is open-source under Apache 2.0 for core systems:

- **Open Source**: Guard, Neural Layers, Side Canal, Visual Engine
- **Proprietary**: Payments, scaling infrastructure, anti-abuse systems

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Apache 2.0 — See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 🧠 by <a href="https://github.com/algoq369">Algoq</a>
</p>
