# 🎯 AKHAI NEXT STEPS - MASTER PLAN FOCUS

**Date:** January 1, 2026
**Status:** 76% Complete → Launch Ready

---

## 📋 STAGE 1: FUNCTIONALITY (REMAINING)

### ✅ COMPLETED
| # | Feature | Status |
|---|---------|--------|
| 1 | SideChat/QuickChat | ✅ DONE |
| - | Live Web Search | ✅ DONE |
| - | Depth Annotations (247 patterns) | ✅ DONE |

### ⏳ REMAINING (4 Features)

| # | Feature | Time | Priority | Status |
|---|---------|------|----------|--------|
| 2 | **Depth Annotations UI Integration** | 1h | ⭐⭐⭐ | Validate |
| 3 | **Settings Page Expansion** | 2-3h | ⭐⭐ | Build |
| 4 | **Legend Mode Toggle** | 2-3h | ⭐⭐ | Build |
| 5 | **Stripe Integration** | 3-4h | ⭐⭐ | Build |
| 6 | **Wisdom Points UI** | 3-4h | ⭐ | Build |

**Total Remaining: ~12-15 hours**

---

## 🔥 IMMEDIATE NEXT STEP

### Step 1: Validate Depth Annotations (1 hour)

**What:** Test depth annotations on localhost, then mark as validated

**Test on localhost:3000:**
1. Send a query with technical terms
2. Check if annotations appear beneath terms
3. Verify different annotation types (fact, metric, connection)

**If working, run:**
```bash
curl -X PATCH http://localhost:3000/api/implementations \
  -H 'Content-Type: application/json' \
  -d '{"id": 1, "action": "validate", "message": "Depth annotations working in UI"}'
```

---

## 📝 SEQUENTIAL BUILD COMMANDS

### Command 2: Settings Page Expansion

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Expand Settings page with all configuration options

CREATE/UPDATE: app/settings/page.tsx

SECTIONS:
1. APPEARANCE
   - Theme (dark/light/system) - default dark
   - Font size (small/medium/large)
   - Compact mode toggle

2. METHODOLOGY
   - Default methodology selector (Auto/Direct/CoD/BoT/ReAct/PoT/GTP)
   - Auto-routing toggle
   - Show methodology indicator toggle

3. FEATURES
   - Depth Annotations toggle (on/off)
   - Annotation density (minimal/standard/maximum)
   - Side Canal toggle
   - Mind Map auto-generate toggle

4. AI PROVIDERS
   - Primary provider selector (Anthropic/DeepSeek/Mistral/xAI)
   - API key inputs for each provider
   - Model selector per provider

5. PRIVACY
   - Save history toggle
   - Analytics opt-out toggle
   - Clear all data button

6. ACCOUNT
   - Display current tier (Free/Pro/Legend)
   - Usage stats (queries today, tokens used)
   - Manage subscription link

STYLING:
- Section cards with zinc-900 bg
- Clear labels and descriptions
- Save button at bottom
- Persist to settings-store

After completion, output validation summary."
```

### Command 3: Legend Mode Toggle

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Implement Legend Mode premium tier toggle

1. UPDATE: lib/stores/settings-store.ts
   - Add legendMode: boolean (default false)
   - Add setLegendMode action

2. CREATE: components/LegendModeToggle.tsx
   - Premium badge indicator
   - Toggle switch
   - Tooltip explaining benefits
   - Lock icon if not subscribed

3. UPDATE: app/page.tsx
   - Show Legend Mode indicator when active
   - Golden/amber accent color for Legend

4. UPDATE: app/api/simple-query/route.ts
   - Check legendMode from request
   - If Legend: use Opus 4.5, extended tokens, priority
   - If not: use standard routing

5. LEGEND MODE BENEFITS:
   - Claude Opus 4.5 always
   - Extended context (200K tokens)
   - Priority queue
   - All methodologies unlocked
   - R&D features early access

After completion, output validation summary."
```

### Command 4: Stripe Integration

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Implement Stripe checkout for Pro/Legend subscriptions

1. VERIFY: lib/stripe.ts exists with configuration

2. CREATE: app/api/stripe/checkout/route.ts
   POST handler:
   - Accept: { priceId, tier }
   - Create Stripe checkout session
   - Return: { url } for redirect

3. CREATE: app/api/stripe/webhook/route.ts
   - Handle checkout.session.completed
   - Handle customer.subscription.updated
   - Handle customer.subscription.deleted
   - Update user tier in database

4. CREATE: app/pricing/page.tsx
   - Display 3 tiers (Free/Pro/Legend)
   - Pricing cards with features
   - 'Subscribe' buttons
   - FAQ section

5. CREATE: components/PricingCard.tsx
   - Tier name, price, features list
   - CTA button
   - Popular badge for Pro

6. ADD TO .env.example:
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   STRIPE_PRO_PRICE_ID=
   STRIPE_LEGEND_PRICE_ID=

After completion, output validation summary."
```

### Command 5: Wisdom Points UI

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Create Wisdom Points gamification UI

1. VERIFY: lib/wisdom-points.ts exists

2. CREATE: components/WisdomPointsDisplay.tsx
   - Current points count
   - Level indicator (1-10)
   - Progress bar to next level
   - Small sparkle animation on gain

3. CREATE: components/WisdomPointsModal.tsx
   - Full breakdown of points
   - History of earned points
   - Available rewards
   - Level benefits

4. UPDATE: app/page.tsx
   - Add WisdomPointsDisplay to header area
   - Show +points animation on query complete

5. POINT EARNING:
   - Query submitted: +1
   - Deep research: +5
   - Legend mode query: +10
   - Daily streak: +bonus

6. LEVELS:
   - Level 1: 0 points (Seeker)
   - Level 2: 100 points (Student)
   - Level 3: 500 points (Scholar)
   - Level 4: 1000 points (Sage)
   - Level 5: 5000 points (Master)

After completion, output validation summary."
```

---

## 📊 AFTER FUNCTIONALITY: STAGE 2-5

### Stage 2: Testing (2-3 days)
- Full QA on all features
- Bug fixes
- Performance optimization
- Mobile responsiveness check

### Stage 3: Deployment (1-2 days)
- Deploy to FlokiNET Iceland
- Configure domain
- SSL setup
- Family beta test

### Stage 4: Preparation (3-5 days)
- Product Hunt assets
- Social media setup (@AkhAI)
- Partnership outreach
- Press kit

### Stage 5: Launch
- Product Hunt launch
- Twitter/X announcement
- Telegram community
- Early adopter program

---

## 🎯 TODAY'S FOCUS

1. **First:** Test Depth Annotations on localhost
2. **If working:** Validate in database
3. **Then:** Run Settings Page command
4. **Continue:** Sequential commands

---

## 📈 PROGRESS TRACKER

```
FUNCTIONALITY STAGE:
[██████████████████░░] 90%

Remaining:
├── Depth Annotations UI: Validate ⏳
├── Settings Page: Build ⏳
├── Legend Mode: Build ⏳
├── Stripe: Build ⏳
└── Wisdom Points: Build ⏳
```

---

*Master Plan Focus - No Side Projects*
*January 1, 2026*
