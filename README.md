# 🧠 AKHAI — Multi-AI Consensus Engine

**From AI Engine to Smart Cities: A Market-Validated Journey**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-0.3.0-orange.svg)](package.json)
[![Phase](https://img.shields.io/badge/Phase-3%20Complete-brightgreen.svg)](README.md#roadmap)
[![Target](https://img.shields.io/badge/Target-$10B+_Ecosystem-gold.svg)](docs/MASTER_PLAN.md)

---

## The Vision

**AKHAI is the AI moat for a $10B+ ecosystem:**

| Pillar | Timeline | Target |
|--------|----------|--------|
| **AKHAI Engine** | 2025-2026 | Multi-AI consensus platform |
| **AKHAI Robot** | 2027-2028 | Portable + Full-Size AI embodiment |
| **Infrastructure** | 2029-2030 | Mining & data centers |
| **BroolyKid Cities** | 2030+ | Sovereign smart cities |

**Financial Targets (Market-Validated):**
- **Base Case:** $1.1B revenue, $6.7B valuation by 2035
- **Optimistic:** $3.5B revenue, $28B valuation by 2035

📖 **[Full Master Plan →](docs/MASTER_PLAN.md)**

---

## What is AKHAI?

AKHAI orchestrates **4 AI providers** (Anthropic, DeepSeek, xAI, Mistral) to reach consensus through automated verification loops. The result: more reliable, multi-perspective answers than any single AI.

### Key Features

- 🔬 **Multi-AI Consensus** — 4 advisors + Mother Base
- ⚡ **GTP Flash** — Parallel consensus in ~25 seconds
- 🎯 **Smart Routing** — Auto-selects best methodology
- 🧬 **5 Methodologies** — Direct, CoT, AoT, Flash, Auto
- 💻 **Production Ready** — TypeScript, Next.js 15, MCP

### Current Status: v0.3.0 ✅

| Component | Status |
|-----------|--------|
| GTP Flash Architecture | ✅ Complete |
| 4 AI Providers | ✅ Integrated |
| 5 Methodologies | ✅ Working |
| Web Interface | ✅ Built |
| MCP Server | ✅ Ready |

---

## Quick Start

### 1. Install

```bash
pnpm install
```

### 2. Configure

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
XAI_API_KEY=xai-...
MISTRAL_API_KEY=...
```

### 3. Build & Run

```bash
# Build
cd packages/core && pnpm build
cd ../mcp-server && pnpm build
cd ../web && pnpm dev

# Use with Claude Code
Use akhai.query to analyze: "What's the best approach for X?"
```

---

## Architecture

```
Mother Base: Anthropic Claude Sonnet 4
     │
     ▼
Advisor Layer (4 AIs)
├── Slot 1: DeepSeek (Technical)
├── Slot 2: xAI Grok (Strategic)
├── Slot 3: Mistral AI (Diversity)
└── Slot 4: Redactor (Claude)
     │
     ▼
Consensus → Final Answer
```

### Five Methodologies

| Method | Use Case | Speed |
|--------|----------|-------|
| **Direct** | Simple queries | ~5s |
| **CoT** | Sequential reasoning | ~30s |
| **AoT** | Complex decomposition | ~60s |
| **Flash** | Parallel consensus | ~25s |
| **Auto** | Smart selection | Variable |

---

## The Dream Team

| Role | Person | Credential |
|------|--------|------------|
| **CEO** | Haidar (algoq) | BJJ World Games Champion, Vibe Coder |
| **Architect** | Andy | Built AKHAI core engine |
| **Strategy** | Philippe Haydarian | ENA Graduate, Ex-Deloitte |
| **Investment** | Gregory Sankara | G&V Capital, +20% enhancement |
| **Technical** | Alex Roubaud | CEO Bitstack (AMF) |
| **Ambassador** | Cyril Gane | UFC Interim HW Champion |

📖 **[Full Team Bios →](docs/TEAM.md)**

---

## Roadmap

### ✅ Complete

- **Phase 0-3:** Core engine, GTP Flash, 4 providers, web UI

### 🎯 Next

| Phase | Timeline | Target |
|-------|----------|--------|
| **Beta Launch** | Q1 2026 | 1,000 users |
| **Monetization** | Q2 2026 | $50K MRR |
| **Scale** | Q4 2026 | 10,000 users, $200K MRR |
| **Robot Dev** | 2027 | Internal development |
| **Robot Launch** | 2028 | Portable + Full-Size |

### 📈 Financial Trajectory

| Year | Revenue | Valuation |
|------|---------|-----------|
| 2026 | $2-3M | $30-60M |
| 2028 | $35-85M | $350M-1B |
| 2030 | $200-540M | $1.4-4.9B |
| 2035 | $1.1-3.5B | $6.7-28B |

---

## Project Structure

```
akhai/
├── packages/
│   ├── core/           # Consensus engine
│   ├── web/            # Next.js interface
│   └── mcp-server/     # Claude Code integration
├── docs/
│   ├── MASTER_PLAN.md  # 10-year roadmap
│   ├── ROBOT.md        # Robot specifications
│   └── TEAM.md         # Team bios
└── STATUS_DASHBOARD.md # Current state
```

---

## Connected Ecosystem

| Repo | Purpose |
|------|---------|
| **akhai** | AI Engine (THIS) |
| [sempai-monorepo](https://github.com/algoq369/sempai-monorepo) | Wellness platform |
| [broolykid-network](https://github.com/algoq369/broolykid-network) | Smart cities |

---

## Documentation

- 📖 [Master Plan](docs/MASTER_PLAN.md) — Full 10-year roadmap
- 🤖 [Robot Specs](docs/ROBOT.md) — Portable & Full-Size details
- 👥 [Team](docs/TEAM.md) — Leadership bios
- 🏗️ [Architecture](docs/ARCHITECTURE.md) — Technical deep-dive

---

## API Reference

### Core

```typescript
const akhai = createAkhAI('anthropic');
akhai.setApiKeys({ anthropic, deepseek, xai, mistral });
akhai.setupMotherBase();
akhai.setupAdvisorLayer('deepseek', 'xai');

const result = await akhai.executeMotherBaseFlow(query);
```

### MCP Tools

```typescript
// akhai.query
{ query: string, flow?: 'A'|'B', methodology?: string }

// akhai.status
{} // Returns system state

// akhai.agents  
{ action: 'list'|'register', agentName?: string }
```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/x`)
3. Commit changes (`git commit -m 'Add x'`)
4. Push (`git push origin feature/x`)
5. Open Pull Request

---

## License

MIT License — see [LICENSE](LICENSE)

---

**AKHAI — Building the AI Moat for Tomorrow's Cities**

*Championship discipline. Market validation. Vibe coding.*
