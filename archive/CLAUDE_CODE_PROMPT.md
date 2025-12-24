# 🧠 AKHAI MOTHER BASE - Claude Code CLI Prompt

Copy and paste this entire prompt to Claude Code CLI to build the sovereign AI infrastructure.

---

## PROMPT START

```
You are building AKHAI Mother Base - a sovereign AI infrastructure that will be independent from external AI providers like Claude/OpenAI. The foundation is ingesting all knowledge from the algoq369 GitHub account.

## CONTEXT

I have an AKHAI monorepo at /Users/sheirraza/akhai with:
- packages/core - Existing AKHAI engine (v0.4.0)
- packages/web - Next.js web interface
- packages/mcp-server - MCP server
- packages/inference - NEW: Self-hosted AI layer (partially created)
- packages/tools - NEW: Web search/scraper (partially created)
- packages/cli - NEW: Terminal application (partially created)
- packages/api - NEW: REST API server (partially created)

Key files already created:
- docs/MOTHER_BASE.md
- docs/IMPLEMENTATION_PLAN.md
- packages/inference/src/MotherBase.ts
- packages/inference/src/providers/self-hosted.ts
- packages/inference/src/knowledge/KnowledgeBase.ts
- packages/tools/src/web-search.ts
- packages/tools/src/web-scraper.ts
- packages/cli/src/index.ts
- packages/api/src/server.ts

## YOUR MISSION

Complete the AKHAI Mother Base implementation with these priorities:

### PRIORITY 1: GitHub Knowledge Ingestion

1. Create a working script at `scripts/ingest-github.ts` that:
   - Uses GitHub API to list all repos from `algoq369`
   - Downloads/clones content from each repo
   - Parses relevant files (.ts, .tsx, .js, .md, .json, .py, .yaml, etc.)
   - Stores documents in `data/knowledge.json`
   - Shows progress and stats

2. The KnowledgeBase class at `packages/inference/src/knowledge/KnowledgeBase.ts` needs:
   - GitHubIngester that actually works
   - MemoryVectorStore for search
   - Save/load to JSON file
   - Search with keyword matching (embeddings can come later)

3. Run the ingestion to populate the knowledge base with ALL algoq369 repos

### PRIORITY 2: Complete Package Setup

1. Update `packages/inference/src/index.ts` to export:
   - MotherBase, MOTHER_BASE_CONFIGS
   - SelfHostedProvider
   - KnowledgeBase, GitHubIngester, MemoryVectorStore

2. Update `packages/tools/src/index.ts` to export:
   - WebSearch
   - WebScraper

3. Add workspace references to root `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - 'packages/*'
   ```

4. Install dependencies:
   ```bash
   cd /Users/sheirraza/akhai
   pnpm install
   ```

5. Build all packages:
   ```bash
   pnpm -r build
   ```

### PRIORITY 3: CLI That Works

1. The CLI at `packages/cli/src/index.ts` should:
   - Load knowledge base on startup
   - Support `akhai chat` for interactive mode
   - Support `akhai query "prompt"` for single queries
   - Support `akhai search "term"` to search knowledge
   - Support `akhai ingest` to re-run GitHub ingestion
   - Support `akhai status` to show knowledge stats

2. Make it installable globally:
   ```bash
   cd packages/cli && pnpm link --global
   ```

### PRIORITY 4: Integration with Existing AKHAI

1. Modify `packages/core` to optionally use Mother Base:
   - Add option to use self-hosted provider instead of external APIs
   - Add RAG capability using KnowledgeBase

2. The flow should be:
   ```
   User Query → Search Knowledge → Add Context → Send to AI → Response
   ```

### PRIORITY 5: Testing

1. After ingestion, test that search works:
   ```typescript
   const kb = new KnowledgeBase();
   await kb.initialize();
   const results = await kb.search("AKHAI robot vision");
   console.log(results);
   ```

2. Test CLI:
   ```bash
   akhai status
   akhai search "BroolyKid smart city"
   akhai query "What is the AKHAI 10-year plan?"
   ```

## TECHNICAL REQUIREMENTS

- TypeScript with ES modules
- Node.js 18+
- Use fetch for HTTP requests (no axios)
- Use pnpm for package management
- Keep things simple - no complex abstractions
- Store knowledge in JSON for now (vector DB later)

## GITHUB API NOTES

- Rate limit: 60 requests/hour without token, 5000 with token
- Use GITHUB_TOKEN env var if available
- API endpoint: https://api.github.com
- List repos: GET /users/algoq369/repos
- Get tree: GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
- Get file: GET /repos/{owner}/{repo}/contents/{path}

## EXPECTED OUTPUT

After you're done, I should be able to:

1. See all my GitHub repos indexed:
   ```bash
   akhai status
   # Output: 50+ documents, 10+ repos, ~100K tokens
   ```

2. Search my knowledge:
   ```bash
   akhai search "robot pricing strategy"
   # Output: Relevant docs from AKHAI repos
   ```

3. Query with context:
   ```bash
   akhai query "What are the key features of AKHAI Engine v0.4?"
   # Output: Accurate answer based on indexed knowledge
   ```

## START NOW

Begin by:
1. Reading the existing files I mentioned
2. Completing the KnowledgeBase implementation
3. Creating the ingestion script
4. Running ingestion on algoq369
5. Testing search functionality
6. Making the CLI work

Go step by step, test each component, and show me the results.
```

---

## PROMPT END

---

## HOW TO USE

1. Open Terminal
2. Navigate to your akhai directory:
   ```bash
   cd /Users/sheirraza/akhai
   ```

3. Start Claude Code:
   ```bash
   claude
   ```

4. Paste the prompt above

5. Claude Code will:
   - Read existing files
   - Complete the implementation
   - Run the GitHub ingestion
   - Test everything
   - Give you a working Mother Base

---

## OPTIONAL: Set GitHub Token First

For faster ingestion (5000 requests/hour vs 60):

```bash
export GITHUB_TOKEN=your_github_personal_access_token
```

Get a token at: https://github.com/settings/tokens

---

## WHAT YOU'LL GET

After Claude Code completes:

```
akhai/
├── data/
│   └── knowledge.json       # All your GitHub knowledge (~MB)
├── packages/
│   ├── inference/           # Self-hosted AI layer ✅
│   ├── tools/               # Web capabilities ✅
│   ├── cli/                 # Terminal app ✅
│   └── api/                 # REST server ✅
└── scripts/
    └── ingest-github.ts     # Ingestion script ✅
```

Commands available:
```bash
akhai status              # See knowledge stats
akhai search "query"      # Search your knowledge
akhai query "question"    # Ask questions with RAG
akhai chat                # Interactive chat
akhai ingest              # Re-ingest GitHub
```

---

**This is the beginning of sovereign intelligence.**

*"Your data. Your brain. Your future."*
