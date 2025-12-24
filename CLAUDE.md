# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This workspace contains multiple trading and blockchain projects:

1. **Main Monorepo** (chat-chain, bot-hub, trading-bot, got-store) - Integrated suite for encrypted chat, bot coordination, and paper trading
2. **bsc-ranging-bot** - Production BSC trading bot with AI agents and advanced monitoring
3. **Other Projects** - Various experimental bots and tools in subdirectories

## Core Architecture (Main Monorepo)

### chat-chain
Minimal proof-of-work blockchain where transactions are encrypted chat messages.
- **Stack**: TypeScript, Node.js, WebSocket, SSE
- **Entry**: `src/server.ts`
- **Key features**:
  - End-to-end AES-GCM encryption in browser (per-channel passphrase)
  - ECDSA P-256 signed messages with verification
  - Low PoW difficulty for quick mining on small devices
  - Server stores only ciphertext

### bot-hub
WebSocket coordination hub for multi-bot communication and bridging.
- **Stack**: TypeScript, Node.js, WebSocket
- **Entry**: `src/server.ts`
- **Key features**:
  - Channel-based pub/sub messaging
  - In-memory message history per channel
  - Optional signed message verification
  - Bridge to Chat-Chain
  - AI integration (OpenAI, Anthropic, xAI, DeepSeek) via POST /ai/message

### trading-bot
Paper trading bot with dashboard, backtesting, and hub integration.
- **Stack**: TypeScript (Node.js) + Python for backtesting
- **Entry**: `src/index.ts` (bot), `src/server.ts` (dashboard), `src/backtest.ts` (backtest)
- **Key features**:
  - RSI-based trading signals
  - WebSocket integration with bot-hub
  - Real-time dashboard with SSE
  - Backtesting framework with equity curves
  - Mock exchange for paper trading

### got-store
SQLite-backed persistent storage service (Graph of Thought store).
- **Stack**: TypeScript, Node.js, better-sqlite3
- **Entry**: `src/server.ts`
- **Purpose**: Persistent storage for bot-hub thoughts/messages

## Commands

### Development (Start All Services)
```bash
bash scripts/dev-up.sh
```
Starts all services locally:
- Chat-Chain: http://127.0.0.1:4001
- Bot-Hub: http://127.0.0.1:5050 (WS: ws://127.0.0.1:5050/hub)
- Trading Dashboard: http://127.0.0.1:3000
- Two bot instances (botA, botB) publishing to hub

Logs are written to `logs/` directory with PID files for process management.

### Development (Stop All Services)
```bash
bash scripts/dev-down.sh
```

### Docker
```bash
docker compose up --build
```

### Individual Services

#### chat-chain
```bash
cd chat-chain
npm install
PORT=4000 DIFFICULTY=3 npm run dev     # Development
npm run build                          # Build TypeScript
npm start                              # Production
```

#### bot-hub
```bash
cd bot-hub
npm install
PORT=5050 REQUIRE_SIG=0 npm run dev   # Development
npm run build
npm start                              # Production
npm run trust                          # Trust management CLI
```

Environment variables for AI integration:
- `OPENAI_API_KEY` - Enable ChatGPT
- `ANTHROPIC_API_KEY` - Enable Claude
- `XAI_API_KEY` - Enable Grok
- `DEEPSEEK_API_KEY` - Enable DeepSeek

#### trading-bot
```bash
cd trading-bot
npm install
npm run dev                            # Run bot instance
npm run dashboard                      # Run dashboard server
npm run backtest                       # Run backtester
npm run report                         # Generate backtest report
```

For Python backtesting:
```bash
cd trading-bot
python -m venv venv
source venv/bin/activate               # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python backtest.py                     # Run Python backtest
python main.py                         # Run Python trading bot
```

#### got-store
```bash
cd got-store
npm install
PORT=4600 npm run dev
npm start
```

## BSC Ranging Bot (Separate Project)

Production-grade trading bot for Binance Smart Chain with AI agents and Streamlit monitoring.

### Location
`bsc-ranging-bot/`

### Commands
```bash
cd bsc-ranging-bot
npm install

npm start                              # Start main bot
npm run start-shadow                   # Shadow mode (paper trading)
npm run monitor                        # Launch Streamlit dashboard
npm run setup-db                       # Initialize database
npm run quick-start                    # Quick setup wizard
npm test                               # Run test suite
npm run test:coverage                  # Test coverage
```

### Key Files to Watch
- `AdvancedTradingBot.js` - Main bot logic
- `agents/TradingStrategyAgent.js` - Position monitoring
- `rangingStrategy.js` - Entry/exit conditions
- `utils/priceHistoryManager.js` - Price data persistence
- `security/rateLimiter.js` - Rate limiting
- `risk/productionRiskManager.js` - Risk checks
- `.cursorrules` - Bug detection priorities and monitoring rules

### Architecture
- Multi-agent system (Market Research, Trading Strategy, Risk Management)
- RAG system with vector database (Milvus)
- Streamlit dashboard with natural language querying
- RESTful API + WebSocket support
- Structured logging with Winston

## TypeScript Configuration

All TypeScript projects use ES modules (`"type": "module"` in package.json).

### Run TypeScript directly (development)
```bash
node --loader ts-node/esm src/server.ts
```

### Build and run (production)
```bash
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled JavaScript
```

## Testing

### trading-bot (JavaScript/TypeScript)
Uses built-in backtesting framework, no external test framework yet.

### bsc-ranging-bot
```bash
npm test                    # Run Jest tests
npm run test:watch          # Watch mode
npm run test:atomic         # Test atomic operations
npm run test:coverage       # Coverage report
```

## Integration Architecture

The main monorepo services integrate as follows:

1. **Bot instances** connect to **bot-hub** via WebSocket for coordination
2. **bot-hub** can bridge messages to **chat-chain** for encrypted persistence
3. **bot-hub** can store persistent "thoughts" in **got-store** (SQLite)
4. **trading-bot dashboard** serves SSE for real-time updates
5. **bot-hub** can invoke AI providers (OpenAI/Anthropic/etc.) and post responses to channels

## Message Formats

### bot-hub WebSocket messages
```typescript
{
  type: 'signal' | 'trade' | 'heartbeat' | 'hello' | 'custom',
  botId: string,
  channel: string,
  t: number,  // epoch milliseconds
  data: any
}
```

### chat-chain POST /api/msg
```typescript
{
  channel: string,
  author: string,
  ivB64: string,          // IV for AES-GCM
  cipherB64: string,      // Encrypted message
  ts: number,
  pubSpkiB64?: string,    // Public key (SPKI base64) for signature verification
  sigB64?: string         // ECDSA signature
}
```

## Deployment Notes

### Render (Cloud Deployment)
Reference `render.yaml` for service definitions. Key environment variables:
- **bot-hub**: `GOT_ENABLE=1`, `GOT_URL`, `CHAIN_ENABLE=1`, `CHAIN_URL`, `CHAIN_PASSPHRASE`, `REQUIRE_SIG=1`
- **chat-chain**: `PORT`, `DIFFICULTY`, `DATA`
- **trading-bot**: `PORT`, `SYMBOL`, `INTERVAL`, `START_BALANCE`, etc.

### Docker
All services have Dockerfiles. Use `docker compose up` to run entire stack locally or in production.

## Coding Conventions

### Logging
- **chat-chain, bot-hub, got-store**: Use `console.log/error` with structured output
- **bsc-ranging-bot**: Use Winston logger with database-backed logging

### Error Handling
- Async/await throughout; catch unhandled promise rejections
- Graceful shutdown handlers for SIGINT/SIGTERM
- Trading bots must never expose private keys or compromise security

### State Management
- **chat-chain**: Blockchain persisted to JSON file (configurable via `DATA` env)
- **got-store**: SQLite database for persistent storage
- **bot-hub**: In-memory message history (configurable `HISTORY` env)
- **bsc-ranging-bot**: PostgreSQL/SQLite for production data

## Security Considerations

- Never commit API keys, private keys, or passphrases
- Use `.env` files (see `.env.example` templates)
- For production BSC trading:
  - Validate all RPC responses
  - Use rate limiters
  - Implement risk management (position sizing, stop losses)
  - Monitor for MEV exploitation vectors
- chat-chain: Signed messages use ECDSA P-256; verify signatures server-side when `REQUIRE_SIG=1`

## Known Issues (bsc-ranging-bot)

From `.cursorrules`:
- TP 0.8% not triggering → Check exit condition logic in `rangingStrategy.js`
- Max hold time not enforcing → Check cron job execution
- `position.side` undefined → Check position creation logic
- Zero exits in long periods → Monitor `executeExit()` calls

## Development Workflow

1. **Make changes** in individual service directories
2. **Test locally** with `bash scripts/dev-up.sh` or individual `npm run dev`
3. **Check logs** in `logs/` directory (for dev-up script) or console output
4. **Build** with `npm run build` before deploying
5. **Deploy** via Docker or Render

## Package Management

- Main monorepo root: `pnpm` (see `packageManager` in root `package.json`)
- Individual services: `npm` (package-lock.json present)
- bsc-ranging-bot: `npm`

Install dependencies at service level, not monorepo root (except for root-level packages like `@ai-sdk/openai` for shared tooling).
