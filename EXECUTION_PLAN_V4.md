# 🎯 AKHAI EXECUTION PLAN - FUNCTIONALITY FIRST

## Version 4.0 - December 31, 2025
## Sequence: Build → Test → Prepare → Launch

---

# PRIORITY ORDER

```
┌─────────────────────────────────────────────────────────────────┐
│  1. FUNCTIONALITY    All features working on localhost          │
│         ↓                                                        │
│  2. TESTING          Full QA, bug fixes, polish                 │
│         ↓                                                        │
│  3. DEPLOYMENT       secure.ai domain, family beta              │
│         ↓                                                        │
│  4. PREPARATION      Social, partnerships, PH assets            │
│         ↓                                                        │
│  5. LAUNCH           Product Hunt + Commercialize               │
└─────────────────────────────────────────────────────────────────┘
```

---

# STAGE 1: FUNCTIONALITY (Week 1-2)

## Already Complete ✅

| Feature | Status | Lines |
|---------|--------|-------|
| 7 Methodologies | ✅ | 3,000+ |
| Grounding Guard | ✅ | 1,500+ |
| Gnostic Intelligence | ✅ | 3,700+ |
| Crypto Payments (302 currencies) | ✅ | 1,200+ |
| Profile System | ✅ | 800+ |
| Side Canal Core | ✅ | 1,200+ |
| Mind Map | ✅ | 500+ |
| Language Selector (9 langs) | ✅ | 400+ |
| Hebrew Terms | ✅ | 600+ |
| History System | ✅ | - |

## To Complete 🔧

| # | Feature | Time | Priority |
|---|---------|------|----------|
| 1 | **SideChat/QuickChat** | 2-3h | ⭐⭐⭐ |
| 2 | **Depth Annotations Integration** | 1-2h | ⭐⭐⭐ |
| 3 | **Settings Page Expansion** | 2-3h | ⭐⭐ |
| 4 | **Legend Mode Toggle** | 2-3h | ⭐⭐ |
| 5 | **Stripe Integration** | 3-4h | ⭐⭐ |
| 6 | **Wisdom Points UI** | 3-4h | ⭐ |

**Total: ~15-20 hours**

---

# CLAUDE CLI COMMANDS - SEQUENTIAL EXECUTION

## Command 1: SideChat/QuickChat Activation

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Activate SideChat/QuickChat as floating mini-assistant

PHASE 1 - ANALYZE:
- Read components/SideChat.tsx - check current state
- Read lib/stores/ - check existing stores
- Identify what exists vs what needs creation

PHASE 2 - CREATE STORE:
File: lib/stores/quick-chat-store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface QuickMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface QuickChatStore {
  isOpen: boolean
  messages: QuickMessage[]
  isLoading: boolean
  toggle: () => void
  open: () => void
  close: () => void
  addMessage: (msg: Omit<QuickMessage, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

- Persist to localStorage 'akhai-quick-chat'
- Export useQuickChatStore hook

PHASE 3 - CREATE BUTTON:
File: components/QuickChatButton.tsx

- Fixed position: bottom-6 right-6
- Size: w-12 h-12
- Icon: Zap from lucide-react (or ⚡)
- Hover tooltip: 'Quick Chat (⌘⇧Q)'
- onClick: toggle store
- Styling: bg-zinc-900 hover:bg-zinc-800 border border-zinc-700
- Add subtle pulse animation on mount

PHASE 4 - CREATE PANEL:
File: components/QuickChatPanel.tsx

Structure:
- Position: fixed bottom-24 right-6
- Size: w-[380px] h-[480px]
- Animation: animate-in slide-in-from-bottom-4

Header:
- Title: '⚡ QUICK CHAT' (10px uppercase tracking-wider)
- Buttons: minimize (─), close (✕)

Body:
- Scrollable message list
- User messages: ml-auto bg-zinc-800 max-w-[80%]
- AI messages: mr-auto bg-zinc-900 max-w-[85%]
- Include basic markdown rendering

Footer:
- Input: bg-zinc-900 border-zinc-700
- Send button or Enter to submit
- Action buttons: [Push to Main] [Clear]

PHASE 5 - CREATE API:
File: app/api/quick-query/route.ts

- POST handler
- Accept: { message: string }
- Use Direct methodology for speed
- Max tokens: 500
- Return: { content: string, methodology: 'direct' }
- Handle streaming if possible, else simple response

PHASE 6 - ADD KEYBOARD SHORTCUT:
File: hooks/useKeyboardShortcuts.ts

- Create hook for global keyboard shortcuts
- Listen for Cmd+Shift+Q (Mac) / Ctrl+Shift+Q (Win)
- Call quickChatStore.toggle()
- Prevent default behavior

PHASE 7 - INTEGRATE:
File: app/layout.tsx

- Import QuickChatButton, QuickChatPanel
- Import useKeyboardShortcuts
- Add components before closing body tag
- Initialize keyboard shortcuts

PHASE 8 - PUSH TO MAIN:
- When 'Push to Main' clicked:
  - Get messages from quick-chat-store
  - Add to main chat-store
  - Close quick chat
  - Navigate to main page if not there

STYLING RULES:
- bg-zinc-950 for panel background
- border-zinc-800 for borders
- text-zinc-400 for secondary text
- text-zinc-100 for primary text
- NO rounded corners (use rounded-none or rounded-sm)
- NO emojis except ⚡ in header

TEST AFTER COMPLETION:
1. Click button → panel opens
2. Cmd+Shift+Q → panel toggles
3. Type message → get response
4. Push to Main → appears in main chat
5. Refresh → state persists"
```

---

## Command 2: Depth Annotations Integration

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Integrate existing Depth Annotations into all chat interfaces

EXISTING FILES (DO NOT RECREATE):
- lib/depth-annotations.ts (389 lines)
- components/DepthAnnotation.tsx (428 lines)  
- hooks/useDepthAnnotations.ts (215 lines)

STEP 1 - ADD PROVIDER:
File: app/layout.tsx

- Import { DepthProvider } from '@/hooks/useDepthAnnotations'
- Wrap children: <DepthProvider>{children}</DepthProvider>

STEP 2 - MAIN CHAT INTEGRATION:
File: app/page.tsx

Find message rendering section and:

A) Import components:
import { StreamingDepthText } from '@/components/DepthAnnotation'
import { useDepthAnnotations } from '@/hooks/useDepthAnnotations'

B) Initialize hook in component:
const { annotations, processChunk, processText, reset, config } = useDepthAnnotations({
  userContext: { topics: extractedTopics }
})

C) In streaming handler (where chunks arrive):
- Call processChunk(chunk) after updating text state

D) Replace message content rendering:
- Find where message.content is displayed
- Replace with:
<StreamingDepthText
  text={message.content}
  annotations={messageAnnotations}
  isStreaming={message.isStreaming || false}
  onExpand={(query) => {
    // Start new query with this topic
    handleNewQuery(query)
  }}
/>

E) Reset on new query:
- When user submits new query, call reset()

STEP 3 - QUICKCHAT INTEGRATION:
File: components/QuickChatPanel.tsx

- Same pattern as main chat
- Use config={{ density: 'minimal' }} for compact display
- Simpler: can use DepthText instead of StreamingDepthText

STEP 4 - ADD TOGGLE:
File: components/DepthToggle.tsx (create)

Simple toggle component:
- Import { useDepthConfig } from '@/hooks/useDepthAnnotations'
- Toggle switch for config.enabled
- Can be used in navbar or settings

STEP 5 - VERIFY DETECTION:
Test these should trigger annotations:
- Numbers/percentages: '87% accuracy' → ᵐ metric
- Dates: 'founded in 2021' → ᶠ fact
- Hebrew terms: 'Kether protocol' → ᵈ detail with כֶּתֶר
- References: 'as you mentioned' → ᶜ connection

TEST:
1. Send query with numbers → see metric annotations
2. Send query about Sefirot → see Hebrew detail annotations
3. Toggle depth off → annotations disappear
4. Click expandable annotation → triggers new query"
```

---

## Command 3: Settings Page Expansion

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Create comprehensive Settings page

STEP 1 - CHECK CURRENT:
- Read app/settings/page.tsx (or wherever settings are)
- Understand current implementation

STEP 2 - CREATE/UPDATE SETTINGS PAGE:
File: app/settings/page.tsx

Page structure with sections:

=== HEADER ===
'SETTINGS' - 10px uppercase tracking-[0.3em]

=== SECTION: DISPLAY ===
- Language: <LanguageSelector /> (existing component)
- Theme: Light/Dark toggle (placeholder, future)

=== SECTION: FEATURES ===
- Depth Annotations: Toggle (on/off)
- Depth Density: Radio buttons (Minimal/Standard/Maximum)
- Quick Chat: Toggle (on/off)
- Side Canal: Toggle (on/off)
- Auto-Synopsis: Toggle (on/off) - currently disabled by default

=== SECTION: AI BEHAVIOR ===
- Default Methodology: Dropdown (Auto/Direct/CoD/BoT/ReAct/PoT/GTP)
- Legend Mode: Toggle + explanation
- Show Cost: Toggle (show per-query cost estimate)
- Max Response Length: Slider (Short/Medium/Long/Unlimited)

=== SECTION: GROUNDING GUARD ===
Keep existing triggers configuration

=== SECTION: PRIVACY ===
- Save History: Toggle
- Analytics: Toggle (PostHog)
- [Clear All History] button with confirmation

=== SECTION: ADVANCED === (collapsible)
- API Keys (masked inputs):
  - Anthropic API Key
  - DeepSeek API Key  
  - Mistral API Key
  - xAI API Key
- [Save Keys] button
- Warning: 'Keys stored in browser only'

STEP 3 - CREATE SETTINGS STORE:
File: lib/stores/settings-store.ts

interface SettingsStore {
  // Display
  language: string
  theme: 'light' | 'dark' | 'system'
  
  // Features
  depthEnabled: boolean
  depthDensity: 'minimal' | 'standard' | 'maximum'
  quickChatEnabled: boolean
  sideCanalEnabled: boolean
  autoSynopsisEnabled: boolean
  
  // AI
  defaultMethodology: string
  legendMode: boolean
  showCost: boolean
  maxResponseLength: 'short' | 'medium' | 'long' | 'unlimited'
  
  // Privacy
  saveHistory: boolean
  analyticsEnabled: boolean
  
  // Actions
  updateSetting: (key: string, value: any) => void
  resetToDefaults: () => void
}

Persist to localStorage: 'akhai-settings'

STEP 4 - STYLING:
- Each section: border-b border-zinc-800 pb-6 mb-6
- Section headers: text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-4
- Toggle switches: bg-zinc-800 when off, bg-emerald-600 when on
- Inputs: bg-zinc-900 border-zinc-700
- NO rounded corners on sections

STEP 5 - CONNECT TO FEATURES:
- Depth settings → useDepthConfig
- Quick chat → useQuickChatStore
- Side Canal → useSideCanalStore
- Language → existing language system

TEST:
1. Change settings → immediately reflected
2. Refresh page → settings persist
3. Reset to defaults → all options reset
4. Clear history → confirmation then clear"
```

---

## Command 4: Legend Mode Implementation

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Implement Legend Mode (Haiku vs Opus toggle)

CONCEPT:
- Normal Mode: Claude Haiku (fast, cheap) - $0.007/query avg
- Legend Mode: Claude Opus (powerful, premium) - $0.075/query avg
- User toggles between modes
- Cost indicator shows estimate before query

STEP 1 - UPDATE SETTINGS STORE:
File: lib/stores/settings-store.ts

Add:
- legendMode: boolean (default false)
- showCostEstimate: boolean (default true)

STEP 2 - CREATE LEGEND MODE TOGGLE:
File: components/LegendModeToggle.tsx

Visual toggle with:
- Left: 'NORMAL' with Haiku icon/label
- Right: 'LEGEND 👑' with Opus label
- Animated slide between states
- Below: Cost estimate text
  - Normal: '~$0.007 per query'
  - Legend: '~$0.075 per query'

Styling:
- Container: bg-zinc-900 border border-zinc-700 p-1
- Active side: bg-zinc-800
- Text: 9px uppercase
- Crown emoji only exception to no-emoji rule (it's the brand)

STEP 3 - ADD TO NAVBAR:
File: components/Navbar.tsx

- Add LegendModeToggle component
- Position: Right side, before user menu
- Compact version for navbar

STEP 4 - CREATE COST INDICATOR:
File: components/CostIndicator.tsx

Shows before sending query:
- Estimate based on query length
- Different rates for Normal vs Legend
- Format: 'Est. $0.02' in small grey text
- Position: Near send button

Cost calculation:
- Base: $0.003 (Normal) / $0.015 (Legend)
- Per 100 chars: +$0.001 (Normal) / +$0.005 (Legend)
- With web search: +$0.005 / +$0.010
- GTP methodology: ×3 multiplier

STEP 5 - UPDATE API:
File: app/api/simple-query/route.ts

- Read legendMode from request or cookie
- Select model based on mode:
  - Normal: claude-3-haiku-20240307
  - Legend: claude-3-opus-20240229 (or latest)
- Log actual cost for tracking

STEP 6 - ADD MONTHLY TRACKER:
File: components/CostTracker.tsx

- Track cumulative cost this month
- Store in localStorage with monthly reset
- Show in profile or settings: 'This month: $12.45'

STEP 7 - INTEGRATE:
- Add toggle to Navbar
- Add cost indicator to chat input area
- Add tracker to Profile page
- Add settings to Settings page

TEST:
1. Toggle Legend Mode → visual change
2. Send query in Normal → uses Haiku
3. Send query in Legend → uses Opus  
4. Check cost estimate updates with query length
5. Verify monthly cost tracking"
```

---

## Command 5: Stripe Integration

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Integrate Stripe for traditional payments (alongside crypto)

PREREQUISITES:
- Stripe account created
- API keys ready (test mode first)

STEP 1 - INSTALL:
pnpm add stripe @stripe/stripe-js

STEP 2 - ENV VARIABLES:
Add to .env.local:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

STEP 3 - CREATE STRIPE CLIENT:
File: lib/stripe.ts

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

// Products
export const PRODUCTS = {
  PRO: {
    name: 'AkhAI Pro',
    price: 2000, // $20.00 in cents
    interval: 'month' as const,
    features: ['Unlimited queries', 'All 7 methodologies', 'Priority support']
  },
  LEGEND: {
    name: 'AkhAI Legend',
    price: 20000, // $200.00
    interval: 'month' as const,
    features: ['Everything in Pro', 'Claude Opus access', 'Dedicated support', 'Early features']
  }
}

STEP 4 - CREATE CHECKOUT API:
File: app/api/stripe/checkout/route.ts

POST handler:
- Accept: { tier: 'PRO' | 'LEGEND', successUrl, cancelUrl }
- Create Stripe checkout session
- Return: { sessionId, url }

STEP 5 - CREATE WEBHOOK:
File: app/api/webhooks/stripe/route.ts

Handle events:
- checkout.session.completed → Activate subscription
- customer.subscription.updated → Update tier
- customer.subscription.deleted → Downgrade to free
- invoice.payment_failed → Notify user

Verify signature with STRIPE_WEBHOOK_SECRET

STEP 6 - CREATE PORTAL API:
File: app/api/stripe/portal/route.ts

- Create billing portal session
- User can manage subscription, update payment, cancel

STEP 7 - UPDATE PAYMENT MODAL:
File: components/PaymentModal.tsx (or update pricing page)

Add Stripe option alongside crypto:
- Tab 1: Crypto (existing CryptoPaymentModalDual)
- Tab 2: Card (Stripe checkout)

Card flow:
1. Select tier (Pro/Legend)
2. Click 'Pay with Card'
3. Redirect to Stripe checkout
4. Return to success page

STEP 8 - CREATE SUCCESS PAGE:
File: app/payment/success/page.tsx

- Parse session_id from URL
- Verify payment with Stripe
- Show success message
- Update user tier in database
- Redirect to dashboard

STEP 9 - UPDATE USER/SUBSCRIPTION:
File: lib/database.ts (or create lib/subscriptions.ts)

Functions:
- getUserSubscription(userId)
- updateSubscription(userId, tier, stripeCustomerId)
- cancelSubscription(userId)

Database:
- Add stripe_customer_id to users table
- Add subscriptions table or fields

STEP 10 - INTEGRATE WITH PROFILE:
File: app/profile/page.tsx

Show:
- Current tier
- Subscription status
- [Manage Subscription] button → Stripe portal
- [Upgrade] button if on free tier

TEST (use Stripe test mode):
1. Click upgrade → goes to Stripe checkout
2. Use test card 4242424242424242
3. Complete payment → returns to success
4. Check profile → shows Pro/Legend tier
5. Manage subscription → opens Stripe portal"
```

---

## Command 6: Wisdom Points UI

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Create Wisdom Points UI components

EXISTING:
- lib/wisdom-points.ts (747 lines) - Logic exists
- Database tables exist

STEP 1 - CREATE POINTS DISPLAY:
File: components/WisdomPointsBadge.tsx

Compact badge showing:
- Current points number
- Current level icon
- Level name on hover tooltip

Example: '1,234 🔧' (Yesod Builder)

STEP 2 - CREATE LEVEL CARD:
File: components/WisdomLevelCard.tsx

Shows user's current level:
- Level number and name
- Progress bar to next level
- Points: current / needed for next
- Benefits list for current level
- Mini Sefirot indicator

STEP 3 - CREATE POINTS HISTORY:
File: components/PointsHistory.tsx

Table/list of recent point transactions:
- Date
- Action (query, research, contribution)
- Points earned
- Multiplier if any
- Running total

STEP 4 - CREATE LEADERBOARD:
File: components/Leaderboard.tsx

Global or friends leaderboard:
- Rank
- Username (or anonymous ID)
- Level badge
- Total points
- Highlight current user

STEP 5 - INTEGRATE INTO PROFILE:
File: app/profile/page.tsx

Add new tab or section:
- 'WISDOM' tab alongside existing tabs
- Show WisdomLevelCard
- Show PointsHistory
- Link to full leaderboard

STEP 6 - ADD TO NAVBAR:
File: components/Navbar.tsx

- Add WisdomPointsBadge
- Click → goes to profile wisdom tab

STEP 7 - AWARD POINTS ON QUERY:
File: app/api/simple-query/route.ts

After successful response:
- Calculate points based on:
  - Methodology used (GTP = more points)
  - Query complexity
  - Legend mode multiplier
- Call awardPoints(userId, amount, reason)
- Return points earned in response

STEP 8 - STYLING:
- Points number: font-mono text-emerald-400
- Level badges: Use Sefirot colors
- Progress bar: bg-zinc-800, fill with level color
- Cards: bg-zinc-900 border-zinc-800

TEST:
1. Check profile → see current points/level
2. Send query → points increase
3. Check history → see transaction
4. View leaderboard → see ranking"
```

---

# EXECUTION ORDER

Run commands in this sequence:

```
1. SideChat/QuickChat     ← Most visible new feature
2. Depth Annotations      ← Enriches all responses  
3. Settings Page          ← Central configuration
4. Legend Mode            ← Premium feature ready
5. Stripe Integration     ← Payment complete
6. Wisdom Points UI       ← Gamification layer
```

After each command, test locally before proceeding.

---

# STAGE 2: TESTING CHECKLIST

After all functionality complete, verify:

## Core Features
- [ ] All 7 methodologies return valid responses
- [ ] Grounding Guard triggers correctly
- [ ] Auto methodology selection works
- [ ] Streaming responses display properly

## New Features
- [ ] QuickChat opens/closes with button and keyboard
- [ ] QuickChat sends queries and receives responses
- [ ] Push to Main works correctly
- [ ] Depth Annotations appear on relevant content
- [ ] Depth toggle hides/shows annotations
- [ ] Click-to-expand triggers new queries
- [ ] All settings save and persist
- [ ] Legend Mode switches models correctly
- [ ] Cost indicator shows estimates
- [ ] Stripe checkout flow works (test mode)
- [ ] Crypto payments still work

## Existing Features
- [ ] Mind Map visualizes topics
- [ ] Side Canal tracks topics
- [ ] History saves and loads
- [ ] Profile shows correct stats
- [ ] Language switching works
- [ ] Hebrew terms display correctly
- [ ] RTL layout for Arabic/Hebrew

## Edge Cases
- [ ] Empty queries handled
- [ ] Very long queries handled
- [ ] Network errors show friendly messages
- [ ] Rate limiting graceful
- [ ] Mobile responsive

---

# STAGE 3-5: AFTER FUNCTIONALITY

Once Stage 1 & 2 complete:

## Stage 3: Deployment
- Deploy to secure.ai (or chosen domain)
- Configure production environment
- Family/friends beta (2 weeks)

## Stage 4: Preparation  
- Create Twitter/X @AkhAI account
- Build Product Hunt assets
- Setup Telegram community
- Reach out to AI influencers
- Create demo video

## Stage 5: Launch
- Countdown campaign
- Product Hunt launch
- Activate paid tiers
- Celebrate! 🎉

---

*Execute commands sequentially. Test after each. Ship when ready.*
