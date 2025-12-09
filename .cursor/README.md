# AkhAI MCP Server Configuration

This directory contains the MCP (Model Context Protocol) server configuration for AkhAI.

## Setup

1. **Build the MCP server:**
   ```bash
   cd packages/mcp-server
   pnpm build
   ```

2. **Configure API keys:**
   - Copy `.env.example` to `.env` in the project root
   - Add your API keys for the AI providers you want to use

3. **Use with Claude Code:**
   The MCP server is automatically loaded when you start Claude Code in this directory.

## Available Tools

Once the MCP server is running, you can use these tools in Claude Code:

### `akhai.query`
Execute queries using AkhAI's multi-AI consensus engine.

**Example:**
```
Use akhai.query to analyze: "What's the best architecture for a real-time chat app?"
```

### `akhai.status`
Get the current system status and configuration.

**Example:**
```
Use akhai.status to check if AkhAI is ready
```

### `akhai.agents`
Manage sub-agents (list or register new agents).

**Example:**
```
Use akhai.agents to list all registered agents
```

## Configuration

The `mcp.json` file configures:
- **Command:** `node` (runs the compiled MCP server)
- **Path:** Points to `packages/mcp-server/dist/index.js`
- **Environment:** API keys for all supported AI providers

## Supported AI Providers

- **Anthropic** (Claude Sonnet 4, Haiku)
- **OpenAI** (GPT-4o, GPT-4o-mini)
- **DeepSeek** (DeepSeek Chat, Reasoner)
- **xAI** (Grok)
- **Groq** (Llama 3.1, Mixtral)
- **Google** (Gemini 1.5 Pro, Flash)
- **Mistral** (Large, Medium)
- **OpenRouter** (Access to multiple models)
- **Qwen** (Qwen Plus, Turbo)
- **Ollama** (Local models - no API key needed)

## Troubleshooting

If tools don't appear:
1. Ensure the MCP server is built: `cd packages/mcp-server && pnpm build`
2. Check that `dist/index.js` exists
3. Verify API keys are set in `.env`
4. Restart Claude Code

## Architecture

```
Claude Code
    ↓
MCP Protocol (stdio)
    ↓
AkhAI MCP Server (packages/mcp-server)
    ↓
AkhAI Core Engine (packages/core)
    ↓
AI Providers (Anthropic, OpenAI, DeepSeek, etc.)
```
