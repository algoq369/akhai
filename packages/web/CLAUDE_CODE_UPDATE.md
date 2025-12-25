# AkhAI Development Status Update

**Date**: December 25, 2025  
**Version**: 0.4.0  
**Status**: Active Development - Side Canal & Mind Map Complete, Idea Factory In Progress

---

## Project Overview

AkhAI is a Sovereign AI Research Engine with multi-methodology querying, grounding guard system, and intelligent context tracking.

### Tech Stack
- **Framework**: Next.js 15.5.9 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **AI Provider**: Anthropic Claude API (Opus 4, Opus 4.5 for Legend Mode)
- **Database**: SQLite (better-sqlite3)
- **Package Manager**: pnpm
- **Port**: 3003/3004 (dev)

---

## Completed Features

### Core Engine (Session 1) ✅
- **7 Methodologies**: auto, direct, cod, bot, react, pot, gtp
- **Grounding Guard**: Hype detection, echo detection, drift detection, sanity checks
- **Interactive Warnings**: Refine/Continue/Pivot buttons with AI suggestions
- **Real-time Data**: CoinGecko integration for crypto prices

### Side Canal (Session 2) ✅
- **Topic Extraction**: AI-powered topic detection from conversations
- **Synopsis Generation**: Contextual summaries for each topic
- **Context Injection**: Topics inform AI responses
- **Topics Panel**: UI for viewing and managing extracted topics

### Mind Map UI (Session 3) ✅
- **Interactive Visualization**: D3.js force-directed graph
- **Multiple Views**: Graph, Table, Diagram modes
- **Topic Management**: Color, pin, archive, AI instructions per topic
- **Relationships**: Automatic topic relationship detection

### Chat Dashboard ✅
- **Live Topics**: Real-time topic extraction display
- **Mind Map Preview**: Simplified visualization in sidebar
- **Guard Controls**: Toggle suggestions, bias detector, hype detector
- **Methodology Switcher**: Continue in same chat, side chat, or new chat

### Legend Mode ✅
- **Activation**: Type "algoq369" in chat
- **Enhanced AI**: Uses Claude Opus 4.5
- **More Suggestions**: 5 suggestions instead of 3
- **Deeper Analysis**: 10-15 topics instead of 5-10

### History & Continuation ✅
- **Chat History**: View all past queries
- **Smooth Continuation**: Click to continue any past conversation
- **Session Tracking**: Related queries grouped together

### Idea Factory (In Progress) 🔄
- **Agent Selection**: Mini AkhAI, AkhAI, Custom
- **Physical Capabilities**: Walking speed/style, strength, endurance
- **Vision Functions**: Field of view, recognition, night vision
- **Everyday Functions**: Household, navigation, communication, security, assistance, health
- **AI Behavior**: Creativity, intuition, learning speed, adaptability
- **Personality**: Communication style, proactivity, curiosity

---

## Recent Fixes (Dec 25, 2025)

### Build Cache Corruption
- **Issue**: `Cannot find module './undefined'` webpack errors
- **Fix**: Clear `.next`, `node_modules/.cache`, restart dev server

### Methodology Explorer
- **Issue**: Circular layout requested to be horizontal
- **Fix**: Redesigned to horizontal bar with rectangular cards

### Mind Map 401 Handling
- **Issue**: "Internal Server Error" shown for unauthenticated users
- **Fix**: Silent return for 401, proper error messages for other errors

### Agent Customizer Enhancement
- **Issue**: Needed more comprehensive robot configuration options
- **Fix**: Added 6 configuration sections with industry-inspired features

### Topics Panel Enhancement
- **Issue**: No detail view for topics
- **Fix**: Added clickable topics with related queries and smooth transitions

---

## Database Schema

### Core Tables
- `queries` - User queries with results and metadata
- `topics` - Extracted topics with categories
- `query_topics` - Query-topic relationships
- `topic_relationships` - Topic-to-topic connections
- `users` - User accounts
- `sessions` - Authentication sessions

### Idea Factory Tables
- `agent_configs` - Agent configuration storage
- `training_sessions` - Training session logs
- `agent_knowledge` - Learned behaviors/knowledge

---

## API Endpoints

### Main Query
- `POST /api/simple-query` - Process query with methodology

### Authentication
- `GET /api/auth/session` - Check session
- `GET /api/auth/github` - GitHub OAuth
- `POST /api/auth/wallet` - Wallet auth

### Side Canal
- `GET /api/side-canal/topics` - Get user topics
- `GET /api/side-canal/topics/[id]` - Topic detail with related queries
- `POST /api/side-canal/extract` - Extract topics from query

### Mind Map
- `GET /api/mindmap/data` - Get nodes and links
- `PATCH /api/mindmap/topics/[id]` - Update topic properties
- `POST /api/mindmap/re-extract` - Re-extract topics from history

### Dashboard
- `GET /api/dashboard/live-topics` - Live topic feed
- `GET /api/dashboard/mindmap-preview` - Simplified mind map data

### History
- `GET /api/history` - Query history
- `GET /api/history/[id]/conversation` - Full conversation

### Idea Factory
- `POST /api/idea-factory/agent` - Save agent config
- `POST /api/idea-factory/generate` - Generate ideas

---

## Design System

### Colors (Grey/White Minimalist)
- `relic-white`: #FFFFFF
- `relic-ghost`: #FAFAFA
- `relic-mist`: #E5E5E5
- `relic-silver`: #A3A3A3
- `relic-slate`: #666666
- `relic-void`: #1A1A1A

### Typography
- Font: Mono for code/labels, System for body
- Size: 10px-12px for labels, 14px body

### Components
- Minimal borders (1px, relic-mist)
- No rounded corners (sharp edges)
- Subtle shadows on hover only
- Grey tones only, no colors

---

## Next Steps

### Immediate
1. Test all UI functionality in browser
2. Verify history continuation works
3. Test Legend Mode activation

### Upcoming
- Session 4: Legend Mode refinements
- Session 5: Artifact System (export JSON, SVG, MD)
- Session 6: Deployment to Vercel

---

## Commands

```bash
# Development
cd packages/web
pnpm dev          # Start dev server (port 3003)
PORT=3004 pnpm dev # Start on specific port

# Build
pnpm build

# Type check
npx tsc --noEmit

# Clean restart
rm -rf .next node_modules/.cache
pnpm dev
```

---

## Known Issues

1. **Mind Map Empty**: Topics only show after conversations
2. **History Continuation**: Requires authentication
3. **Dashboard Endpoints**: Return 401 for unauthenticated users (expected)

---

## Contact

- **Project**: AkhAI (Sovereign AI Research Engine)
- **Founder**: Algoq (Solo Founder)
- **Repository**: Private development

