# Cursor Start Prompt - Copy This Into Composer

Hey Cursor, I need your help implementing a comprehensive redesign of the AkhAI web application.

## Context
I have a detailed redesign plan in `REDESIGN_PLAN.md` that transforms our dark-themed AI research platform into a professional white/grey hedge fund-style interface inspired by wickedsmartbitcoin.com.

## What I Need

### Phase 1: Core Theme Migration (Start Here)
Please help me:

1. **Update Global Styles** (`packages/web/app/globals.css`)
   - Replace dark theme CSS variables with white/grey palette
   - Add the new color system from the plan
   - Update base styles for white background

2. **Update Root Layout** (`packages/web/app/layout.tsx`)
   - Remove `dark` class from html element
   - Change body background to white
   - Add Inter and JetBrains Mono fonts

3. **Update Navbar** (`packages/web/components/Navbar.tsx`)
   - White background
   - Grey text (#374151)
   - Minimal 1px bottom border (#E5E7EB)
   - Remove gradient from logo

4. **Update Homepage** (`packages/web/app/page.tsx`)
   - Clean white background
   - Simple grey text for subtitle
   - Minimal search bar styling
   - Clean flow toggle buttons

## Design Specifications

### Color Palette (from REDESIGN_PLAN.md)
```
--color-bg-primary: #ffffff
--color-bg-secondary: #f8f9fa
--color-border: #e5e7eb
--color-text-primary: #374151
--color-text-secondary: #6b7280
--color-text-tertiary: #9ca3af
--color-accent-blue: #3b82f6
--color-accent-green: #10b981
--color-accent-red: #ef4444
```

### Typography Sizes (Super Minimalist)
```
h1: 18px (text-lg)
h2: 16px (text-base)
h3: 14px (text-sm)
body: 13px (text-[13px])
small: 11px (text-[11px])
tiny: 10px (text-[10px])
```

## Approach

1. **Start with globals.css** - Set up the foundation
2. **Then layout.tsx** - Apply to root
3. **Update components one by one** - Test each change
4. **Commit after each component** - Keep changes isolated

## Key Requirements

- ✅ Use Tailwind CSS classes (no custom CSS unless necessary)
- ✅ Maintain all existing functionality
- ✅ Keep responsive design
- ✅ Test after each change
- ✅ Follow the hedge fund aesthetic (data-dense, minimal, professional)

## Reference Files

- Full plan: `REDESIGN_PLAN.md`
- Current working directory: `/Users/sheirraza/akhai/packages/web`
- Components to update are in: `packages/web/components/`
- Pages to update are in: `packages/web/app/`

## Let's Start!

Can you help me implement Phase 1 (Core Theme Migration) starting with `globals.css`? Show me the code changes and I'll review before we proceed.

After we finish Phase 1, we'll move to:
- Phase 2: Homepage Redesign
- Phase 3: Dashboard Redesign
- Phase 4: Trading Dashboard (NEW feature)

Ready when you are! 🚀
