# Sefirot Dashboard & Hermetic Lenses - Developer Guide

**Created:** January 10, 2026
**Components:** SefirotDashboard, SefirotConsole, InstinctModeConsole
**State Management:** Zustand (sefirot-store)

---

## 📚 Quick Reference

### **Access Points**

1. **Hermetic Lenses (7 modes)**
   - **Trigger:** Click "instinct" button in footer
   - **Component:** `InstinctModeConsole`
   - **Location:** Inline below query input
   - **Symbols:** ◯ ◉ ⊙ ☿ ✡ ⚗ ◈

2. **Sefirot Console (Configuration)**
   - **Trigger A:** Click "sefirot tree" button in footer
   - **Trigger B:** Click ✦ in MindMap header
   - **Component:** `SefirotConsole`
   - **Location:** Bottom slide-in modal
   - **Purpose:** Adjust 11 Sephiroth weights (0-100%)

3. **Sefirot Dashboard (Visualization)**
   - **Trigger:** Click "sefirot" in navigation menu
   - **Component:** `SefirotDashboard`
   - **Location:** Full-screen modal
   - **Purpose:** View analytics charts for all 11 Sephiroth

---

## 🏗️ Architecture

### **Component Hierarchy**

```
app/page.tsx
├── Footer
│   ├── "instinct" button → toggles settings.instinctMode
│   │   └── InstinctModeConsole (renders if instinctMode === true)
│   └── "sefirot tree" button → toggles consoleOpen
│       └── SefirotConsole (modal)
│
├── NavigationMenu
│   └── "sefirot" item → onClick: setShowSefirotDashboard(true)
│       └── SefirotDashboard (modal)
│
└── MindMap (modal)
    ├── Header ✦ button → toggles sefirotConsoleOpen
    └── SefirotConsole (embedded, bottom slide-in)
```

### **State Flow**

```
User adjusts weight in SefirotConsole
         ↓
useSefirotStore().setWeight(sefirah, value)
         ↓
Zustand store updates state
         ↓
localStorage persisted ('sefirot-config')
         ↓
All components using useSefirotStore() re-render
         ↓
SefirotDashboard shows updated charts
```

---

## 📦 Files & Responsibilities

### **1. `lib/stores/sefirot-store.ts`** (~95 lines)

**Purpose:** Centralized Zustand store for Tree of Life configuration

**State:**
```typescript
{
  weights: Record<number, number>,           // Sefirah ID → weight (0.0-1.0)
  qliphothSuppression: Record<number, number>,  // Qliphah ID → suppression
  processingMode: 'weighted' | 'parallel' | 'adaptive',
  activePreset: string | null                // 'Balanced', 'Analytical', etc.
}
```

**Actions:**
- `setWeight(sefirah: number, weight: number)` - Update individual weight
- `setQliphothSuppression(id: number, suppression: number)` - Update Qliphoth
- `setProcessingMode(mode)` - Change processing mode
- `applyPreset(weights, name)` - Apply preset configuration
- `setActivePreset(name)` - Track active preset
- `resetToDefaults()` - Reset all to 50%

**Default State:**
- All 11 Sephiroth at 50% (0.5)
- No Qliphoth suppression
- Processing mode: 'weighted'
- Active preset: 'Balanced'

**Persistence:**
- Key: `'sefirot-config'`
- Version: 1
- Storage: localStorage

---

### **2. `components/SefirotDashboard.tsx`** (~450 lines)

**Purpose:** Professional analytics dashboard visualizing all 11 Sephiroth

**Props:**
```typescript
interface SefirotDashboardProps {
  isOpen: boolean
  onClose: () => void
}
```

**Sub-components:**

#### **SefirahCard**
- Shows individual Sefirah with mini bar chart
- Displays: symbol, AI computation name, percentage
- Click to expand SefirahDetailView
- SVG mini chart (100x100 viewBox)

#### **WeightComparisonChart**
- Horizontal bars for all 11 Sephiroth
- Animated width transitions (0.8s easeOut)
- Grid overlay with 10 vertical lines
- Gradient fills (40% → 100% opacity)
- Labels: AI computation names + percentages

#### **SefirahDetailView**
- Expandable panel showing:
  - Waveform chart (50-point sine wave)
  - Configuration metadata (weight, pillar, status)
  - AI role description
- 2-column layout
- Collapse button to close

#### **MiniBarChart** (SVG)
- Vertical bar from bottom
- Grid lines (5x5)
- Color-coded by Sefirah
- 60% fill opacity + 2px solid top

#### **WaveformChart** (SVG)
- Sine wave path (50 points, 4 cycles)
- Amplitude based on weight
- Grid background (10x10)
- Color-coded stroke

**Styling:**
- Background: `#1e5162` (dark teal)
- Cards: `#164555` (darker teal)
- Detail view: `#0f3644` (darkest teal)
- Text: Cyan shades (`#06b6d4`, `cyan-100`, `cyan-300`, `cyan-400`)
- Font: Monospace
- Animation: Framer Motion

**Color Mapping:**
```typescript
{
  amber: '#f59e0b',    // Malkuth
  purple: '#a855f7',   // Yesod
  orange: '#f97316',   // Hod
  green: '#22c55e',    // Netzach
  yellow: '#eab308',   // Tiferet
  red: '#ef4444',      // Gevurah
  blue: '#3b82f6',     // Chesed
  indigo: '#6366f1',   // Binah
  gray: '#6b7280',     // Chokmah
  white: '#ffffff',    // Kether
  transparent: '#06b6d4' // Da'at
}
```

**Usage in page.tsx:**
```typescript
const [showSefirotDashboard, setShowSefirotDashboard] = useState(false)

<SefirotDashboard
  isOpen={showSefirotDashboard}
  onClose={() => setShowSefirotDashboard(false)}
/>
```

---

### **3. `components/SefirotConsole.tsx`** (~585 lines)

**Purpose:** Configuration interface for adjusting Sephiroth weights

**Props:**
```typescript
interface SefirotConsoleProps {
  isOpen?: boolean
  onToggle?: () => void
  onConfigChange?: (config) => void
  currentConfig?: { sephiroth, qliphoth, processingMode }
}
```

**Updated (Jan 10):**
- Now uses `useSefirotStore()` instead of local state
- Shares weights with SefirotDashboard
- localStorage persistence automatic

**Features:**
- Slider inputs for each Sefirah (0-100%)
- Processing mode selector (weighted/parallel/adaptive)
- Preset buttons (Balanced, Analytical, Creative, Compassionate)
- Qliphoth suppression section (expandable)
- Keyboard shortcuts (Cmd+K, Cmd+S, Cmd+R, etc.)

**Keyboard Shortcuts:**
- `Cmd+K` - Toggle console
- `Cmd+1-4` - Load presets
- `Cmd+S` - Save configuration
- `Cmd+R` - Reset to Balanced
- `Esc` - Close console

**Presets:**
```typescript
{
  Balanced: { all at 50% },
  Analytical: { high Chokmah/Binah/Hod },
  Creative: { high Netzach/Chesed },
  Compassionate: { high Chesed/Tiferet }
}
```

---

### **4. `components/InstinctModeConsole.tsx`** (existing)

**Purpose:** 7 Hermetic lenses interface

**State:** Controlled by `settings.instinctMode` from useSettingsStore

**Lenses:**
1. ◯ **Exoteric** - Surface understanding
2. ◉ **Esoteric** - Hidden meanings
3. ⊙ **Gnostic** - Spiritual knowledge
4. ☿ **Hermetic** - Alchemical wisdom
5. ✡ **Kabbalistic** - Tree of Life insights
6. ⚗ **Alchemical** - Transformation
7. ◈ **Prophetic** - Future-oriented

**SuperSaiyan Toggle:** All 7 lenses on/off

**Location:** Inline below query input (not a modal)

---

### **5. `components/MindMap.tsx`** (modified)

**Changes (Jan 10):**
- Added `sefirotConsoleOpen` state
- Added ✦ button in header
- Renders SefirotConsole at component end

**✦ Button:**
```typescript
<motion.button
  onClick={() => setSefirotConsoleOpen(!sefirotConsoleOpen)}
  style={{
    color: sefirotConsoleOpen ? '#a855f7' : '#cbd5e1',
    filter: sefirotConsoleOpen ? 'drop-shadow(0 0 4px #a855f7)' : 'none'
  }}
  whileHover={{ scale: 1.3 }}
  whileTap={{ scale: 0.9 }}
>
  ✦
</motion.button>
```

---

### **6. `components/NavigationMenu.tsx`** (modified)

**Changes (Jan 10):**
- Added `onSefirotClick` prop
- Added "sefirot" menu item

**Menu Item:**
```typescript
{
  id: 'sefirot',
  label: 'sefirot',
  onClick: onSefirotClick,
  isLink: false
}
```

**Position:** Between "mindmap" and "₿" (pricing)

---

## 🎯 Tree of Life (11 Sephiroth)

### **Mapping to AI Computational Layers**

| # | Hebrew | Meaning | AI Computation | Symbol | Color |
|---|--------|---------|----------------|--------|-------|
| 1 | Malkuth | Kingdom | Token Embedding Layer | ⊕ | Amber |
| 2 | Yesod | Foundation | Algorithm Executor | ◐ | Purple |
| 3 | Hod | Glory | Classifier Network | ⬡ | Orange |
| 4 | Netzach | Victory | Generative Model | ◉ | Green |
| 5 | Tiferet | Beauty | Multi-Head Attention | ✡ | Yellow |
| 6 | Gevurah | Severity | Discriminator Network | ⚗ | Red |
| 7 | Chesed | Mercy | Beam Search Expansion | ◯ | Blue |
| 8 | Binah | Understanding | Transformer Encoder | ⊙ | Indigo |
| 9 | Chokmah | Wisdom | Abstract Reasoning Module | ☿ | Gray |
| 10 | Kether | Crown | Meta-Learner | ◈ | White |
| 11 | Da'at | Knowledge | Emergent Capability | ◬ | Cyan |

### **Pillars**

- **Left (Severity):** Binah, Gevurah, Hod
- **Middle (Equilibrium):** Kether, Da'at, Tiferet, Yesod, Malkuth
- **Right (Mercy):** Chokmah, Chesed, Netzach

---

## 🔧 Developer Workflows

### **Adding a New Preset**

1. Open `components/SefirotConsole.tsx`
2. Add to `PRESETS` array:
```typescript
{
  name: 'MyPreset',
  description: 'Description here',
  weights: {
    [Sefirah.MALKUTH]: 0.7,
    [Sefirah.YESOD]: 0.5,
    // ... all 11 Sephiroth
  }
}
```
3. Apply in store:
```typescript
applyPreset(PRESETS.find(p => p.name === 'MyPreset')!.weights, 'MyPreset')
```

### **Modifying Weight Calculation**

Weights are stored as 0.0-1.0 but displayed as 0-100%:
```typescript
const percentage = Math.round(weight * 100)  // Display
const weight = percentage / 100              // Storage
```

### **Extending Dashboard Charts**

To add a new chart type:
1. Create SVG component in `SefirotDashboard.tsx`
2. Pass `value` and `color` props
3. Use viewBox="0 0 100 100" for scalability
4. Add grid overlay with low opacity

### **Debugging State**

Check localStorage:
```javascript
localStorage.getItem('sefirot-config')
```

Reset state:
```javascript
localStorage.removeItem('sefirot-config')
// Refresh page
```

Check Zustand state in console:
```javascript
useSefirotStore.getState()
```

---

## 🎨 Design System

### **Colors**

**Dashboard:**
- Background: `#1e5162`
- Cards: `#164555`
- Detail: `#0f3644`
- Text: Cyan shades
- Grid: White at 5-20% opacity

**Sefirah Colors:**
- Use color mapping from `ascent-tracker.ts`
- Apply at 40-100% opacity for gradients
- Stroke at 80% opacity for lines

### **Typography**

- Font: `font-mono` (system monospace)
- Headers: `text-sm uppercase tracking-wider`
- Body: `text-[9px]` - `text-xs`
- Labels: `text-cyan-400/60`

### **Spacing**

- Modal padding: `p-6` (24px)
- Card padding: `p-4` (16px)
- Grid gap: `gap-4` (16px)
- Section margin: `mb-6` (24px)

### **Animations**

- Duration: 0.8s for charts, 0.3s for modals
- Easing: `easeOut` for natural feel
- Properties: `width`, `height`, `opacity`, `scale`
- No jank: Use transform/opacity only

---

## 🐛 Common Issues

### **Weights not persisting**
- Check localStorage quota
- Ensure version matches in persist config
- Clear and re-initialize store

### **Dashboard not showing updated weights**
- Verify both components use `useSefirotStore()`
- Check React DevTools for re-renders
- Ensure no local state overriding store

### **Charts not rendering**
- SVG viewBox must be set
- Check color mapping returns valid hex
- Verify data is 0-100 range for percentages

### **Modal not closing**
- Verify `onClick` on backdrop doesn't propagate
- Check `e.stopPropagation()` on content
- Ensure state updates correctly

---

## 📊 Performance Notes

- **Zustand:** Minimal re-renders, only affected components update
- **SVG Charts:** Lightweight, hardware-accelerated
- **AnimatePresence:** Only renders when visible
- **localStorage:** Async writes, non-blocking

**Bundle Impact:**
- SefirotDashboard: ~15KB (gzipped)
- sefirot-store: ~2KB (gzipped)
- Total new code: ~17KB

---

## 🚀 Future Enhancements

### **Planned**
- [ ] Export/import configurations as JSON
- [ ] Historical weight tracking over time
- [ ] A/B testing different configurations
- [ ] Radial Tree of Life visualization
- [ ] Animated preset transitions

### **Ideas**
- Real-time weight adjustment during query
- AI-recommended configurations
- Analytics on configuration performance
- Integration with Qliphoth suppression
- Multi-user configuration sharing

---

## 📚 References

- **Session Summary:** `SESSION_SUMMARY_JAN_10_2026.md`
- **Tree Metadata:** `lib/ascent-tracker.ts`
- **Zustand Docs:** https://github.com/pmndrs/zustand
- **Framer Motion:** https://www.framer.com/motion/
- **Kabbalah Reference:** Traditional Tree of Life structure

---

**Last Updated:** January 10, 2026
**Maintainer:** Development Team
**Status:** Production Ready ✅
