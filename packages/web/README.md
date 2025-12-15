# 🌐 AkhAI Web Interface

Modern Next.js 14 web interface for the AkhAI Super Research Engine.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
packages/web/
├── app/
│   ├── page.tsx                      # Homepage with search
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles
│   ├── query/[id]/page.tsx          # Query results page
│   └── api/
│       ├── query/route.ts           # POST /api/query
│       └── stream/[id]/route.ts     # GET /api/stream/[id] (SSE)
├── components/
│   ├── SearchBar.tsx                # Search input component
│   ├── FlowToggle.tsx              # Flow A/B toggle
│   └── VerificationWindow.tsx      # Live consensus display
└── lib/
    ├── akhai-client.ts             # AkhAI client wrapper
    └── query-store.ts              # In-memory query storage
```

## 🎨 Features

### Search Interface
- Clean, minimal Google-like design
- Large search bar with Enter key support
- Flow A/B toggle for execution mode selection
- Responsive design with dark mode support

### Verification Window
- **Live Updates**: Real-time advisor responses via Server-Sent Events
- **Consensus Rounds**: Visual display of up to 3 consensus rounds
- **Advisor Cards**: Shows responses from all 4 advisor slots
- **Redactor Synthesis**: Displays synthesized recommendations
- **Mother Base Decision**: Final decision with approval status
- **Progress Indicators**: Loading states and completion status

### Flow Modes
- **Flow A**: Strategic decision making (Mother Base approval)
- **Flow B**: Direct task execution (Sub-agent execution)

## 🔧 API Routes

### POST /api/query
Start a new query execution.

**Request:**
```json
{
  "query": "Your question here",
  "flow": "A"  // or "B"
}
```

**Response:**
```json
{
  "queryId": "abc123xyz"
}
```

### GET /api/stream/[id]
Stream live updates for a query (Server-Sent Events).

**Event Types:**
- `advisor-response` - Individual advisor response
- `consensus-reached` - Consensus achieved for a round
- `redactor-synthesis` - Redactor's synthesized output
- `mother-base-decision` - Final decision from Mother Base
- `complete` - Query execution complete
- `error` - Error occurred

## 🎯 Implementation Status

### ✅ Completed (Phase 2 - Full Integration)
- Next.js 15.5.9 project setup with TypeScript
- Tailwind CSS integration
- Homepage with search interface
- Flow A/B toggle component
- Query results page
- SSE streaming API routes
- Verification window with live updates
- Responsive design with dark mode
- **@akhai/core integration complete** ✅
- **Real AI consensus execution (Flow A & B)** ✅
- **Event streaming wrapper for real-time updates** ✅
- **Query store with event emitter** ✅

### 🔨 Future Enhancements
- Cost tracking display in UI
- Usage analytics dashboard
- Database persistence (currently in-memory)
- Settings page for configuration
- Query history persistence

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 3.4
- **State**: Zustand 5.0 (prepared for future use)
- **Streaming**: Server-Sent Events (SSE)
- **ID Generation**: nanoid

## 🔗 Integration with @akhai/core

✅ **Integration Complete!** The web interface now uses the actual AkhAI core engine.

### How It Works

1. **Query Processing** (`app/api/query/route.ts`):
   - Creates AkhAI instance with configured providers
   - Sets API keys from environment variables
   - Executes Flow A (Mother Base) or Flow B (Sub-Agent) based on user selection
   - Stores events in query store for streaming

2. **Event Streaming** (`app/api/stream/[id]/route.ts`):
   - Polls query store for new events
   - Streams events to client via Server-Sent Events (SSE)
   - Emits advisor responses, consensus rounds, redactor synthesis, and final decisions

3. **Event Wrapper** (`lib/akhai-executor.ts`):
   - Wraps @akhai/core execution
   - Emits events after execution completes
   - Supports both Flow A and Flow B

### Configuration

Set environment variables in `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
XAI_API_KEY=xai-...
OPENROUTER_API_KEY=sk-or-...
```

## 📝 Environment Variables

For production, add:

```env
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
XAI_API_KEY=xai-...
OPENROUTER_API_KEY=sk-or-...
```

## 🎨 Design System

### Colors
- Primary: Blue (`blue-600`)
- Secondary: Purple (`purple-600`)
- Success: Green (`green-600`)
- Warning: Yellow (`yellow-600`)
- Error: Red (`red-600`)

### Typography
- Headings: Bold, gradient text for branding
- Body: System font stack for performance
- Code: Monospace for technical content

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build
docker build -t akhai-web .

# Run
docker run -p 3000:3000 akhai-web
```

## 📄 License

MIT - See LICENSE file for details

---

**Built with ❤️ for the AkhAI Super Research Engine**
