# 🎨 AkhAI Website UI Design

**Phase 2 Feature Planning** - Search Engine Interface with Live Consensus Visualization

**Status:** Planning Phase | Target: Q2 2026

---

## 🎯 Vision

Create a beautiful, intuitive search engine interface that showcases AkhAI's unique multi-AI consensus process in real-time. Users should see the "thinking process" unfold - watching different AI advisors debate, reaching consensus, and delivering well-reasoned answers.

---

## 🏠 Homepage Design

### Clean Search Interface

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                          🧠 AkhAI                                │
│                  Super Research Engine                           │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Ask anything...                                    🔍   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                   │
│              Flow: ○ Strategic Decision  ○ Task Execution        │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │ Multi-AI     │  │ Automated    │  │ 10 AI        │        │
│   │ Consensus    │  │ Verification │  │ Providers    │        │
│   └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Minimalist search bar (centered, large)
- Flow selector (A/B toggle)
- Feature highlights below search
- Subtle gradient background
- No clutter, focus on search

---

## 🔍 Search Results Page

### Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ 🧠 AkhAI  [Search box]                            [⚙️] [👤]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐ │
│  │                                 │  │                      │ │
│  │    MAIN ANSWER AREA             │  │   VERIFICATION       │ │
│  │    (Flow Result)                │  │   WINDOW             │ │
│  │                                 │  │   (Live Process)     │ │
│  │                                 │  │                      │ │
│  │                                 │  │                      │ │
│  │                                 │  │                      │ │
│  │                                 │  │                      │ │
│  │                                 │  │                      │ │
│  │                                 │  │                      │ │
│  └─────────────────────────────────┘  └──────────────────────┘ │
│                                                                   │
│  [Follow-up question input]                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Two-Column Design:
- **Left (60%):** Final answer display
- **Right (40%):** Live verification window
- Responsive: Stacks vertically on mobile

---

## 🎬 Live Verification Window

### Real-Time Consensus Visualization

**The Core Innovation:** Users see the AI consensus process unfold in real-time.

```
┌────────────────────────────────────────┐
│  🔴 LIVE: Consensus Round 1/3         │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🤖 Technical Advisor (DeepSeek)  │ │
│  │ ✓ [AGREE] "Based on...           │ │
│  │    technical merit..."            │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🧩 Strategic Advisor (Qwen)      │ │
│  │ ⚠️ [DISAGREE] "However, from...  │ │
│  │    strategic perspective..."      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🌐 Diversity Advisor (OpenRouter)│ │
│  │ ⚠️ [DISAGREE] "Consider...       │ │
│  │    alternative approaches..."     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ⏱️ Time elapsed: 1.2s                │
│  📊 Consensus: 33% (1/3 agree)        │
│                                        │
│  ⏩ Starting Round 2...               │
└────────────────────────────────────────┘
```

### Visual States:

**1. Consensus Round**
- Show all 3 brainstormers (slots 1-3)
- Color-coded responses:
  - 🟢 Green border: [AGREE]
  - 🟡 Yellow border: [DISAGREE]
- Live typing effect as responses arrive
- Progress indicator (round X/3)
- Real-time consensus percentage

**2. Redactor Synthesis**
```
┌────────────────────────────────────────┐
│  🎯 Redactor Synthesizing...          │
├────────────────────────────────────────┤
│                                        │
│  📝 Combining perspectives from:       │
│     ✓ Technical Advisor                │
│     ✓ Strategic Advisor                │
│     ✓ Diversity Advisor                │
│                                        │
│  🔄 Creating coherent recommendation...│
│                                        │
│  ⏱️ Time elapsed: 2.8s                │
└────────────────────────────────────────┘
```

**3. Mother Base Review (Flow A)**
```
┌────────────────────────────────────────┐
│  👑 Mother Base Reviewing...          │
├────────────────────────────────────────┤
│                                        │
│  📋 Recommendation received from       │
│     Redactor (synthesized consensus)   │
│                                        │
│  🔍 Mother Base evaluating...          │
│     • Technical feasibility            │
│     • Strategic alignment              │
│     • Risk assessment                  │
│                                        │
│  Exchange 1/3                          │
│  ⏱️ Time elapsed: 4.1s                │
└────────────────────────────────────────┘
```

**4. Sub-Agent Execution (Flow B - Phase 1)**
```
┌────────────────────────────────────────┐
│  🤖 CodingAgent Executing...          │
├────────────────────────────────────────┤
│                                        │
│  📥 Received guidance from Advisor     │
│     Layer (consensus + synthesis)      │
│                                        │
│  ⚙️ Executing task...                  │
│     • Analyzing requirements           │
│     • Generating code                  │
│     • Validating output                │
│                                        │
│  Exchange 1/3                          │
│  ⏱️ Time elapsed: 5.3s                │
└────────────────────────────────────────┘
```

**5. Mother Base Approval (Flow B - Phase 2)**
```
┌────────────────────────────────────────┐
│  👑 Mother Base Approving Work...     │
├────────────────────────────────────────┤
│                                        │
│  📤 Sub-Agent submitted completed work │
│                                        │
│  🔍 Mother Base reviewing:             │
│     • Code quality                     │
│     • Requirements met                 │
│     • Best practices followed          │
│                                        │
│  Decision: APPROVE / REVISION          │
│                                        │
│  Approval Exchange 1/3                 │
│  ⏱️ Time elapsed: 7.9s                │
└────────────────────────────────────────┘
```

**6. Complete**
```
┌────────────────────────────────────────┐
│  ✅ Process Complete                  │
├────────────────────────────────────────┤
│                                        │
│  📊 Summary:                           │
│     • Consensus rounds: 2              │
│     • Mother Base exchanges: 1         │
│     • Total time: 8.2s                 │
│     • Final status: APPROVED           │
│                                        │
│  💡 View full transcript ↓            │
└────────────────────────────────────────┘
```

---

## 📝 Main Answer Area

### Final Result Display

**Progressive Disclosure:**
1. **Loading state** - Skeleton/spinner during processing
2. **Streaming answer** - Text appears as consensus completes
3. **Final answer** - Formatted markdown with syntax highlighting
4. **Metadata footer** - Stats, sources, confidence

**Answer Format:**
```
┌─────────────────────────────────────────────────┐
│  🎯 Strategic Decision                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  # Recommendation: Use Microservices           │
│                                                 │
│  Based on multi-AI consensus analysis:         │
│                                                 │
│  ## Key Points                                  │
│  • Scalability benefits outweigh complexity    │
│  • Team size supports distributed development  │
│  • Modern tooling reduces operational overhead │
│                                                 │
│  ## Considerations                              │
│  • Initial setup cost                          │
│  • Monitoring complexity                       │
│  • Network latency                             │
│                                                 │
│  ## Implementation Path                         │
│  1. Start with 2-3 services                    │
│  2. Establish deployment pipeline              │
│  3. Gradually decompose monolith               │
│                                                 │
├─────────────────────────────────────────────────┤
│  ⏱️ 8.2s  •  📊 Consensus: 100%  •  ✅ Approved │
│  🤖 Contributors: Claude, DeepSeek, Qwen, OR   │
└─────────────────────────────────────────────────┘
```

### Interactive Elements:
- **Copy button** - Copy entire answer
- **Share link** - Permalink to this query
- **Export** - PDF/Markdown download
- **Thumbs up/down** - User feedback
- **View transcript** - Expand full consensus debate

---

## 💬 Chat Interface

### Conversation Flow

**Design:** Google/Perplexity style conversation interface

```
┌─────────────────────────────────────────────────┐
│  💬 Conversation                        [New]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  👤 User                          12:34 PM      │
│  What's the best database for real-time chat?  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ 🧠 AkhAI                    12:34 PM    │  │
│  │                                         │  │
│  │ Based on multi-AI consensus...         │  │
│  │                                         │  │
│  │ Recommended: PostgreSQL with...        │  │
│  │ [Full answer with markdown formatting] │  │
│  │                                         │  │
│  │ ⏱️ 8.2s • 📊 100% • ✅ Approved         │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  👤 User                          12:35 PM      │
│  What about Redis for caching?                 │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │ 🧠 AkhAI                    12:35 PM    │  │
│  │                                         │  │
│  │ Great follow-up question...            │  │
│  │ [Contextual answer considering...      │  │
│  │  previous discussion]                  │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
│  [Type follow-up question...]            [↵]  │
└─────────────────────────────────────────────────┘
```

### Features:
- **Context preservation** - Each question remembers previous conversation
- **Conversation history** - Left sidebar with recent chats
- **Branching** - Fork conversation from any message
- **Sharing** - Public/private conversation links
- **Export** - Save entire conversation

---

## 📊 Dashboard

### User Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🧠 AkhAI Dashboard                      [⚙️ Settings] [👤]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │ 📈 Usage This Month     │  │ 💰 Costs                │      │
│  │                         │  │                         │      │
│  │   347 queries           │  │   $12.45 / $29.00      │      │
│  │   ████████░░░ 69%       │  │   ██████████░ 43%      │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📜 Recent Queries                                        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  What's the best database...    Flow A  •  8.2s  •  ✅  │  │
│  │  Implement JWT authentication... Flow B  •  12.1s •  ✅  │  │
│  │  Compare React vs Vue...        Flow A  •  7.8s  •  ✅  │  │
│  │  Debug this TypeScript error... Flow B  •  9.3s  •  ✅  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │ 🤖 AI Providers        │  │ ⚡ Performance         │        │
│  │                        │  │                        │        │
│  │ ✅ Anthropic          │  │ Avg response: 8.7s     │        │
│  │ ✅ DeepSeek           │  │ Success rate: 98.2%    │        │
│  │ ✅ Qwen               │  │ Consensus: 92% avg     │        │
│  │ ✅ OpenRouter         │  │                        │        │
│  │ ❌ OpenAI (no key)    │  │                        │        │
│  └────────────────────────┘  └────────────────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Sections:

**1. Usage Metrics**
- Queries this month
- Remaining quota
- Progress bar
- Upgrade prompt (if near limit)

**2. Cost Tracking**
- Total spend this month
- Per-provider breakdown
- Cost per query average
- Budget alerts

**3. Recent Queries**
- Chronological list
- Click to view full result
- Flow type indicator
- Time and status badges
- Search/filter functionality

**4. API Configuration**
- Provider status (connected/disconnected)
- API key management
- Test connection buttons
- Usage per provider

**5. Performance Stats**
- Average response time
- Success rate
- Consensus achievement rate
- Error rate

**6. Agent Management**
- List registered sub-agents
- Create custom agents
- Agent performance stats
- Enable/disable agents

---

## ⚙️ Settings Page

### Configuration Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ Settings                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🔑 API Keys                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Anthropic API Key                                        │  │
│  │ [sk-ant-***************************] ✅ Connected  [Test]│  │
│  │                                                          │  │
│  │ OpenAI API Key                                           │  │
│  │ [sk-***************************] ✅ Connected      [Test]│  │
│  │                                                          │  │
│  │ DeepSeek API Key                                         │  │
│  │ [sk-***************************] ✅ Connected      [Test]│  │
│  │                                                          │  │
│  │ + Add more providers                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  🤖 Default Configuration                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Mother Base:     [Anthropic Claude Sonnet 4  ▼]         │  │
│  │ Advisor Slot 1:  [DeepSeek                   ▼]         │  │
│  │ Advisor Slot 2:  [Qwen                       ▼]         │  │
│  │ Advisor Slot 3:  [OpenRouter (fixed)]                   │  │
│  │ Advisor Slot 4:  [Same as Mother Base (fixed)]          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ⏱️ Performance                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Max Consensus Rounds: [3 ▼] (2 min each)                │  │
│  │ Max Flow Exchanges:   [3 ▼]                             │  │
│  │ Enable Caching:       [✓] Cache consensus results       │  │
│  │ Cache TTL:            [1 hour ▼]                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  💰 Budget & Limits                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Monthly Budget:       [$100.00        ]                  │  │
│  │ Per-Query Limit:      [$5.00          ]                  │  │
│  │ Alert at:             [80%] of budget                    │  │
│  │ Stop at:              [100%] of budget                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  📧 Notifications                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [✓] Email notifications                                  │  │
│  │ [✓] Budget alerts                                        │  │
│  │ [✓] Weekly usage summary                                 │  │
│  │ [ ] System status updates                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [Save Changes]                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System

### Color Palette

**Primary Colors:**
- **AkhAI Blue:** `#3B82F6` (brand color)
- **Deep Purple:** `#8B5CF6` (accent)
- **Teal:** `#14B8A6` (success)

**Semantic Colors:**
- **Agree/Success:** `#10B981` (green)
- **Disagree/Warning:** `#F59E0B` (amber)
- **Error/Danger:** `#EF4444` (red)
- **Info:** `#06B6D4` (cyan)

**Neutral Palette:**
- **Background:** `#FAFAFA` (light mode) / `#0F1419` (dark mode)
- **Surface:** `#FFFFFF` (light) / `#1A1F2E` (dark)
- **Border:** `#E5E7EB` (light) / `#2D3748` (dark)
- **Text Primary:** `#111827` (light) / `#F9FAFB` (dark)
- **Text Secondary:** `#6B7280` (light) / `#9CA3AF` (dark)

### Typography

**Font Stack:**
- **Headings:** Inter, system-ui, sans-serif
- **Body:** Inter, system-ui, sans-serif
- **Code:** JetBrains Mono, Consolas, monospace

**Sizes:**
- **H1:** 2.5rem (40px) - Page title
- **H2:** 2rem (32px) - Section headers
- **H3:** 1.5rem (24px) - Subsections
- **Body:** 1rem (16px) - Default text
- **Small:** 0.875rem (14px) - Metadata, labels
- **Tiny:** 0.75rem (12px) - Captions

### Spacing

**8px Grid System:**
- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px
- **3xl:** 64px

### Components

**Button Styles:**
```css
Primary:   bg-blue-600 hover:bg-blue-700 text-white
Secondary: bg-gray-200 hover:bg-gray-300 text-gray-900
Ghost:     bg-transparent hover:bg-gray-100 text-gray-700
Danger:    bg-red-600 hover:bg-red-700 text-white
```

**Card Styles:**
```css
Default:   bg-white border border-gray-200 rounded-lg shadow-sm
Elevated:  bg-white rounded-lg shadow-md
Flat:      bg-gray-50 rounded-lg
```

**Status Badges:**
```css
Success:   bg-green-100 text-green-800
Warning:   bg-amber-100 text-amber-800
Error:     bg-red-100 text-red-800
Info:      bg-blue-100 text-blue-800
Neutral:   bg-gray-100 text-gray-800
```

---

## 🔄 Real-Time Updates

### Server-Sent Events (SSE)

**Connection:**
```typescript
const eventSource = new EventSource('/api/query/stream?queryId=123');

eventSource.addEventListener('consensus-round', (event) => {
  const data = JSON.parse(event.data);
  // Update verification window with round data
});

eventSource.addEventListener('redactor-synthesis', (event) => {
  const data = JSON.parse(event.data);
  // Show redactor synthesis progress
});

eventSource.addEventListener('mother-base-review', (event) => {
  const data = JSON.parse(event.data);
  // Show Mother Base review status
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  // Display final result
  eventSource.close();
});
```

### Event Types:

**1. `consensus-round`**
```json
{
  "type": "consensus-round",
  "round": 1,
  "maxRounds": 3,
  "responses": [
    {
      "slot": 1,
      "family": "deepseek",
      "role": "brainstormer",
      "stance": "AGREE",
      "content": "Technical analysis shows..."
    },
    {
      "slot": 2,
      "family": "qwen",
      "role": "brainstormer",
      "stance": "DISAGREE",
      "content": "Strategic concerns include..."
    }
  ],
  "consensusPercentage": 33,
  "consensusReached": false,
  "timestamp": 1704067200000
}
```

**2. `redactor-synthesis`**
```json
{
  "type": "redactor-synthesis",
  "status": "in-progress",
  "content": "Combining perspectives from Technical, Strategic, and Diversity advisors...",
  "timestamp": 1704067205000
}
```

**3. `mother-base-review`**
```json
{
  "type": "mother-base-review",
  "exchange": 1,
  "maxExchanges": 3,
  "decision": "APPROVE",
  "content": "The recommendation is well-reasoned and addresses all key concerns...",
  "timestamp": 1704067210000
}
```

**4. `sub-agent-execution`**
```json
{
  "type": "sub-agent-execution",
  "agentName": "CodingAgent",
  "phase": 1,
  "exchange": 1,
  "status": "executing",
  "content": "Generating TypeScript code based on guidance...",
  "timestamp": 1704067215000
}
```

**5. `complete`**
```json
{
  "type": "complete",
  "flow": "A",
  "result": {
    "finalDecision": "...",
    "approved": true,
    "totalRounds": 2,
    "totalExchanges": 1,
    "totalTime": 8200,
    "consensusPercentage": 100
  },
  "timestamp": 1704067220000
}
```

---

## 📱 Responsive Design

### Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### Mobile Layout

**Search Page:**
```
┌──────────────────────┐
│  🧠 AkhAI            │
├──────────────────────┤
│                      │
│  [Search box]        │
│                      │
│  ┌────────────────┐ │
│  │ Main Answer    │ │
│  │                │ │
│  └────────────────┘ │
│                      │
│  [↓ View Process]    │
│                      │
│  ┌────────────────┐ │
│  │ Verification   │ │
│  │ Window         │ │
│  │ (collapsed)    │ │
│  └────────────────┘ │
│                      │
└──────────────────────┘
```

**Key Mobile Adaptations:**
- Single column layout
- Verification window collapsible
- Bottom navigation
- Swipe gestures for history
- Sticky search bar

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

**Requirements:**
- Color contrast ratio ≥ 4.5:1 for text
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators
- Alt text for all images
- ARIA labels for interactive elements

**Keyboard Shortcuts:**
- `/` - Focus search
- `Esc` - Clear search / close modals
- `↑↓` - Navigate conversation history
- `Ctrl+Enter` - Submit query
- `Ctrl+C` - Copy answer

---

## 🚀 Performance Targets

### Metrics

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **First Input Delay:** < 100ms

### Optimization Strategies

**1. Code Splitting**
- Lazy load verification window
- Separate bundles for Flow A/B
- Dynamic imports for dashboard

**2. Image Optimization**
- WebP format with fallbacks
- Responsive images (srcset)
- Lazy loading below fold
- CDN delivery

**3. Caching**
- Service worker for offline support
- Cache API responses (1 hour TTL)
- Static asset caching
- Prefetch likely next queries

**4. Bundle Size**
- Target: < 200KB initial bundle
- Tree shaking unused code
- Minimize dependencies
- Use modern build tools (Vite/Turbopack)

---

## 🛠️ Technology Stack (Planned)

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5.3+
- **Styling:** Tailwind CSS 3.4+
- **UI Components:** Radix UI + Headless UI
- **State Management:** Zustand / Jotai
- **Real-time:** Server-Sent Events (SSE)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts / Chart.js
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Backend

- **Framework:** Next.js API Routes (initially)
- **Future:** Separate Node.js + Express API
- **Database:** PostgreSQL (Supabase / Neon)
- **Caching:** Redis
- **Session:** NextAuth.js / Clerk
- **File Storage:** S3 / Vercel Blob
- **Analytics:** PostHog / Plausible

### Infrastructure

- **Hosting:** Vercel (frontend + API)
- **Database:** Neon / Supabase
- **Cache:** Upstash Redis
- **CDN:** Vercel Edge Network
- **Monitoring:** Sentry + Vercel Analytics
- **Logging:** Axiom / BetterStack

---

## 🔐 Security Considerations

### Frontend Security

- **API Keys:** Never expose in client code
- **HTTPS Only:** Force HTTPS in production
- **CSP Headers:** Content Security Policy
- **XSS Prevention:** Sanitize user input
- **CSRF Protection:** Token-based protection

### User Data

- **Encryption:** Encrypt sensitive data at rest
- **Privacy:** No query logging without consent
- **GDPR Compliance:** Data export/deletion
- **Rate Limiting:** Prevent abuse
- **Authentication:** OAuth 2.0 / JWT

---

## 📊 Analytics & Tracking

### Events to Track

**User Actions:**
- Query submitted (flow type, length)
- Result viewed (time to view)
- Answer copied/shared
- Follow-up question asked
- Settings changed
- API key added/removed

**System Events:**
- Consensus rounds (count, time)
- Mother Base exchanges (count, time)
- Sub-agent executions (count, time)
- Errors encountered
- Provider failures
- Cache hits/misses

**Business Metrics:**
- Daily active users (DAU)
- Monthly active users (MAU)
- Queries per user
- Conversion to paid tier
- Churn rate
- Cost per query

---

## 🎯 User Flows

### Flow 1: First-Time User

```
1. Land on homepage
   ↓
2. See clear value proposition
   ↓
3. Try example query (pre-filled)
   ↓
4. Watch live consensus visualization
   ↓
5. See high-quality answer
   ↓
6. Sign up for account
   ↓
7. Configure API keys
   ↓
8. Start using (free tier)
```

### Flow 2: Power User

```
1. Login to dashboard
   ↓
2. Review recent queries
   ↓
3. Check usage/costs
   ↓
4. Ask new strategic question (Flow A)
   ↓
5. Watch consensus unfold
   ↓
6. Ask follow-up in conversation
   ↓
7. Export conversation
   ↓
8. Share with team
```

### Flow 3: Developer

```
1. Read API documentation
   ↓
2. Get API key from dashboard
   ↓
3. Test with CLI/Postman
   ↓
4. Integrate into app
   ↓
5. Monitor usage in dashboard
   ↓
6. Upgrade to higher tier
```

---

## 🧪 A/B Testing Ideas

### Experiments to Run

**1. Search Interface**
- Centered vs top-aligned search bar
- With/without example queries
- Flow selector position

**2. Verification Window**
- Default expanded vs collapsed
- Left vs right placement
- Detailed vs summary view

**3. Answer Display**
- Progressive disclosure vs full display
- With/without AI contributor badges
- Inline code highlighting styles

**4. Pricing Page**
- Feature comparison table styles
- Monthly vs annual billing emphasis
- Free trial duration (7/14/30 days)

---

## 🎬 Animations & Transitions

### Micro-interactions

**Search Bar:**
- Focus: Scale up 2%, border color change
- Submit: Ripple effect from button

**Verification Window:**
- Round start: Slide in from top
- Response typing: Character-by-character reveal
- Consensus reached: Checkmark animation

**Answer Display:**
- Loading: Skeleton pulse
- Streaming: Fade in per paragraph
- Complete: Subtle bounce

**Status Badges:**
- State change: Color morph transition
- Hover: Slight scale up (1.05x)

**Dashboard Cards:**
- Hover: Lift shadow (4px → 8px)
- Click: Scale down (0.98x) + ripple

---

## 📋 Future Enhancements

### Phase 2.5 (Post-Launch)

**Voice Interface:**
- Voice input for queries
- Text-to-speech for answers
- Hands-free mode

**Collaboration:**
- Shared workspaces
- Team query history
- Comments on answers
- Export to Notion/Confluence

**Advanced Visualization:**
- Consensus decision tree
- AI debate graph
- Cost breakdown charts
- Performance analytics

**Customization:**
- Custom themes
- Adjustable consensus thresholds
- Provider priority ranking
- Custom verification prompts

**Mobile App:**
- Native iOS/Android apps
- Push notifications
- Offline mode
- Widget for quick queries

---

## 🔮 Vision: The Future UI

### 3D Consensus Visualization (Phase 3+)

Imagine a 3D space where users can see AI advisors as nodes in a network, with connections showing agreement/disagreement flows, animated in real-time as consensus emerges.

**AR/VR Experience:**
- Visualize consensus in 3D space
- Walk through AI debate room
- Interact with advisor nodes
- Immersive decision-making

---

**Last Updated:** December 2025
**Version:** 1.0
**Status:** Planning Phase (Phase 2 Target: Q2 2026)
**Design Tools:** Figma mockups to be created
**Prototype:** Interactive prototype with Vercel v0 planned

---

**Next Steps:**
1. Create Figma design system
2. Build interactive prototype
3. User testing with mockups
4. Frontend development (Next.js)
5. Backend API integration
6. Beta launch

