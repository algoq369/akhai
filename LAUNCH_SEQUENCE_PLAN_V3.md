# 🚀 AKHAI LAUNCH SEQUENCE PLAN

## Version 3.0 - December 31, 2025
## Revised Commercialization Order

---

# PHASE A: LOCAL COMPLETION (Current → Week 2)

## A.1 SideChat / MiniChat Activation

**Status:** Component exists but NOT activated
**Priority:** ⭐ IMMEDIATE
**Time:** 2-3 hours

### What Exists
```
components/SideChat.tsx     ← Built, not wired
components/SideChatButton.tsx (may need creation)
```

### What Needs To Happen
1. Add floating button to main layout
2. Wire keyboard shortcut (Cmd+Shift+Q)
3. Connect to API (use same endpoint or dedicated mini endpoint)
4. Add open/close state management
5. Test thoroughly on localhost

### UI Specification
```
┌──────────────────────────────────────────────────────────────────┐
│                         MAIN CHAT                                 │
│                                                                   │
│                                                                   │
│                                                                   │
│                                                                   │
│                                                                   │
│                                                   ┌─────────────┐│
│                                                   │ ⚡ Quick    ││
│                                                   │    Chat     ││
│                                                   └─────────────┘│
└──────────────────────────────────────────────────────────────────┘

When clicked:
┌──────────────────────────────────────────────────────────────────┐
│                         MAIN CHAT                                 │
│                                                                   │
│                          ┌─────────────────────────────────────┐ │
│                          │ ⚡ Quick Chat           ─ □ ✕       │ │
│                          ├─────────────────────────────────────┤ │
│                          │                                     │ │
│                          │ User: What's 15% of 230?            │ │
│                          │                                     │ │
│                          │ AI: 34.5                            │ │
│                          │     └─ ᵐ 230 × 0.15 = 34.5          │ │
│                          │                                     │ │
│                          │ [Push to Main] [Copy] [Clear]       │ │
│                          ├─────────────────────────────────────┤ │
│                          │ Ask quick question...           ⏎   │ │
│                          └─────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## A.2 Depth Annotations Integration

**Status:** Built (1,032 lines), NOT integrated
**Priority:** ⭐ HIGH
**Time:** 1-2 hours

### Files Ready
```
lib/depth-annotations.ts        (389 lines) ✅
components/DepthAnnotation.tsx  (428 lines) ✅
hooks/useDepthAnnotations.ts    (215 lines) ✅
```

### Integration Points
1. `app/page.tsx` - Main chat messages
2. `components/SideChat.tsx` - Mini chat messages
3. `app/layout.tsx` - DepthProvider wrapper
4. Settings toggle for enable/disable

---

## A.3 Settings Page Expansion

**Status:** Basic settings only
**Priority:** HIGH
**Time:** 3-4 hours

### Current Settings
- Grounding Guard triggers
- Provider status

### Add Settings
- [ ] Depth Annotations toggle + density slider
- [ ] Side Canal enable/disable
- [ ] SideChat/QuickChat toggle
- [ ] Legend Mode configuration
- [ ] Language preference
- [ ] Theme preference (future)

---

## A.4 Legend Mode Completion

**Status:** Indicator exists, no toggle
**Priority:** MEDIUM
**Time:** 2-3 hours

### Implementation
- [ ] Haiku ↔ Opus toggle switch
- [ ] Cost indicator per query
- [ ] Monthly cost tracker
- [ ] Model selector dropdown

---

## A.5 Full Localhost Testing

**Status:** Ongoing
**Priority:** ⭐ CRITICAL
**Time:** 1-2 days

### Test Checklist
- [ ] All 7 methodologies working
- [ ] Grounding Guard triggering correctly
- [ ] SideChat/MiniChat fully functional
- [ ] Depth Annotations appearing
- [ ] Side Canal topics tracking
- [ ] Mind Map visualization
- [ ] Crypto payments flow
- [ ] Profile/progression tracking
- [ ] History saving/loading
- [ ] Hebrew terms displaying
- [ ] Language switching
- [ ] RTL layout (Arabic/Hebrew)
- [ ] Mobile responsiveness

---

# PHASE B: FAMILY & FRIENDS DEPLOYMENT (Week 3)

## B.1 Domain Setup: secure.ai (or alternative)

**Priority:** HIGH after Phase A complete

### Tasks
1. Acquire/configure domain
2. Deploy to production (Vercel/Railway/Render)
3. Configure environment variables
4. Setup SSL/HTTPS
5. Configure CORS for domain
6. Test all features on production

---

## B.2 Private Beta Access

**Audience:** Family + Close Friends (10-20 people)
**Duration:** 1-2 weeks

### Setup
- [ ] Create invite codes/access list
- [ ] Setup feedback form (Tally/Typeform)
- [ ] Create feedback Discord/Telegram group
- [ ] Daily check-ins for bugs/issues

### Collect Feedback On
- [ ] Onboarding experience
- [ ] Feature clarity
- [ ] Bugs/crashes
- [ ] Performance
- [ ] Design/UX
- [ ] Missing features

---

# PHASE C: PRE-HUNT PREPARATION (Week 4-5)

## C.1 Fix All Beta Feedback

**Time:** 1 week
- [ ] Critical bugs fixed
- [ ] UX improvements implemented
- [ ] Performance optimized
- [ ] Polish UI details

---

## C.2 Product Hunt Assets

### Required
- [ ] **Tagline:** "Sovereign AI Research Engine - 7 Reasoning Methods, Zero Hallucinations"
- [ ] **Description:** 300-500 words
- [ ] **Logo:** High-res, square format
- [ ] **Gallery Images:** 5-8 screenshots
- [ ] **Demo Video:** 2-3 minutes (Loom/Screen recording)
- [ ] **First Comment:** Founder story + call to action

### Optional
- [ ] GIF preview
- [ ] Comparison chart
- [ ] Testimonials from beta users

---

## C.3 Social Media Setup

### Twitter/X Account
- [ ] Create @AkhAI or @AkhAI_io handle
- [ ] Profile picture (logo)
- [ ] Banner image
- [ ] Bio with website link
- [ ] Pin tweet about launch
- [ ] 10-15 pre-scheduled tweets
- [ ] Follow relevant accounts (AI, tech, founders)

### Content Calendar (Pre-Hunt)
- Day -14: Teaser "Something is coming..."
- Day -10: Feature preview #1 (7 Methodologies)
- Day -7: Feature preview #2 (Grounding Guard)
- Day -5: Feature preview #3 (Tree of Life)
- Day -3: Countdown starts
- Day -1: "Tomorrow we launch" post
- Day 0: LAUNCH POST + Product Hunt link

---

## C.4 Community Setup

### Telegram
- [ ] Create @AkhAI_community group
- [ ] Set rules/welcome message
- [ ] Add moderation bot

### Discord (Optional)
- [ ] Create server
- [ ] Setup channels (#announcements, #feedback, #support)
- [ ] Add verification

---

# PHASE D: COUNTDOWN & PRE-LAUNCH (Week 6)

## D.1 Countdown Page

**URL:** akhai.ai/launch or secure.ai/launch

### Features
- [ ] Countdown timer to launch
- [ ] Email signup for notification
- [ ] Social links
- [ ] Teaser video/GIF
- [ ] "Join the waitlist" CTA

---

## D.2 Email List Building

- [ ] Setup email provider (Resend/Loops/ConvertKit)
- [ ] Create signup form
- [ ] Welcome email sequence
- [ ] Launch notification email ready

---

## D.3 Influencer Outreach

- [ ] List 20-30 relevant Twitter/YouTube creators
- [ ] Prepare personalized DMs
- [ ] Offer early access / exclusive features
- [ ] Schedule posts for launch day

---

# PHASE E: PRODUCT HUNT LAUNCH (Week 7)

## E.1 Launch Day Protocol

### Timing
- **Best Day:** Tuesday or Thursday
- **Best Time:** 12:01 AM PST (for full 24h exposure)

### Launch Day Tasks
- [ ] Submit to Product Hunt at 12:01 AM PST
- [ ] Post on Twitter/X immediately
- [ ] Send email to waitlist
- [ ] Post in Telegram/Discord
- [ ] Engage with EVERY comment on PH
- [ ] Thank EVERY upvoter
- [ ] Post updates throughout day

---

## E.2 Post-Launch (Week 7+)

- [ ] Respond to all feedback
- [ ] Fix any reported bugs immediately
- [ ] Celebrate milestone tweets
- [ ] Write "lessons learned" blog post
- [ ] Plan next features based on feedback

---

# PHASE F: COMMERCIALIZATION (Week 8+)

## F.1 Prerequisites ✓

**ONLY proceed when ALL complete:**
- [ ] ✅ Localhost fully tested
- [ ] ✅ Family/friends beta complete
- [ ] ✅ All critical bugs fixed
- [ ] ✅ Product Hunt launched
- [ ] ✅ Twitter/X active with followers
- [ ] ✅ Community (Telegram/Discord) active
- [ ] ✅ Stripe integration complete
- [ ] ✅ Payment flow tested

---

## F.2 Monetization Activation

### Stripe Integration
- [ ] Connect Stripe account
- [ ] Create products (Pro, Legend, Team)
- [ ] Setup checkout flow
- [ ] Test subscription lifecycle
- [ ] Add invoicing

### Pricing Launch
```
Free:   $0      10 queries/day     ← Active from Day 1
Pro:    $20/mo  Unlimited*         ← Enable after PH launch
Legend: $200/mo Unlimited + Opus   ← Enable after PH launch
Team:   $40/user Enterprise       ← Future
```

---

# TIMELINE SUMMARY

| Phase | Duration | Focus |
|-------|----------|-------|
| **A: Local Completion** | Week 1-2 | SideChat, Depth, Settings, Testing |
| **B: Friends Beta** | Week 3 | Deploy, Feedback, Fixes |
| **C: Pre-Hunt Prep** | Week 4-5 | Assets, Social, Community |
| **D: Countdown** | Week 6 | Hype, Email, Outreach |
| **E: Product Hunt** | Week 7 | LAUNCH 🚀 |
| **F: Commercialize** | Week 8+ | Stripe, Pricing |

---

# CLAUDE CLI COMMANDS

## Command 1: Activate SideChat/MiniChat

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Activate SideChat/MiniChat as floating quick-chat window

1. CHECK existing component:
   - Read components/SideChat.tsx
   - Understand current implementation

2. CREATE floating button component:
   File: components/SideChatButton.tsx
   - Floating button bottom-right (fixed position)
   - Icon: ⚡ or lightning bolt
   - Tooltip: 'Quick Chat (⌘⇧Q)'
   - Click to toggle SideChat panel
   - Keyboard shortcut: Cmd+Shift+Q (Mac) / Ctrl+Shift+Q (Win)

3. CREATE SideChat wrapper/modal:
   File: components/SideChatModal.tsx (if needed)
   - Floating panel (not full modal)
   - Position: bottom-right, 400px wide, 500px tall
   - Draggable (optional)
   - Minimize/close buttons
   - Semi-transparent backdrop (optional, can be none)

4. ADD to layout:
   File: app/layout.tsx
   - Import SideChatButton
   - Add at bottom of body (always visible)
   - Add keyboard listener for shortcut

5. INTEGRATE with chat API:
   - Use existing /api/simple-query/route.ts
   - Or create /api/quick-query/route.ts (simpler, faster)
   - Default to Direct methodology for speed
   - Include Depth Annotations in response

6. STATE MANAGEMENT:
   - Add to existing Zustand store OR
   - Create simple useState in layout
   - Persist open/closed state in localStorage

7. FEATURES:
   - [Push to Main] - Copy conversation to main chat
   - [Copy] - Copy last response
   - [Clear] - Clear mini chat history
   - Context isolation (separate from main chat)

8. STYLING (Code Relic):
   - Grey-only palette
   - Sharp corners (no rounded)
   - Thin 1px borders
   - 9-10px uppercase labels
   - NO emojis in UI

TEST: Verify SideChat opens with button and keyboard shortcut"
```

---

## Command 2: Integrate Depth Annotations

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Wire Depth Annotations into chat interfaces

FILES EXIST (do not recreate):
- lib/depth-annotations.ts (389 lines)
- components/DepthAnnotation.tsx (428 lines)
- hooks/useDepthAnnotations.ts (215 lines)

1. ADD DepthProvider to layout:
   File: app/layout.tsx
   - Import { DepthProvider } from '@/hooks/useDepthAnnotations'
   - Wrap {children} in <DepthProvider>

2. INTEGRATE into main chat:
   File: app/page.tsx
   - Import { StreamingDepthText } from '@/components/DepthAnnotation'
   - Import { useDepthAnnotations } from '@/hooks/useDepthAnnotations'
   - In message rendering, replace raw text with:
     <StreamingDepthText
       text={message.content}
       annotations={annotations}
       isStreaming={message.isStreaming}
       onExpand={(query) => handleNewQuery(query)}
     />
   - Call processChunk(chunk) in streaming handler
   - Call reset() when starting new query

3. INTEGRATE into SideChat:
   File: components/SideChat.tsx (or SideChatModal.tsx)
   - Same integration as main chat
   - Use config={{ density: 'minimal' }} for compact view

4. ADD toggle to settings:
   File: app/settings/page.tsx (or create)
   - Import { useDepthConfig } from '@/hooks/useDepthAnnotations'
   - Add toggle: 'Enable Depth Annotations'
   - Add density selector: Minimal / Standard / Maximum
   - Add type toggles: Facts, Metrics, Connections, Details, Sources

5. SAVE config:
   - Depth config already saves to localStorage
   - Verify persistence across page loads

TEST: 
- Send query with numbers → should show ᵐ metric annotations
- Send query mentioning Kether → should show ᵈ detail annotation
- Toggle depth off → annotations should hide
- Click annotation → should trigger onExpand"
```

---

## Command 3: Expand Settings Page

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Expand Settings page with all configuration options

1. CHECK current settings:
   File: app/settings/page.tsx
   - Understand current structure

2. ADD sections:

   A. APPEARANCE
   - Language selector (use existing LanguageSelector component)
   - Theme: Light/Dark (future, just placeholder)
   
   B. FEATURES
   - Depth Annotations: On/Off toggle
   - Depth Density: Minimal/Standard/Maximum
   - Side Canal: On/Off toggle
   - Quick Chat: On/Off toggle
   - Hebrew Terms: Always explain / On hover / Off
   
   C. AI CONFIGURATION
   - Default Methodology: Auto/Direct/CoD/BoT/ReAct/PoT/GTP
   - Legend Mode: Off / On (when available)
   - Cost Display: Show/Hide per-query cost
   
   D. GROUNDING GUARD (existing)
   - Keep current triggers configuration
   
   E. PRIVACY
   - Analytics: On/Off (PostHog)
   - Save History: On/Off
   - Clear History button
   
   F. API KEYS (Advanced, collapsible)
   - Anthropic API Key (masked input)
   - DeepSeek API Key
   - Mistral API Key
   - xAI API Key
   - Save to localStorage (with warning)

3. STYLING (Code Relic):
   - Sections with uppercase headers
   - Toggle switches (grey palette)
   - Thin borders between sections
   - Compact layout

4. PERSISTENCE:
   - Save all settings to localStorage
   - Load on app init
   - Apply settings globally

TEST: Change settings → reload page → verify persistence"
```

---

*Plan Complete - Ready for Execution*
*AkhAI Launch Sequence v3.0*
