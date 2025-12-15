# AkhAI Hedge Fund Style Redesign Plan

## Executive Summary
Transform AkhAI from dark theme to professional white/grey hedge fund-style interface inspired by wickedsmartbitcoin.com, with advanced crypto trading indicators including market profile, order flow, and execution metrics.

---

## Phase 1: Color Scheme & Typography Overhaul

### Color Palette
```
Primary Background: #FFFFFF (pure white)
Secondary Background: #F8F9FA (light grey for cards)
Border Color: #E5E7EB (subtle grey borders)
Text Primary: #374151 (dark grey - body text)
Text Secondary: #6B7280 (medium grey - labels)
Text Tertiary: #9CA3AF (light grey - metadata)
Accent Blue: #3B82F6 (primary actions)
Accent Green: #10B981 (positive metrics)
Accent Red: #EF4444 (negative metrics)
Accent Orange: #F59E0B (warnings/pending)
```

### Typography
```css
Font Family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Headings: 500-600 weight, tight letter spacing
Body: 400 weight, comfortable line height (1.5)
Monospace (for numbers): 'JetBrains Mono', 'SF Mono', monospace
```

### Size Scale (Super Minimalist)
```
h1: 18px (1.125rem)
h2: 16px (1rem)
h3: 14px (0.875rem)
body: 13px (0.8125rem)
small: 11px (0.6875rem)
tiny: 10px (0.625rem)
```

---

## Phase 2: Homepage Redesign

### Layout Structure
```
┌─────────────────────────────────────────┐
│ Navbar (white bg, grey border)         │
├─────────────────────────────────────────┤
│                                         │
│        AkhAI                            │
│        Super Research Engine            │
│                                         │
│  [Search Input - minimal border]        │
│  [Flow A] [Flow B]                      │
│                                         │
│  Powered by 4 AI Providers              │
│                                         │
└─────────────────────────────────────────┘
```

### Component Updates
- **Navbar**: White background, grey text, minimal 1px border bottom
- **Logo**: Simple text, no gradient, grey color (#374151)
- **Search Bar**: White background, grey border, focus state with blue outline
- **Flow Toggle**: Radio buttons with grey borders, blue fill when selected
- **Footer Text**: Small grey text (11px), no emojis

---

## Phase 3: Dashboard - Hedge Fund Style

### Dashboard Layout
```
┌──────────────────────────────────────────────────────────┐
│ AkhAI Dashboard                          Last Update: ... │
├──────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│ │ Total Queries│ │ Total Tokens│ │ Total Cost  │         │
│ │    24        │ │   125.4K    │ │  $2.45      │         │
│ └─────────────┘ └─────────────┘ └─────────────┘         │
├──────────────────────────────────────────────────────────┤
│ AI Provider Performance                                   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Anthropic    12 queries  │ 52.3K tokens │ $1.20     │ │
│ │ DeepSeek      8 queries  │ 38.1K tokens │ $0.45     │ │
│ │ Grok / xAI    7 queries  │ 21.5K tokens │ $0.55     │ │
│ │ OpenRouter    6 queries  │ 13.5K tokens │ $0.25     │ │
│ └──────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│ Recent Queries                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ What is Bitcoin? | Flow A | Complete | 2m ago       │ │
│ │ Market analysis  | Flow B | Complete | 5m ago       │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Style Specifications
- **Cards**: White background, 1px grey border, 2px border-radius, subtle shadow
- **Metrics**: Monospace font for numbers, large (24px) for primary metrics
- **Tables**: Alternating row colors (#F9FAFB), no vertical borders
- **Status Badges**: Small (10px text), grey borders, colored background with 10% opacity

---

## Phase 4: Advanced Trading Indicators (NEW FEATURE)

### New Route: `/trading` - Crypto Trading Dashboard

#### Indicator Components to Build

##### 1. Market Profile Component
```typescript
interface MarketProfile {
  timeframe: '1h' | '4h' | '1d';
  valueArea: {
    high: number;
    low: number;
    poc: number; // Point of Control
  };
  volume: {
    buyVolume: number;
    sellVolume: number;
    delta: number;
  };
}
```

**Visual**: Horizontal histogram showing price levels and volume distribution

##### 2. Order Flow Component
```typescript
interface OrderFlow {
  bidAskSpread: number;
  orderBookImbalance: number; // Ratio of buy vs sell orders
  largeOrders: {
    price: number;
    size: number;
    side: 'buy' | 'sell';
    timestamp: number;
  }[];
  cumulativeDelta: number;
}
```

**Visual**: Real-time order flow chart with buy/sell pressure indicators

##### 3. Execution Metrics Component
```typescript
interface ExecutionMetrics {
  averageSlippage: number; // Percentage
  fillRate: number; // Percentage of orders filled
  averageLatency: number; // Milliseconds
  recentTrades: {
    symbol: string;
    price: number;
    size: number;
    side: 'buy' | 'sell';
    timestamp: number;
  }[];
}
```

**Visual**: Table with execution quality metrics

##### 4. Context Indicators
```typescript
interface ContextIndicators {
  trend: {
    direction: 'up' | 'down' | 'sideways';
    strength: number; // 0-100
  };
  volatility: {
    current: number;
    percentile: number; // Historical percentile
  };
  liquidityScore: number; // 0-100
  marketRegime: 'trending' | 'ranging' | 'volatile';
}
```

**Visual**: Gauge charts and status indicators

#### Trading Dashboard Layout
```
┌──────────────────────────────────────────────────────────┐
│ Trading Dashboard                BTC/USD    $43,250.00   │
├──────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌──────────────────────────────────┐ │
│ │ Market Profile  │ │ Primary Chart (TradingView)      │ │
│ │                 │ │                                  │ │
│ │ [Histogram]     │ │ [Price Chart with Indicators]    │ │
│ │                 │ │                                  │ │
│ │ POC: $43,200    │ │                                  │ │
│ │ VA High: $43,500│ │                                  │ │
│ │ VA Low: $42,900 │ │                                  │ │
│ └─────────────────┘ └──────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│ │ Order Flow     │ │ Execution    │ │ Context         │ │
│ │                │ │              │ │                 │ │
│ │ Buy/Sell Delta│ │ Avg Slippage │ │ Trend: Up ↑     │ │
│ │ +1,234 BTC    │ │ 0.02%        │ │ Strength: 75/100│ │
│ │               │ │              │ │                 │ │
│ │ Imbalance     │ │ Fill Rate    │ │ Volatility: Med │ │
│ │ 1.35 (Buy)    │ │ 98.5%        │ │ Regime: Trending│ │
│ └────────────────┘ └──────────────┘ └─────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 5: Settings Page Redesign

### White Theme
- Background: White
- Input fields: Light grey background (#F9FAFB), grey border
- Labels: Dark grey (#374151)
- Test buttons: Blue outline, white background
- Success/Error states: Green/Red borders and text

---

## Phase 6: Technical Implementation Plan

### Files to Modify

#### 1. Global Styles (`app/globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f8f9fa;
    --color-border: #e5e7eb;
    --color-text-primary: #374151;
    --color-text-secondary: #6b7280;
    --color-text-tertiary: #9ca3af;
    --color-accent-blue: #3b82f6;
    --color-accent-green: #10b981;
    --color-accent-red: #ef4444;
  }

  body {
    @apply bg-white text-gray-700 text-[13px] antialiased;
  }
}
```

#### 2. Layout (`app/layout.tsx`)
- Remove `dark` class from html
- Change body background to `bg-white`

#### 3. Components to Update
```
components/
├── Navbar.tsx          → White background, grey text, minimal border
├── SearchBar.tsx       → White input, grey border, blue focus ring
├── FlowToggle.tsx      → Radio buttons with grey/blue styling
├── StatCard.tsx        → White cards, grey borders, subtle shadows
├── ProviderCard.tsx    → Tabular layout, monospace numbers
├── RecentQueriesList.tsx → White background, grey borders
└── VerificationWindow.tsx → White cards, grey text
```

#### 4. Pages to Update
```
app/
├── page.tsx            → Homepage with new minimal design
├── dashboard/page.tsx  → Hedge fund style dashboard
├── settings/page.tsx   → White theme settings
└── trading/page.tsx    → NEW - Trading indicators dashboard
```

#### 5. New Components to Create
```
components/trading/
├── MarketProfile.tsx       → Market profile histogram
├── OrderFlowIndicator.tsx  → Order flow metrics
├── ExecutionMetrics.tsx    → Execution quality table
├── ContextIndicators.tsx   → Trend/volatility/regime indicators
└── TradingChart.tsx        → Integrate TradingView widget
```

---

## Phase 7: Data Integration

### Mock Data Structure (for prototyping)
```typescript
// lib/trading-data.ts
export const mockTradingData = {
  marketProfile: {
    timeframe: '1d',
    valueArea: { high: 43500, low: 42900, poc: 43200 },
    volume: { buyVolume: 1250, sellVolume: 1016, delta: 234 }
  },
  orderFlow: {
    bidAskSpread: 0.05,
    orderBookImbalance: 1.35,
    cumulativeDelta: 1234,
    largeOrders: [...]
  },
  execution: {
    averageSlippage: 0.02,
    fillRate: 98.5,
    averageLatency: 45,
    recentTrades: [...]
  },
  context: {
    trend: { direction: 'up', strength: 75 },
    volatility: { current: 0.025, percentile: 65 },
    liquidityScore: 82,
    marketRegime: 'trending'
  }
};
```

### Real Data Sources (Future Integration)
- **Market Profile**: CoinGecko API, Binance API
- **Order Flow**: WebSocket feeds from exchanges
- **Execution**: Track via AlgoQbot integration
- **Context**: Calculate from price data + technical indicators

---

## Phase 8: Implementation Steps

### Step 1: Core Theme Migration (2-3 hours)
1. Update `globals.css` with new color variables
2. Remove dark mode from `layout.tsx`
3. Update all `className` strings from dark colors to white/grey
4. Test across all pages for consistency

### Step 2: Homepage Redesign (1-2 hours)
1. Simplify hero section
2. Update SearchBar component
3. Redesign FlowToggle component
4. Remove gradients and emojis

### Step 3: Dashboard Redesign (2-3 hours)
1. Rebuild StatCard with white theme
2. Convert ProviderCard to table layout
3. Update RecentQueriesList styling
4. Add monospace fonts for numbers

### Step 4: Settings Page (1 hour)
1. Update form styling
2. Change input backgrounds to light grey
3. Update button styles

### Step 5: Trading Dashboard - MVP (4-6 hours)
1. Create `/trading` route
2. Build basic layout structure
3. Create MarketProfile component (mock data)
4. Create OrderFlow component (mock data)
5. Create ExecutionMetrics component (mock data)
6. Create ContextIndicators component (mock data)
7. Add TradingView widget integration

### Step 6: Data Integration (Future)
1. Connect to real crypto APIs
2. Set up WebSocket connections
3. Implement data caching
4. Add real-time updates

---

## Design Assets Needed

### Icons
- Use Heroicons (outline style) for consistency
- Trading indicators: Custom SVG charts

### Charts
- **TradingView**: Embed lightweight charts widget
- **Recharts**: For custom histograms and gauges
- **D3.js** (optional): For advanced visualizations

### Fonts
```html
<!-- In app/layout.tsx -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Success Metrics

### Visual Quality
- [ ] Clean white background throughout
- [ ] Consistent grey text hierarchy
- [ ] Minimal borders (1px, grey)
- [ ] No gradients or dark backgrounds
- [ ] Monospace numbers in metrics
- [ ] Super small typography (10-14px range)

### Functional Requirements
- [ ] All existing features work with new theme
- [ ] Trading dashboard displays mock indicators
- [ ] Responsive on mobile/tablet
- [ ] Fast page loads (<2s)
- [ ] Accessible (WCAG AA minimum)

### Hedge Fund Aesthetic
- [ ] Professional, data-dense layouts
- [ ] Institutional feel (like Bloomberg Terminal)
- [ ] Focus on numbers and metrics
- [ ] Minimal decorative elements
- [ ] Clean, scannable information hierarchy

---

## Risk Assessment

### Low Risk
- Color scheme changes
- Typography updates
- Component styling

### Medium Risk
- Layout restructuring
- New routing for trading dashboard
- Chart library integration

### High Risk
- Real-time data integration
- WebSocket connections for order flow
- Performance with multiple live charts

---

## Timeline Estimate

### Phase 1-4 (Core Redesign): 1-2 days
- Theme migration
- Homepage, Dashboard, Settings redesign
- Testing and refinement

### Phase 5 (Trading Dashboard MVP): 1 day
- Layout and components with mock data
- TradingView integration

### Phase 6 (Real Data): 2-3 days (future sprint)
- API integrations
- WebSocket setup
- Data caching and optimization

**Total MVP: 2-3 days of focused development**

---

## Next Steps

1. **Review this plan** with Claude Code and Cursor
2. **Approve design direction** and color scheme
3. **Start with Phase 1** (Core Theme Migration)
4. **Iterate on feedback** after each phase
5. **Deploy to staging** for user testing

---

## Notes for Cursor Implementation

### Recommended Approach
1. Create a new branch: `git checkout -b redesign-hedge-fund-ui`
2. Start with globals.css and layout changes
3. Update components one by one, testing each
4. Use Tailwind CSS classes for consistency
5. Commit frequently with descriptive messages

### Key Tailwind Classes to Use
```
Backgrounds: bg-white, bg-gray-50, bg-gray-100
Text: text-gray-700, text-gray-600, text-gray-500
Borders: border-gray-200, border-gray-300
Shadows: shadow-sm, shadow
Rounded: rounded-sm, rounded-md
Text Sizes: text-[10px], text-[11px], text-[13px]
```

### Testing Checklist
- [ ] Homepage loads correctly
- [ ] Dashboard displays all metrics
- [ ] Settings page functional
- [ ] Query results page works
- [ ] Trading dashboard renders (new feature)
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance metrics acceptable

---

*End of Redesign Plan*
*Version: 1.0*
*Date: 2025-12-14*
