# Profile Minimalist Redesign - December 31, 2025

**Status:** ✅ COMPLETE
**Approach:** Raw, minimalist, AkhAI Code Relic aesthetic

---

## Design Changes

### Before → After

**Text Sizes:**
- Headers: 14px → 10px
- Data: 24px → 14px (sm)
- Labels: 12px → 9px
- Metadata: 10px → 9px

**Colors:**
- ❌ Orange/Amber removed
- ✅ Grey-only palette (relic-slate, relic-silver, relic-mist)

**Borders:**
- ❌ Rounded corners removed
- ✅ Sharp rectangular borders

**Spacing:**
- Padding: p-6 → p-4
- Gaps: gap-6 → gap-4
- Margins reduced throughout

**Progress Bars:**
- Height: 2px → 1px (methodology bars)
- Height: 2px → 2px (level progress bar)
- No rounded corners

---

## Single Character Symbols

**Level Indicators:**
```
L1-L2:  · (middle dot)
L3-L4:  • (bullet)
L5-L9:  ◊ (diamond)
L10:    ◊ (diamond)
```

**Dropdown Menu:**
```
profile:       ◊
chat history:  ·
mind map:      ○
development:   ◊
```

**No emojis anywhere** - replaced with single characters

---

## Components Updated

### 1. Development Tab (`app/profile/page.tsx`)

**Development Level:**
```
┌─────────────────────────────────────┐
│ DEVELOPMENT LEVEL                   │
│                                     │
│ L1    0 / 10 pts              ·     │
│ ──────────────────────────────────  │
└─────────────────────────────────────┘
```

**Token Consumption:**
```
┌─────────────────────────────────────┐
│ TOKEN CONSUMPTION                   │
│                                     │
│ queries     tokens        cost      │
│ 66          70,469        $1.61     │
└─────────────────────────────────────┘
```

**Methodology Usage:**
```
┌─────────────────────────────────────┐
│ METHODOLOGY USAGE                   │
│                                     │
│ direct  ───────── 52  30299  $0.93 │
│ gtp     ──        6   26669  $0.34 │
│ cod     ─         3   5090   $0.22 │
└─────────────────────────────────────┘
```

**Points System:**
```
┌─────────────────────────────────────┐
│ POINTS SYSTEM                       │
│                                     │
│ • 1 pt per query                    │
│ • bonus for advanced methods        │
│ • tournaments coming soon           │
└─────────────────────────────────────┘
```

**Recent Activity:**
```
┌─────────────────────────────────────┐
│ RECENT 30D                          │
│                                     │
│ 2025-12-30    5q  3456t   $0.045   │
│ 2025-12-29    3q  2100t   $0.032   │
└─────────────────────────────────────┘
```

### 2. User Dropdown (`components/UserProfile.tsx`)

**Menu:**
```
┌──────────────────┐
│ ◊ profile        │
│ · chat history   │
│ ○ mind map       │
│ ◊ development    │
└──────────────────┘
```

**Size:** 192px wide (w-40)
**Padding:** 12px horizontal, 8px vertical
**Font:** 10px monospace
**Border:** 1px solid relic-mist

### 3. Tab Badge

**Before:**
```
Development [L1]  ← rounded, amber bg
```

**After:**
```
Development [L1]  ← sharp, grey bg
```

---

## CSS Classes Used

### Text Sizes:
- `text-[10px]` - Section headers
- `text-[9px]` - Labels, metadata
- `text-sm` - Data values
- `text-lg` - Level number only

### Colors:
- `text-relic-slate` - Main text (#64748b)
- `text-relic-silver` - Secondary (#94a3b8)
- `text-relic-mist` - Tertiary (#cbd5e1)
- `bg-relic-ghost` - Light background (#f1f5f9)
- `bg-white` - Card backgrounds
- `border-relic-mist` - Borders

### Spacing:
- `p-4` - Card padding
- `mb-3` - Section margins
- `gap-3` - Grid gaps
- `space-y-2` - Vertical spacing

### Layout:
- No rounded corners (removed all `rounded-lg`, `rounded-full`)
- 1px borders (`border` instead of `border-2`)
- Minimal shadows (removed `shadow-lg`)

---

## Typography

**All text uses:**
- `font-mono` - Monospace font family
- `uppercase` - Section headers
- `tracking-[0.2em]` - Letter spacing for headers
- `tracking-wider` - Letter spacing for labels

**Font weights:**
- Default (400) for most text
- `font-light` (300) for level number

---

## Comparison

### Old Design (Colorful):
- Large orange "Level 1" with emoji
- Rounded progress bars with amber fill
- Large padding and spacing
- Colorful badges (green, amber, red)
- 14px+ text throughout

### New Design (Minimalist):
- Small "L1" with single character
- Thin 1-2px grey progress bars
- Compact padding (p-4)
- Grey-only color scheme
- 9-10px text, 14px data

---

## File Changes

**Modified Files:**
1. `app/profile/page.tsx` (lines 297-402)
   - Rewrote entire Development tab
   - Reduced all text sizes
   - Removed emojis
   - Changed colors to grey-only
   - Sharp borders

2. `components/UserProfile.tsx` (lines 52-100)
   - Updated dropdown menu items
   - Changed icons to single characters
   - Reduced menu size (w-48 → w-40)
   - Smaller text (text-xs → text-[10px])
   - Thinner border (border-2 → border)

**Lines Changed:** ~150 lines total

---

## Testing

### Visual Verification:
```bash
# Visit profile page
http://localhost:3000/profile?tab=development

# Expected:
✓ No emojis anywhere
✓ All text 9-10px except data (14px)
✓ Grey-only colors
✓ Sharp rectangular borders
✓ Compact layout
✓ Single char symbols (◊ • · ○)
```

### Dropdown Menu:
```bash
# Click username in top right
# Expected:
✓ Small menu (160px wide)
✓ 10px text
✓ Single char icons
✓ lowercase labels
✓ Clean hover states
```

### Tab Badge:
```bash
# Development tab label
# Expected:
✓ Small badge with "L1"
✓ Grey background
✓ Sharp corners
✓ 9px text
```

---

## Code Relic Aesthetic Achieved

✅ **Raw minimalism** - No decoration, pure function
✅ **Grey-only palette** - Professional, focused
✅ **Tiny text** - Dense information display
✅ **Sharp edges** - No rounded corners
✅ **Single symbols** - ◊ • · ○ instead of emojis
✅ **Monospace** - Technical, precise
✅ **Uppercase headers** - Clear hierarchy
✅ **Thin borders** - Subtle separation
✅ **Compact spacing** - Efficient use of space
✅ **Clean data** - Numbers speak for themselves

---

## Summary

**From:** Colorful, emoji-filled, large text design
**To:** Raw, minimalist, grey-only, tiny text design

**Matches AkhAI philosophy:**
- Sovereign intelligence (no decoration)
- Zero hallucination (clear data)
- Professional minimalism
- Code Relic aesthetic

**User can now see:**
- Development level (L1-L10)
- Token consumption (queries, tokens, cost)
- Methodology breakdown (usage stats)
- Recent activity (30 days)
- Points system foundation

All in a clean, compact, professional interface.

---

*Updated: December 31, 2025*
*AkhAI - Sovereign Intelligence - Zero Hallucination Tolerance*
