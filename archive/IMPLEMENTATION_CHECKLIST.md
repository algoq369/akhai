# AkhAI Redesign - Implementation Checklist

## Phase 1: Core Theme Migration

### Global Styles
- [ ] Update `packages/web/app/globals.css`
  - [ ] Add new CSS variables (white/grey color palette)
  - [ ] Update base body styles
  - [ ] Add Inter and JetBrains Mono font imports
  - [ ] Remove dark theme variables

### Root Layout
- [ ] Update `packages/web/app/layout.tsx`
  - [ ] Remove `className="dark"` from html element
  - [ ] Change body to `bg-white text-gray-700`
  - [ ] Add Google Fonts link for Inter & JetBrains Mono
  - [ ] Test page loads with white background

### Navigation
- [ ] Update `packages/web/components/Navbar.tsx`
  - [ ] Background: `bg-white border-b border-gray-200`
  - [ ] Logo: Remove gradient, use `text-gray-700`
  - [ ] Links: `text-gray-600 hover:text-gray-900`
  - [ ] Test navigation works

## Phase 2: Homepage Redesign

- [ ] Update `packages/web/app/page.tsx`
  - [ ] White background instead of dark
  - [ ] Grey subtitle text
  - [ ] Minimal hero section
  - [ ] Test search functionality

- [ ] Update `packages/web/components/SearchBar.tsx`
  - [ ] White background, grey border
  - [ ] Blue focus ring
  - [ ] Grey placeholder text
  - [ ] Test input and submission

- [ ] Update `packages/web/components/FlowToggle.tsx`
  - [ ] Radio button style with grey borders
  - [ ] Blue fill when selected
  - [ ] Small text (11px)
  - [ ] Test toggle switching

## Phase 3: Dashboard Redesign

- [ ] Update `packages/web/app/dashboard/page.tsx`
  - [ ] White background layout
  - [ ] Hedge fund style header
  - [ ] Minimal padding and spacing
  - [ ] Test data loading

- [ ] Update `packages/web/components/StatCard.tsx`
  - [ ] White card with grey border
  - [ ] Monospace numbers
  - [ ] Small labels (11px)
  - [ ] Subtle shadow
  - [ ] Test metrics display

- [ ] Update `packages/web/components/ProviderCard.tsx`
  - [ ] Table-style layout
  - [ ] Monospace for numbers
  - [ ] Alternating row colors
  - [ ] Test provider stats

- [ ] Update `packages/web/components/RecentQueriesList.tsx`
  - [ ] White background
  - [ ] Grey borders
  - [ ] Small status badges
  - [ ] Test query list and linking

## Phase 4: Settings Page

- [ ] Update `packages/web/app/settings/page.tsx`
  - [ ] White background
  - [ ] Grey form inputs
  - [ ] Blue action buttons
  - [ ] Test API key management

## Phase 5: Query Results Page

- [ ] Update `packages/web/app/query/[id]/page.tsx`
  - [ ] White background
  - [ ] Clean header
  - [ ] Test query display

- [ ] Update `packages/web/components/VerificationWindow.tsx`
  - [ ] White cards for rounds
  - [ ] Grey borders
  - [ ] Small text sizes
  - [ ] Test real-time updates

## Phase 6: Trading Dashboard (NEW FEATURE)

- [ ] Create new route `packages/web/app/trading/page.tsx`
  - [ ] Basic layout structure
  - [ ] Header with symbol and price
  - [ ] Grid layout for indicators

- [ ] Create `packages/web/components/trading/MarketProfile.tsx`
  - [ ] Mock data structure
  - [ ] Histogram visualization
  - [ ] POC and Value Area display

- [ ] Create `packages/web/components/trading/OrderFlowIndicator.tsx`
  - [ ] Buy/Sell delta
  - [ ] Order book imbalance
  - [ ] Large orders list

- [ ] Create `packages/web/components/trading/ExecutionMetrics.tsx`
  - [ ] Slippage metric
  - [ ] Fill rate percentage
  - [ ] Latency display
  - [ ] Recent trades table

- [ ] Create `packages/web/components/trading/ContextIndicators.tsx`
  - [ ] Trend indicator
  - [ ] Volatility gauge
  - [ ] Liquidity score
  - [ ] Market regime badge

- [ ] Create `packages/web/components/trading/TradingChart.tsx`
  - [ ] TradingView widget integration
  - [ ] Symbol configuration
  - [ ] Timeframe controls

- [ ] Create `packages/web/lib/trading-data.ts`
  - [ ] Mock data exports
  - [ ] TypeScript interfaces
  - [ ] Data formatting utilities

## Testing

### Visual Testing
- [ ] Homepage looks clean and minimal
- [ ] Dashboard is data-dense and professional
- [ ] Settings page is functional
- [ ] Query results page displays correctly
- [ ] Trading dashboard renders (if implemented)
- [ ] All pages are white background with grey text
- [ ] No dark mode remnants

### Functional Testing
- [ ] Search works and creates queries
- [ ] Flow A/B selection works
- [ ] Dashboard auto-refreshes
- [ ] Settings can save API keys
- [ ] Query detail page loads historical queries
- [ ] Real-time events show in verification window
- [ ] Token usage tracked correctly

### Responsive Testing
- [ ] Mobile view (< 640px)
- [ ] Tablet view (640px - 1024px)
- [ ] Desktop view (> 1024px)

### Performance Testing
- [ ] Page load time < 2s
- [ ] No console errors
- [ ] No layout shifts
- [ ] Smooth animations

## Deployment

- [ ] Run `pnpm build` - no errors
- [ ] Test production build locally
- [ ] Review all changes in staging
- [ ] Get user approval
- [ ] Deploy to production

## Git Workflow

```bash
# Create branch
git checkout -b redesign-hedge-fund-ui

# Commit after each phase
git add .
git commit -m "Phase 1: Core theme migration to white/grey"

git add .
git commit -m "Phase 2: Homepage redesign - minimal white theme"

git add .
git commit -m "Phase 3: Dashboard redesign - hedge fund style"

# etc...

# When complete
git push origin redesign-hedge-fund-ui
# Create PR for review
```

## Notes

- Test after EACH component change
- Commit frequently with descriptive messages
- Keep the plan document (`REDESIGN_PLAN.md`) as reference
- If something breaks, revert that commit and try again
- Ask questions before making breaking changes

---

**Status**: Ready to start Phase 1
**Last Updated**: 2025-12-14
